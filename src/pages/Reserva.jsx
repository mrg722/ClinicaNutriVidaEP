import { useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import { crear as crearCita } from "../services/citaService";
import { listar as listarNutricionistas } from "../services/nutricionistaService";
import BloqueError from "../components/ui/BloqueError";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import {
  obtenerFechaLocal,
  validarCorreo,
  validarFechaNoAnterior,
  validarHoraConsulta,
  validarMotivoConsulta,
  validarNombre,
  validarTelefono,
} from "../utils/validaciones";

// Lista de respaldo que se muestra cuando todavía no hay sesión y por tanto el
// microservicio de citas no entrega los profesionales reales.
const profesionales = [
  { id: "nutricionista-01", nombre: "Nutricionista 01" },
  { id: "nutricionista-02", nombre: "Nutricionista 02" },
  { id: "nutricionista-03", nombre: "Nutricionista 03" },
  { id: "nutricionista-04", nombre: "Nutricionista 04" },
];

// El parámetro de la URL puede traer el código o el nombre del servicio; en
// ambos casos dejo seleccionado el nombre, que es el valor del desplegable.
function resolverServicioInicial(parametro, productos) {
  if (!parametro) return "";
  const servicio = productos.find(
    (producto) => producto.id === parametro || producto.nombre === parametro,
  );
  return servicio?.nombre ?? "";
}

export default function Reserva({ productos }) {
  const [parametros] = useSearchParams();
  const { token, usuario, autenticado } = useSesion();
  const [datos, setDatos] = useState(() => ({
    nombre: "",
    correo: "",
    telefono: "",
    nutricionista: "",
    servicio: resolverServicioInicial(parametros.get("servicio"), productos),
    fecha: "",
    hora: "",
    motivo: "",
  }));
  const [errores, setErrores] = useState({});
  const [enviada, setEnviada] = useState(false);
  const [confirmada, setConfirmada] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [equipo, setEquipo] = useState([]);
  const hoy = obtenerFechaLocal();

  // Con la sesión abierta completo el nombre y el correo de quien reserva.
  useEffect(() => {
    if (!usuario) return;
    setDatos((actuales) => ({
      ...actuales,
      nombre: actuales.nombre || usuario.nombre || "",
      correo: actuales.correo || usuario.correo || "",
    }));
  }, [usuario]);

  // Cargo los nutricionistas activos desde la API cuando hay token.
  useEffect(() => {
    if (!token) {
      setEquipo([]);
      return undefined;
    }

    let vigente = true;
    listarNutricionistas(token, { soloActivos: true })
      .then((lista) => {
        if (vigente) setEquipo(Array.isArray(lista) ? lista : []);
      })
      .catch((problema) => {
        if (vigente) setErrores((actuales) => ({ ...actuales, carga: problema.message }));
      });

    return () => {
      vigente = false;
    };
  }, [token]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
    setEnviada(false);
    setConfirmada(null);
  }

  // Conservo las validaciones del formulario original y agrego el límite de 300
  // caracteres del motivo que exige el backend.
  function validar() {
    const nuevos = {};
    if (!validarNombre(datos.nombre)) nuevos.nombre = "Ingresa un nombre válido.";
    if (!validarCorreo(datos.correo) && !autenticado) {
      nuevos.correo = "Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    }
    if (!validarTelefono(datos.telefono)) nuevos.telefono = "Ingresa un teléfono válido.";
    if (!datos.nutricionista) nuevos.nutricionista = "Selecciona un profesional.";
    if (!datos.servicio) nuevos.servicio = "Selecciona un servicio.";
    if (!validarFechaNoAnterior(datos.fecha)) nuevos.fecha = "Selecciona una fecha de hoy o posterior.";
    if (!validarHoraConsulta(datos.hora)) nuevos.hora = "Selecciona una hora entre 09:00 y 18:00.";
    if (!validarMotivoConsulta(datos.motivo) || datos.motivo.trim().length > 300) {
      nuevos.motivo = "El motivo debe tener al menos 10 caracteres.";
    }
    return nuevos;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setEnviada(false);
      setConfirmada(null);
      return;
    }

    // Sin sesión no puedo reservar en el servidor: dejo la validación local y
    // aviso que hace falta iniciar sesión para confirmar la hora.
    if (!token) {
      setEnviada(true);
      return;
    }

    const servicio = productos.find((producto) => producto.nombre === datos.servicio);
    if (!servicio?.servicioId) {
      setErrores({ formulario: "El servicio seleccionado no está disponible en la agenda." });
      return;
    }

    setEnviando(true);
    try {
      // Envío la reserva real al microservicio de citas.
      const cita = await crearCita(token, {
        nutricionistaId: Number(datos.nutricionista),
        servicioId: servicio.servicioId,
        fecha: datos.fecha,
        hora: datos.hora,
        motivo: datos.motivo.trim(),
      });
      setConfirmada(cita);
      setEnviada(false);
      setDatos((actuales) => ({ ...actuales, fecha: "", hora: "", motivo: "" }));
    } catch (problema) {
      // Aquí muestro el mensaje del backend, por ejemplo cuando el profesional
      // ya tiene ese horario tomado (409).
      setErrores({ formulario: problema.message });
    } finally {
      setEnviando(false);
    }
  }

  // Si hay sesión muestro el equipo real; si no, la lista de respaldo.
  const opcionesProfesionales = token && equipo.length > 0
    ? equipo.map((profesional) => ({
        id: profesional.id,
        nombre: `${profesional.nombre} · ${profesional.especialidad}`,
      }))
    : profesionales;

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="AGENDA"
        titulo="Agendar una cita"
        descripcion="Completa los datos y reserva tu hora con el equipo de la clínica."
      />

      {!autenticado ? (
        <Alert variant="info">
          Para confirmar la hora en la agenda necesitas <Link to="/login">iniciar sesión</Link>.
          Mientras tanto puedes revisar los datos del formulario.
        </Alert>
      ) : null}

      <div aria-live="polite">
        {confirmada ? (
          <Alert variant="success">
            <p className="mb-1">Tu cita quedó registrada con estado {confirmada.estado}.</p>
            <p className="mb-2">
              {confirmada.servicioNombre} con {confirmada.nutricionistaNombre} el{" "}
              {confirmada.fecha} a las {String(confirmada.hora).slice(0, 5)}.
            </p>
            <Link className="btn btn-success" to="/mis-citas">Ver mis citas</Link>
          </Alert>
        ) : null}
        {enviada ? (
          <Alert variant="success" role="status">
            Solicitud validada en este navegador. No está conectada a una agenda real y no confirma una cita.
          </Alert>
        ) : null}
      </div>

      <BloqueError mensaje={errores.formulario || errores.carga} />

      <Form onSubmit={enviar} noValidate className="nv-form" aria-label="Formulario de reserva">
        <Form.Group className="mb-3" controlId="reserva-nombre">
          <Form.Label>Nombre completo</Form.Label>
          <Form.Control autoComplete="name" maxLength={50} name="nombre" value={datos.nombre} onChange={cambiar} isInvalid={Boolean(errores.nombre)} aria-describedby={errores.nombre ? "error-reserva-nombre" : undefined} />
          <Form.Control.Feedback id="error-reserva-nombre" type="invalid">{errores.nombre}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="reserva-correo">
          <Form.Label>Correo electrónico</Form.Label>
          <Form.Control autoComplete="email" maxLength={100} type="email" name="correo" value={datos.correo} onChange={cambiar} isInvalid={Boolean(errores.correo)} aria-describedby={errores.correo ? "error-reserva-correo" : undefined} />
          <Form.Control.Feedback id="error-reserva-correo" type="invalid">{errores.correo}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="reserva-telefono">
          <Form.Label>Teléfono</Form.Label>
          <Form.Control autoComplete="tel" maxLength={16} type="tel" name="telefono" placeholder="+56 9 1234 5678" value={datos.telefono} onChange={cambiar} isInvalid={Boolean(errores.telefono)} aria-describedby={errores.telefono ? "error-reserva-telefono" : undefined} />
          <Form.Control.Feedback id="error-reserva-telefono" type="invalid">{errores.telefono}</Form.Control.Feedback>
        </Form.Group>

        <Row className="g-3">
          <Col md={6}>
            <Form.Group className="mb-3" controlId="reserva-nutricionista">
              <Form.Label>Nutricionista preferido</Form.Label>
              <Form.Select name="nutricionista" value={datos.nutricionista} onChange={cambiar} isInvalid={Boolean(errores.nutricionista)} aria-describedby={errores.nutricionista ? "error-reserva-nutricionista" : undefined}>
                <option value="">Selecciona un profesional</option>
                {opcionesProfesionales.map((profesional) => (
                  <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback id="error-reserva-nutricionista" type="invalid">{errores.nutricionista}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="reserva-servicio">
              <Form.Label>Servicio</Form.Label>
              <Form.Select name="servicio" value={datos.servicio} onChange={cambiar} isInvalid={Boolean(errores.servicio)} aria-describedby={errores.servicio ? "error-reserva-servicio" : undefined}>
                <option value="">Selecciona una opción</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.nombre}>{producto.nombre}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback id="error-reserva-servicio" type="invalid">{errores.servicio}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="reserva-fecha">
              <Form.Label>Fecha solicitada</Form.Label>
              <Form.Control type="date" min={hoy} name="fecha" value={datos.fecha} onChange={cambiar} isInvalid={Boolean(errores.fecha)} aria-describedby={errores.fecha ? "error-reserva-fecha" : undefined} />
              <Form.Control.Feedback id="error-reserva-fecha" type="invalid">{errores.fecha}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="reserva-hora">
              <Form.Label>Hora</Form.Label>
              <Form.Control type="time" min="09:00" max="18:00" name="hora" value={datos.hora} onChange={cambiar} isInvalid={Boolean(errores.hora)} aria-describedby={errores.hora ? "error-reserva-hora" : undefined} />
              <Form.Control.Feedback id="error-reserva-hora" type="invalid">{errores.hora}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="reserva-motivo">
          <Form.Label>Motivo de consulta</Form.Label>
          <Form.Control as="textarea" rows={4} maxLength={300} minLength={10} name="motivo" value={datos.motivo} onChange={cambiar} isInvalid={Boolean(errores.motivo)} aria-describedby={errores.motivo ? "error-reserva-motivo" : undefined} />
          <Form.Control.Feedback id="error-reserva-motivo" type="invalid">{errores.motivo}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" variant="success" disabled={enviando}>
          {enviando ? "Enviando…" : "Validar solicitud"}
        </Button>
      </Form>
    </Container>
  );
}
