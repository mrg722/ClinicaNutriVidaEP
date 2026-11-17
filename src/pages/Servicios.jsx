import { Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
// Importo serviciosPrincipales desde Inicio en lugar de copiar la lista acá: el inicio muestra un
// resumen y esta vista el detalle, pero son los mismos servicios. Si tuviera dos copias, al
// agregar uno nuevo me quedaría visible en una página y ausente en la otra.
import { serviciosPrincipales } from "./Inicio";

export default function Servicios() {
  return (
    <Container as="main" className="nv-section">
      <p className="nv-eyebrow">CLÍNICA NUTRIVIDA</p>
      <h1>Nuestros servicios</h1>
      <p>Conoce las opciones de atención nutricional que ofrecemos.</p>
      <Row className="g-4 mt-2">
        {/* Uso el título como key porque no hay id en estos datos y los títulos no se repiten;
            el índice del arreglo sería mala idea si alguna vez la lista cambiara de orden.
            Con md={6} y lg={4} muestro dos tarjetas por fila en tablet y tres en escritorio. */}
        {serviciosPrincipales.map((servicio) => (
          <Col key={servicio.titulo} md={6} lg={4}>
            <Card className="nv-card h-100">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="h5">{servicio.titulo}</Card.Title>
                <Card.Text>{servicio.descripcion}</Card.Text>
                <Link className="btn btn-outline-success" to="/reserva">
                  Consultar una cita
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
