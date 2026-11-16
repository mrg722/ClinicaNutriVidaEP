import { useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSesion } from "../context/SesionContext";
import { iniciarSesion as pedirInicioSesion, registrar } from "../services/authService";
import { validarCorreoCuenta } from "../utils/validaciones";

// Cada rol entra a la pantalla que le sirve: el administrador al panel, el
// profesional a su agenda y el paciente a sus citas.
const DESTINO_POR_ROL = {
  ADMIN: "/admin",
  NUTRICIONISTA: "/agenda",
  PACIENTE: "/mis-citas",
};

export default function Acceso({ modo = "acceso" }) {
  const [datos, setDatos] = useState(
    modo === "registro"
      ? { nombre: "", correo: "", password: "" }
      : { correo: "", password: "" },
  );
  const [errores, setErrores] = useState({});
  const [mensajeRegistro, setMensajeRegistro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
    setMensajeRegistro("");
  }

  // Conservo las validaciones del formulario antes de llamar a la API, para no
  // molestar al servidor con datos que ya sé que están incompletos.
  function validar() {
    const nuevos = {};
    const correo = String(datos.correo ?? "").trim().toLowerCase();

    if (modo === "registro" && !String(datos.nombre ?? "").trim()) {
      nuevos.nombre = "Ingresa tu nombre.";
    }
    if (!validarCorreoCuenta(correo)) {
      nuevos.correo = "Usa @duoc.cl, @profesor.duoc.cl, @gmail.com o @nutrivida.cl.";
    }
    if (!datos.password || datos.password.length < 4) {
      nuevos.password = "La contraseña debe tener al menos 4 caracteres.";
    }

    return nuevos;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const correo = datos.correo.trim().toLowerCase();
    setEnviando(true);

    try {
      if (modo === "registro") {
        // El registro público crea siempre una cuenta de paciente en el backend.
        await registrar(datos.nombre.trim(), correo, datos.password);
        setMensajeRegistro(
          "Cuenta creada correctamente. Ya puedes iniciar sesión con tu correo y contraseña.",
        );
        setDatos({ nombre: "", correo: "", password: "" });
        return;
      }

      // Pido el token al microservicio de autenticación y lo entrego al
      // contexto, que se encarga de guardarlo y revalidarlo.
      const sesion = await pedirInicioSesion(correo, datos.password);
      iniciarSesion(sesion);
      const destinoPrevio = ubicacion.state?.desde;
      navegar(destinoPrevio || DESTINO_POR_ROL[sesion.rol] || "/", { replace: true });
    } catch (problema) {
      // Muestro el mensaje que devolvió el backend en el campo "error".
      setErrores({ formulario: problema.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container as="main" className="nv-section">
      <p className="nv-eyebrow">ACCESO A LA CLÍNICA</p>
      <h1>{modo === "registro" ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <p>
        {modo === "registro"
          ? "Crea tu cuenta de paciente para agendar tus horas y seguir tu progreso."
          : "Ingresa con tu correo y contraseña para entrar a la agenda de la clínica."}
      </p>

      {errores.formulario ? (
        <Alert variant="danger" role="alert">{errores.formulario}</Alert>
      ) : null}

      {modo === "registro" && mensajeRegistro ? (
        <Alert variant="success" role="status">
          <p className="mb-2">{mensajeRegistro}</p>
          <Link className="btn btn-success" to="/login">Ir a iniciar sesión</Link>
        </Alert>
      ) : null}

      <Form
        onSubmit={enviar}
        noValidate
        className="nv-form"
        aria-label={modo === "registro" ? "Formulario de registro" : "Formulario de inicio de sesión"}
      >
        {modo === "registro" && (
          <Form.Group className="mb-3" controlId="registro-nombre">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control
              name="nombre"
              value={datos.nombre}
              onChange={cambiar}
              isInvalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? "error-registro-nombre" : undefined}
            />
            <Form.Control.Feedback id="error-registro-nombre" type="invalid">
              {errores.nombre}
            </Form.Control.Feedback>
          </Form.Group>
        )}

        <Form.Group className="mb-3" controlId={modo === "registro" ? "registro-correo" : "acceso-correo"}>
          <Form.Label>Correo electrónico</Form.Label>
          <Form.Control
            type="email"
            autoComplete="email"
            name="correo"
            value={datos.correo}
            onChange={cambiar}
            isInvalid={Boolean(errores.correo)}
            aria-describedby={
              errores.correo
                ? modo === "registro"
                  ? "error-registro-correo"
                  : "error-acceso-correo"
                : undefined
            }
          />
          <Form.Control.Feedback
            id={modo === "registro" ? "error-registro-correo" : "error-acceso-correo"}
            type="invalid"
          >
            {errores.correo}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId={modo === "registro" ? "registro-password" : "acceso-password"}>
          <Form.Label>Contraseña</Form.Label>
          <Form.Control
            type="password"
            autoComplete={modo === "registro" ? "new-password" : "current-password"}
            minLength={4}
            maxLength={72}
            name="password"
            value={datos.password}
            onChange={cambiar}
            isInvalid={Boolean(errores.password)}
            aria-describedby={
              errores.password
                ? modo === "registro"
                  ? "error-registro-password"
                  : "error-acceso-password"
                : undefined
            }
          />
          <Form.Control.Feedback
            id={modo === "registro" ? "error-registro-password" : "error-acceso-password"}
            type="invalid"
          >
            {errores.password}
          </Form.Control.Feedback>
        </Form.Group>

        <Button type="submit" variant="success" disabled={enviando}>
          {enviando ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Enviando…
            </>
          ) : modo === "registro" ? (
            "Validar registro"
          ) : (
            "Validar acceso"
          )}
        </Button>
      </Form>

      {modo !== "registro" && (
        <p className="mt-3">
          ¿Todavía no tienes cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      )}
    </Container>
  );
}
