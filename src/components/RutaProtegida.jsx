import { Alert, Container, Spinner } from "react-bootstrap";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSesion } from "../context/SesionContext";

// Agrupo aquí la restricción de acceso por rol (indicador IE3.3.3).
// IMPORTANTE: esta comprobación solo mejora la navegación y evita mostrar
// pantallas que la persona no podría usar. La seguridad real la aplica el
// backend, que valida el token y el rol en cada endpoint; si alguien forzara
// la URL, el servicio igual respondería 401 o 403.
export default function RutaProtegida({ roles }) {
  const { autenticado, cargando, tieneRol } = useSesion();
  const ubicacion = useLocation();

  // Mientras revalido el token muestro un indicador en vez de redirigir,
  // para que una recarga de página no expulse a quien sí tiene sesión.
  if (cargando) {
    return (
      <Container as="main" className="nv-section text-center">
        <Spinner animation="border" variant="success" role="status" />
        <p className="mt-3">Validando tu sesión…</p>
      </Container>
    );
  }

  // Sin sesión mando al login y recuerdo a dónde quería entrar.
  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  // Con sesión pero sin el rol necesario muestro un aviso de falta de permisos.
  const rolesPermitidos = roles ? [].concat(roles) : null;
  if (rolesPermitidos && !tieneRol(rolesPermitidos)) {
    return (
      <Container as="main" className="nv-section">
        <h1>Sin permiso</h1>
        <Alert variant="warning" role="alert">
          Tu perfil no tiene acceso a esta sección de la clínica.
        </Alert>
        <Link className="btn btn-success" to="/">Volver al inicio</Link>
      </Container>
    );
  }

  // Si todo está en orden dejo pasar a las rutas hijas.
  return <Outlet />;
}
