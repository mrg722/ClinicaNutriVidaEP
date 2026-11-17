import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import { actualizar, crear, eliminar, listarPorPaciente } from "../services/medicionService";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import DialogoConfirmacion from "../components/ui/DialogoConfirmacion";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import EstadoVacio from "../components/ui/EstadoVacio";
import { formatearFecha } from "../utils/citas";
import { obtenerFechaLocal } from "../utils/validaciones";

const FORMULARIO_VACIO = {
  fecha: obtenerFechaLocal(),
  pesoKg: "",
  tallaCm: "",
  cinturaCm: "",
  observaciones: "",
  planAlimenticio: "",
};

// Ficha clínica del paciente para el nutricionista: busco su historial por
// correo y registro o corrijo mediciones. El IMC lo calcula el backend, así que
// no lo envío ni lo recalculo aquí.
export default function FichaClinica() {
  const { token } = useSesion();
  const [parametros, setParametros] = useSearchParams();
  // Acepto el correo por la URL para llegar desde la agenda con un clic. Tener el correo en la
  // dirección además hace que la ficha se pueda recargar o guardar como enlace y siga abriendo
  // al mismo paciente. Que venga por la URL no abre un hueco: el backend comprueba que quien
  // pregunta sea el dueño de la ficha o su nutricionista, y si no, responde 403.
  // Llevo dos estados separados a propósito: "correo" es lo que se está escribiendo en el buscador
  // y "consultado" es la ficha que de verdad se está mostrando. Si usara uno solo, la lista
  // intentaría recargarse con cada letra que se teclea.
  const [correo, setCorreo] = useState(parametros.get("correo") ?? "");
  const [consultado, setConsultado] = useState(parametros.get("correo") ?? "");
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);

  const cargar = useCallback(
    (correoPaciente) => {
      if (!correoPaciente) return;
      setCargando(true);
      setError("");
      listarPorPaciente(token, correoPaciente)
        .then((lista) => setMediciones(Array.isArray(lista) ? lista : []))
        .catch((problema) => {
          setError(problema.message);
          setMediciones([]);
        })
        .finally(() => setCargando(false));
    },
    [token],
  );

  useEffect(() => {
    if (consultado) cargar(consultado);
  }, [cargar, consultado]);

  function buscar(evento) {
    evento.preventDefault();
    const limpio = correo.trim().toLowerCase();
    if (!limpio) {
      setError("Ingresa el correo del paciente que quieres revisar.");
      return;
    }
    setAviso("");
    setConsultado(limpio);
    setParametros({ correo: limpio });
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
  }

  // Valido lo mínimo antes de enviar: fecha, peso y talla son obligatorios y
  // deben ser números positivos. Exijo talla mayor que cero porque es el divisor del IMC, así que
  // un cero haría fallar ese cálculo en el backend.
  // La cintura la valido solo si viene escrita, porque es un dato opcional de la ficha.
  function validar() {
    const nuevos = {};
    if (!formulario.fecha) nuevos.fecha = "Indica la fecha del control.";
    if (!(Number(formulario.pesoKg) > 0)) nuevos.pesoKg = "Ingresa un peso mayor que cero.";
    if (!(Number(formulario.tallaCm) > 0)) nuevos.tallaCm = "Ingresa una talla mayor que cero.";
    if (formulario.cinturaCm !== "" && !(Number(formulario.cinturaCm) > 0)) {
      nuevos.cinturaCm = "La cintura debe ser un número mayor que cero.";
    }
    return nuevos;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Los campos opcionales viajan como null cuando quedan en blanco, no como cadena vacía: en la
    // base "sin dato" es NULL, y un "" guardaría un valor que después parecería un dato tomado.
    // Convierto peso, talla y cintura con Number porque los inputs entregan texto y la API espera
    // números; el IMC no va en el cuerpo, lo calcula el backend desde el peso y la talla para no
    // guardar dos veces la misma información.
    const cuerpo = {
      correoPaciente: consultado,
      fecha: formulario.fecha,
      pesoKg: Number(formulario.pesoKg),
      tallaCm: Number(formulario.tallaCm),
      cinturaCm: formulario.cinturaCm === "" ? null : Number(formulario.cinturaCm),
      observaciones: formulario.observaciones.trim() || null,
      planAlimenticio: formulario.planAlimenticio.trim() || null,
    };

    setEnviando(true);
    try {
      if (editando) {
        await actualizar(token, editando.id, cuerpo);
        setAviso("Corregimos la medición seleccionada.");
      } else {
        await crear(token, cuerpo);
        setAviso("Registramos la nueva medición en la ficha.");
      }
      setFormulario(FORMULARIO_VACIO);
      setEditando(null);
      cargar(consultado);
    } catch (problema) {
      setErrores({ formulario: problema.message });
    } finally {
      setEnviando(false);
    }
  }

  // Al corregir cargo los valores existentes en el formulario.
  function editar(medicion) {
    setEditando(medicion);
    setAviso("");
    setErrores({});
    setFormulario({
      fecha: medicion.fecha ?? "",
      pesoKg: String(medicion.pesoKg ?? ""),
      tallaCm: String(medicion.tallaCm ?? ""),
      cinturaCm: medicion.cinturaCm === null || medicion.cinturaCm === undefined ? "" : String(medicion.cinturaCm),
      observaciones: medicion.observaciones ?? "",
      planAlimenticio: medicion.planAlimenticio ?? "",
    });
  }

  async function confirmarEliminacion() {
    const medicion = porEliminar;
    setPorEliminar(null);
    try {
      await eliminar(token, medicion.id);
      setAviso("Eliminamos la medición de la ficha.");
      cargar(consultado);
    } catch (problema) {
      setError(problema.message);
    }
  }

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="FICHA CLÍNICA"
        titulo="Ficha clínica del paciente"
        descripcion="Busca a la persona por su correo, revisa sus controles y registra nuevas mediciones."
      />

      <Form onSubmit={buscar} noValidate className="nv-form mb-4" aria-label="Formulario de búsqueda de paciente">
        <Row className="g-3 align-items-end">
          <Col md={8}>
            <Form.Group controlId="ficha-correo">
              <Form.Label>Correo del paciente</Form.Label>
              <Form.Control
                type="email"
                name="correo"
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                placeholder="paciente@nutrivida.cl"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Button type="submit" variant="success" className="w-100">Buscar ficha</Button>
          </Col>
        </Row>
      </Form>

      <div aria-live="polite">
        {aviso ? <Alert variant="success">{aviso}</Alert> : null}
      </div>
      <BloqueError mensaje={error} />

      {!consultado ? (
        <EstadoVacio
          titulo="Sin paciente seleccionado."
          mensaje="Ingresa un correo para ver su historial de mediciones."
        />
      ) : cargando ? (
        <CargaEsqueleto filas={4} etiqueta="Cargando la ficha…" />
      ) : (
        <>
          <h2 className="h4">Historial de {consultado}</h2>
          {mediciones.length === 0 ? (
            <EstadoVacio
              titulo="Sin mediciones registradas por ti."
              mensaje="Recuerda que solo puedes ver las mediciones que tú registraste."
            />
          ) : (
            <div className="table-responsive nv-tabla">
              <Table hover>
                <caption>Mediciones registradas para este paciente</caption>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Peso</th>
                    <th scope="col">Talla</th>
                    <th scope="col">Cintura</th>
                    <th scope="col">IMC</th>
                    <th scope="col">Plan alimenticio</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mediciones.map((medicion) => (
                    <tr key={medicion.id}>
                      <th scope="row">{formatearFecha(medicion.fecha)}</th>
                      <td>{medicion.pesoKg} kg</td>
                      <td>{medicion.tallaCm} cm</td>
                      <td>{medicion.cinturaCm ? `${medicion.cinturaCm} cm` : "—"}</td>
                      <td>{Number(medicion.imc).toFixed(1)}</td>
                      <td className="nv-celda-motivo">{medicion.planAlimenticio || "—"}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Button size="sm" variant="outline-success" onClick={() => editar(medicion)}>
                            Corregir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => setPorEliminar(medicion)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <section className="nv-form-panel mt-4">
            <h2 className="h4">
              {editando ? `Corregir el control del ${formatearFecha(editando.fecha)}` : "Registrar una medición"}
            </h2>
            <BloqueError mensaje={errores.formulario} />
            <Form onSubmit={enviar} noValidate aria-label="Formulario de medición">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="medicion-fecha">
                    <Form.Label>Fecha del control</Form.Label>
                    <Form.Control
                      type="date"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={cambiarCampo}
                      isInvalid={Boolean(errores.fecha)}
                    />
                    <Form.Control.Feedback type="invalid">{errores.fecha}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="medicion-peso">
                    <Form.Label>Peso en kilos</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      name="pesoKg"
                      value={formulario.pesoKg}
                      onChange={cambiarCampo}
                      isInvalid={Boolean(errores.pesoKg)}
                    />
                    <Form.Control.Feedback type="invalid">{errores.pesoKg}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="medicion-talla">
                    <Form.Label>Talla en centímetros</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      name="tallaCm"
                      value={formulario.tallaCm}
                      onChange={cambiarCampo}
                      isInvalid={Boolean(errores.tallaCm)}
                    />
                    <Form.Control.Feedback type="invalid">{errores.tallaCm}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="medicion-cintura">
                    <Form.Label>Cintura en centímetros (opcional)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      name="cinturaCm"
                      value={formulario.cinturaCm}
                      onChange={cambiarCampo}
                      isInvalid={Boolean(errores.cinturaCm)}
                    />
                    <Form.Control.Feedback type="invalid">{errores.cinturaCm}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="my-3" controlId="medicion-observaciones">
                <Form.Label>Observaciones (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="observaciones"
                  value={formulario.observaciones}
                  onChange={cambiarCampo}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="medicion-plan">
                <Form.Label>Plan alimenticio (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="planAlimenticio"
                  value={formulario.planAlimenticio}
                  onChange={cambiarCampo}
                />
              </Form.Group>
              <div className="d-flex flex-wrap gap-2">
                <Button type="submit" variant="success" disabled={enviando}>
                  {enviando ? "Guardando…" : editando ? "Guardar corrección" : "Registrar medición"}
                </Button>
                {editando ? (
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setEditando(null);
                      setFormulario(FORMULARIO_VACIO);
                    }}
                  >
                    Cancelar corrección
                  </Button>
                ) : null}
              </div>
            </Form>
          </section>
        </>
      )}

      <DialogoConfirmacion
        visible={Boolean(porEliminar)}
        titulo="Eliminar la medición"
        mensaje={
          porEliminar
            ? `¿Confirmas que quieres eliminar el control del ${formatearFecha(porEliminar.fecha)}? Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminacion}
        onCerrar={() => setPorEliminar(null)}
      />
    </Container>
  );
}
