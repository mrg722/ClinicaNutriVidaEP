import { Badge, Button, Container, Nav, Navbar } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useSesion } from "../context/SesionContext";

// Declaro los enlaces como datos y no escritos uno por uno en el JSX: así el menú se arma
// recorriendo la lista que corresponde al rol, y agregar una sección es sumar una línea aquí.
// Estos son los públicos, visibles sin haber iniciado sesión.
const enlacesPublicos = [
  { to: "/", texto: "Inicio", fin: true },
  { to: "/servicios", texto: "Servicios" },
  { to: "/productos", texto: "Tienda" },
  { to: "/reserva", texto: "Agendar cita" },
  { to: "/contacto", texto: "Contacto" },
];

// Enlaces que dependen del rol: cada perfil ve solo lo que puede usar, por eso
// un paciente nunca ve la agenda profesional ni la administración.
// Ocultar el enlace es comodidad, no seguridad: quien escriba la dirección a mano llegaría a la
// vista igual. Lo que impide de verdad el acceso es el backend, que revisa el rol del token en
// cada endpoint y responde 403 aunque la pantalla se haya alcanzado a pintar.
const enlacesPorRol = {
  PACIENTE: [
    { to: "/mis-citas", texto: "Mis citas" },
    { to: "/mi-progreso", texto: "Mi progreso" },
  ],
  NUTRICIONISTA: [
    { to: "/agenda", texto: "Agenda" },
    { to: "/ficha-clinica", texto: "Ficha clínica" },
  ],
  ADMIN: [
    { to: "/mis-citas", texto: "Citas" },
    { to: "/admin", texto: "Administración" },
  ],
};

export default function Navegacion({ cantidadCarrito = 0 }) {
  const { usuario, autenticado, rol, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  function salir() {
    cerrarSesion();
    navegar("/", { replace: true });
  }

  const enlacesRol = (autenticado && enlacesPorRol[rol]) || [];

  return (
    <Navbar expand="lg" className="nv-navbar" variant="dark">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold">
          Clínica NutriVida
        </Navbar.Brand>
        {/* El botón hamburguesa de React Bootstrap resuelve el menú en móvil. */}
        <Navbar.Toggle aria-controls="nutrivida-nav" aria-label="Abrir navegación" />
        <Navbar.Collapse id="nutrivida-nav">
          <Nav className="ms-auto align-items-lg-center">
            {enlacesPublicos.map((enlace) => (
              <Nav.Link key={enlace.to} as={NavLink} to={enlace.to} end={enlace.fin}>
                {enlace.texto}
              </Nav.Link>
            ))}
            <Nav.Link
              as={NavLink}
              to="/carrito"
              aria-label={`Carrito, ${cantidadCarrito} unidades`}
            >
              Carrito <Badge bg="light" text="dark">{cantidadCarrito}</Badge>
            </Nav.Link>

            {enlacesRol.map((enlace) => (
              <Nav.Link key={enlace.to} as={NavLink} to={enlace.to}>
                {enlace.texto}
              </Nav.Link>
            ))}

            {autenticado ? (
              <>
                {/* Muestro el nombre de quien inició sesión y su perfil. */}
                <span className="navbar-text text-white ms-lg-2 me-lg-2">
                  {usuario?.nombre} ({rol})
                </span>
                <Button variant="outline-light" size="sm" onClick={salir}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <Nav.Link as={NavLink} to="/login">
                Iniciar sesión
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
