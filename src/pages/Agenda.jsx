import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import { cambiarEstado, listarMias } from "../services/citaService";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import EstadoVacio from "../components/ui/EstadoVacio";
import InsigniaEstado from "../components/ui/InsigniaEstado";
import { ESTADOS_CITA, estaCerrada, formatearFecha, formatearHora } from "../utils/citas";

// Agenda del profesional. Uso GET /citas/mias porque el backend ya devuelve al
// nutricionista solo las citas de su propia agenda.
export default function Agenda() {
  const { token } = useSesion();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  // Recuerdo qué fila está esperando respuesta para desactivar sus botones.
  const [enCurso, setEnCurso] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    listarMias(token)
      .then((lista) => setCitas(Array.isArray(lista) ? lista : []))
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  // Ordeno por fecha y hora para que la agenda se lea como una jornada.
  const visibles = useMemo(() => {
    const lista = filtro === "TODOS" ? citas : citas.filter((cita) => cita.estado === filtro);
    return [...lista].sort((a, b) =>
      `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`),
    );
  }, [citas, filtro]);

  // El nutricionista puede usar todos los estados del flujo de atención.
  async function marcar(cita, estado) {
    setAviso("");
    setError("");
    setEnCurso(cita.id);
    try {
      await cambiarEstado(token, cita.id, estado);
      setAviso(`La cita del ${formatearFecha(cita.fecha)} quedó registrada.`);
      cargar();
    } catch (problema) {
      setError(problema.message);
    } finally {
      setEnCurso(null);
    }
  }

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="ATENCIÓN PROFESIONAL"
        titulo="Agenda"
        descripcion="Confirma las horas solicitadas y registra la asistencia de cada paciente."
        acciones={
          <Button variant="outline-success" onClick={cargar} disabled={cargando}>
            Actualizar
          </Button>
        }
      />

      <Form.Group className="mb-3 nv-filtro" controlId="agenda-filtro">
        <Form.Label>Filtrar por estado</Form.Label>
        <Form.Select value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
          <option value="TODOS">Todos los estados</option>
          {ESTADOS_CITA.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <div aria-live="polite">
        {aviso ? <Alert variant="success">{aviso}</Alert> : null}
      </div>
      <BloqueError mensaje={error} onReintentar={cargar} />

      {cargando ? (
        <CargaEsqueleto filas={5} etiqueta="Cargando la agenda…" />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          titulo="No hay citas para mostrar."
          mensaje="Cambia el filtro de estado o actualiza la agenda."
        />
      ) : (
        <div className="table-responsive nv-tabla">
          <Table hover>
            <caption>Citas asignadas a tu agenda</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
                <th scope="col">Paciente</th>
                <th scope="col">Servicio</th>
                <th scope="col">Motivo</th>
                <th scope="col">Estado</th>
                <th scope="col">Registrar</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((cita) => (
                <tr key={cita.id}>
                  <th scope="row">{formatearFecha(cita.fecha)}</th>
                  <td>{formatearHora(cita.hora)}</td>
                  <td>
                    {/* Enlazo a la ficha clínica del paciente de esta cita. */}
                    <Link to={`/ficha-clinica?correo=${encodeURIComponent(cita.correoPaciente)}`}>
                      {cita.correoPaciente}
                    </Link>
                  </td>
                  <td>{cita.servicioNombre}</td>
                  <td className="nv-celda-motivo">{cita.motivo}</td>
                  <td><InsigniaEstado estado={cita.estado} /></td>
                  <td>
                    {estaCerrada(cita.estado) ? (
                      <span className="text-secondary small">Cita cerrada</span>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {cita.estado === "SOLICITADA" ? (
                          <Button
                            size="sm"
                            variant="success"
                            disabled={enCurso === cita.id}
                            onClick={() => marcar(cita, "CONFIRMADA")}
                          >
                            Confirmar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={enCurso === cita.id}
                          onClick={() => marcar(cita, "ATENDIDA")}
                        >
                          Atendida
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          disabled={enCurso === cita.id}
                          onClick={() => marcar(cita, "NO_ASISTIO")}
                        >
                          No asistió
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}
