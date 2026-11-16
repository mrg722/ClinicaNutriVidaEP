import { Button, Col, Container, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import { formatearPrecio } from "../utils/precio";

// Muestro el detalle del servicio que llega del catálogo (GET /servicios
// cuando hay sesión) y conservo la imagen local asociada a su código.
export default function DetalleProducto({
  productos,
  onAgregar,
  cargando = false,
  error = "",
  onReintentar,
}) {
  const { id } = useParams();
  const producto = productos.find((item) => item.id === id);

  // Mientras el catálogo viaja no afirmo que el servicio no existe.
  if (cargando) {
    return (
      <Container as="main" className="nv-section">
        <CargaEsqueleto filas={3} etiqueta="Cargando el servicio…" />
      </Container>
    );
  }

  if (error && !producto) {
    return (
      <Container as="main" className="nv-section">
        <h1>No pudimos cargar el servicio</h1>
        <BloqueError mensaje={error} onReintentar={onReintentar} />
        <Link className="btn btn-success" to="/productos">Volver a la tienda</Link>
      </Container>
    );
  }

  if (!producto) {
    return (
      <Container as="main" className="nv-section">
        <h1>Servicio no encontrado</h1>
        <p>
          El servicio solicitado no existe. Vuelve al catálogo para continuar.
        </p>
        <Link className="btn btn-success" to="/productos">Volver a la tienda</Link>
      </Container>
    );
  }

  return (
    <Container as="main" className="nv-section">
      <Row className="g-4 align-items-start">
        <Col md={5}>
          {producto.imagen ? (
            <img
              src={producto.imagen}
              alt={`Imagen de ${producto.nombre}`}
              className="nv-detail-image"
            />
          ) : null}
        </Col>
        <Col md={7}>
          <span className="badge text-bg-success mb-2">{producto.categoria}</span>
          <h1>{producto.nombre}</h1>
          <p>{producto.descripcion}</p>
          {/* Cuando el dato viene de la API muestro también duración y modalidad. */}
          {producto.modalidad || producto.duracionMinutos ? (
            <ul className="nv-lista-datos">
              {producto.duracionMinutos ? <li>Duración: {producto.duracionMinutos} minutos</li> : null}
              {producto.modalidad ? <li>Modalidad: {producto.modalidad}</li> : null}
            </ul>
          ) : null}
          <p className="display-6 fw-bold">{formatearPrecio(producto.precio)}</p>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="success" onClick={() => onAgregar(producto)}>
              Agregar al carrito
            </Button>
            <Link className="btn btn-outline-success" to={`/reserva?servicio=${producto.id}`}>
              Agendar este servicio
            </Link>
            <Link className="btn btn-outline-secondary" to="/productos">
              Volver al catálogo
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
