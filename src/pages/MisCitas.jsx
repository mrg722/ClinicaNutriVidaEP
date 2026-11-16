import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import { cambiarEstado, listarMias, reprogramar } from "../services/citaService";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import DialogoConfirmacion from "../components/ui/DialogoConfirmacion";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import EstadoVacio from "../components/ui/EstadoVacio";
import InsigniaEstado from "../components/ui/InsigniaEstado";
import { estaCerrada, formatearFecha, formatearHora } from "../utils/citas";
import {
  obtenerFechaLocal,
  validarFechaNoAnterior,
  validarHoraConsulta,
  validarMotivoConsulta,
} from "../utils/validaciones";

// Vista de citas del paciente. Pido siempre GET /citas/mias: el backend decide
// qué devolver según el rol del token, por eso el administrador ve aquí todas
// las citas sin que yo tenga que cambiar de endpoint.
export default function MisCitas() {
  const { token } = useSesion();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  // Guardo la cita que voy a cancelar para pedir confirmación antes de actuar.
  const [porCancelar, setPorCancelar] = useState(null);
  // Y la que estoy reprogramando, junto con los datos de su formulario.
  const [reprogramando, setReprogramando] = useState(null);
  const [formulario, setFormulario] = useState({ fecha: "", hora: "", motivo: "" });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const hoy = obtenerFechaLocal();

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    listarMias(token)
      .then((lista) => setCitas(Array.isArray(lista) ? lista : []))
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  // Un paciente solo puede dejar la cita en CANCELADA; el backend rechaza el resto.
  async function confirmarCancelacion() {
    const cita = porCancelar;
    setPorCancelar(null);
    setAviso("");
    setError("");
    try {
      await cambiarEstado(token, cita.id, "CANCELADA");
      setAviso(`Cancelamos la cita del ${formatearFecha(cita.fecha)}.`);
      cargar();
    } catch (problema) {
      setError(problema.message);
    }
  }

  function abrirReprogramacion(cita) {
    setReprogramando(cita);
    setErrores({});
    setAviso("");
    setFormulario({
      fecha: cita.fecha ?? "",
      hora: formatearHora(cita.hora),
      motivo: cita.motivo ?? "",
    });
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
  }

  // Repito en el frontend las reglas que ya valida el backend para avisar antes
  // de enviar: fecha no anterior a hoy, hora entre 09:00 y 18:00 y un motivo de
  // 10 a 300 caracteres.
  async function enviarReprogramacion(evento) {
    evento.preventDefault();
    const nuevos = {};
    if (!validarFechaNoAnterior(formulario.fecha)) {
      nuevos.fecha = "Selecciona una fecha de hoy o posterior.";
    }
    if (!validarHoraConsulta(formulario.hora)) {
      nuevos.hora = "Selecciona una hora entre 09:00 y 18:00.";
    }
    if (!validarMotivoConsulta(formulario.motivo) || formulario.motivo.trim().length > 300) {
      nuevos.motivo = "El motivo debe tener entre 10 y 300 caracteres.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await reprogramar(token, reprogramando.id, {
        nutricionistaId: reprogramando.nutricionistaId,
        servicioId: reprogramando.servicioId,
        fecha: formulario.fecha,
        hora: formulario.hora,
        motivo: formulario.motivo.trim(),
      });
      setReprogramando(null);
      setAviso("Reprogramamos la cita: queda nuevamente como solicitada.");
      cargar();
    } catch (problema) {
      // Aquí llega, por ejemplo, el 409 cuando el horario ya está tomado.
      setErrores({ formulario: problema.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="AGENDA PERSONAL"
        titulo="Mis citas"
        descripcion="Revisa el estado de tus horas, cancélalas o cámbialas de día."
        acciones={
          <Button variant="outline-success" onClick={cargar} disabled={cargando}>
            Actualizar
          </Button>
        }
      />

      {/* Los mensajes posteriores a una acción se anuncian con aria-live. */}
      <div aria-live="polite">
        {aviso ? <Alert variant="success">{aviso}</Alert> : null}
      </div>
      <BloqueError mensaje={error} onReintentar={cargar} />

      {cargando ? (
        <CargaEsqueleto filas={4} etiqueta="Cargando tus citas…" />
      ) : citas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tienes citas agendadas."
          mensaje="Cuando reserves una hora aparecerá aquí con su estado."
        >
          <Link className="btn btn-success" to="/reserva">Agendar una cita</Link>
        </EstadoVacio>
      ) : (
        // Envuelvo la tabla para que en móvil se desplace en horizontal.
        <div className="table-responsive nv-tabla">
          <Table hover>
            <caption>Citas registradas en la clínica</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
                <th scope="col">Servicio</th>
                <th scope="col">Profesional</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <th scope="row">{formatearFecha(cita.fecha)}</th>
                  <td>{formatearHora(cita.hora)}</td>
                  <td>{cita.servicioNombre}</td>
                  <td>{cita.nutricionistaNombre}</td>
                  <td><InsigniaEstado estado={cita.estado} /></td>
                  <td>
                    {estaCerrada(cita.estado) ? (
                      <span className="text-secondary small">Sin acciones disponibles</span>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => abrirReprogramacion(cita)}
                        >
                          Reprogramar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => setPorCancelar(cita)}
                        >
                          Cancelar
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

      {reprogramando ? (
        <section className="nv-form-panel mt-4">
          <h2 className="h4">Reprogramar la cita del {formatearFecha(reprogramando.fecha)}</h2>
          <BloqueError mensaje={errores.formulario} />
          <Form onSubmit={enviarReprogramacion} noValidate aria-label="Formulario de reprogramación">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="reprogramar-fecha">
                  <Form.Label>Nueva fecha</Form.Label>
                  <Form.Control
                    type="date"
                    min={hoy}
                    name="fecha"
                    value={formulario.fecha}
                    onChange={cambiarCampo}
                    isInvalid={Boolean(errores.fecha)}
                  />
                  <Form.Control.Feedback type="invalid">{errores.fecha}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="reprogramar-hora">
                  <Form.Label>Nueva hora</Form.Label>
                  <Form.Control
                    type="time"
                    min="09:00"
                    max="18:00"
                    name="hora"
                    value={formulario.hora}
                    onChange={cambiarCampo}
                    isInvalid={Boolean(errores.hora)}
                  />
                  <Form.Control.Feedback type="invalid">{errores.hora}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="my-3" controlId="reprogramar-motivo">
              <Form.Label>Motivo de consulta</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                minLength={10}
                maxLength={300}
                name="motivo"
                value={formulario.motivo}
                onChange={cambiarCampo}
                isInvalid={Boolean(errores.motivo)}
              />
              <Form.Control.Feedback type="invalid">{errores.motivo}</Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex flex-wrap gap-2">
              {/* Desactivo el botón mientras el envío está en curso. */}
              <Button type="submit" variant="success" disabled={enviando}>
                {enviando ? "Guardando…" : "Guardar cambios"}
              </Button>
              <Button variant="outline-secondary" onClick={() => setReprogramando(null)}>
                Cerrar
              </Button>
            </div>
          </Form>
        </section>
      ) : null}

      <DialogoConfirmacion
        visible={Boolean(porCancelar)}
        titulo="Cancelar la cita"
        mensaje={
          porCancelar
            ? `¿Confirmas la cancelación de la cita del ${formatearFecha(porCancelar.fecha)} a las ${formatearHora(porCancelar.hora)}? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Sí, cancelar"
        onConfirmar={confirmarCancelacion}
        onCerrar={() => setPorCancelar(null)}
      />
    </Container>
  );
}
