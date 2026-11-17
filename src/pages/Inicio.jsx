import { useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { guardarJSON, leerJSON } from "../utils/persistencia";

// Exporto esta lista para que la vista de Servicios use exactamente la misma: el inicio muestra
// el resumen y esa página el detalle, pero los servicios son los mismos y con dos copias uno de
// los dos lados quedaría desactualizado al agregar algo.
export const serviciosPrincipales = [
  {
    titulo: "Consulta nutricional",
    descripcion: "Atención personalizada para mejorar tus hábitos alimentarios.",
    icono: "🥗",
  },
  {
    titulo: "Planes de alimentación",
    descripcion: "Planes adaptados a tus objetivos y necesidades.",
    icono: "🍎",
  },
  {
    titulo: "Seguimiento nutricional",
    descripcion: "Acompañamiento para revisar tus avances.",
    icono: "💚",
  },
];

// Compruebo que sea un arreglo aunque leerJSON ya controle los errores: lo guardado pudo quedar
// de una versión anterior con otra forma, y un valor que no sea arreglo rompería el includes.
function leerGuardados() {
  const valor = leerJSON("nutrivida-guardados", []);
  return Array.isArray(valor) ? valor : [];
}

export default function Inicio() {
  // Le paso la función a useState sin llamarla, para que lea localStorage una sola vez al montar
  // el componente y no en cada renderizado.
  const [guardados, setGuardados] = useState(leerGuardados);

  // Un mismo botón guarda y quita: si el servicio ya está en la lista lo saco, y si no lo agrego.
  function guardarServicio(titulo) {
    const nuevos = guardados.includes(titulo)
      ? guardados.filter((item) => item !== titulo)
      : [...guardados, titulo];

    // Armo un arreglo nuevo en lugar de modificar el actual, porque React compara referencias:
    // si mutara el mismo arreglo no detectaría el cambio y la pantalla no se actualizaría.
    setGuardados(nuevos);
    // Guardo con el valor nuevo y no con el estado, que todavía tiene el anterior: la
    // actualización de estado no es inmediata y escribiría el dato viejo en localStorage.
    guardarJSON("nutrivida-guardados", nuevos);
  }

  return (
    <>
      <section className="nv-hero">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={8}>
              <span className="badge text-bg-success mb-3">Clínica NutriVida</span>
              <h1 className="display-4 fw-bold">
                Cuida tu alimentación, mejora tu vida
              </h1>
              <p className="lead mt-3">
                Te acompañamos a construir hábitos saludables con orientación
                nutricional personalizada.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-success btn-lg" to="/servicios">
                  Conoce nuestros servicios
                </Link>
                <Link className="btn btn-outline-success btn-lg" to="/productos">
                  Explorar tienda
                </Link>
              </div>
            </Col>
            <Col lg={4} className="text-center">
              {/* Los emoji son decorativos, así que van con aria-hidden: si no, el lector de
                  pantalla leería "palta" en medio del texto y solo estorbaría. */}
              <div className="nv-hero-icon" aria-hidden="true">🥑</div>
              <p className="fw-semibold">Pequeños hábitos, grandes cambios</p>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="nv-section">
        <Container>
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
            <div>
              <p className="nv-eyebrow">ATENCIÓN PERSONALIZADA</p>
              <h2 className="fw-bold mb-0">Nuestros servicios</h2>
            </div>
            <Link to="/servicios">Ver todos los servicios</Link>
          </div>
          <Row className="g-4">
            {serviciosPrincipales.map((servicio) => {
              const guardado = guardados.includes(servicio.titulo);
              return (
                <Col key={servicio.titulo} sm={6} lg={4}>
                  <Card className="nv-card h-100">
                    <Card.Body className="p-4">
                      <div className="nv-service-icon mb-3" aria-hidden="true">
                        {servicio.icono}
                      </div>
                      <Card.Title as="h3">{servicio.titulo}</Card.Title>
                      <Card.Text>{servicio.descripcion}</Card.Text>
                      {/* Marco el estado de tres formas a la vez: el color del botón, el texto y
                          aria-pressed. El color por sí solo no basta para quien no distingue
                          colores, y aria-pressed es lo que le dice al lector de pantalla que este
                          botón se queda activado y no es una simple acción. */}
                      <Button
                        variant={guardado ? "success" : "outline-success"}
                        onClick={() => guardarServicio(servicio.titulo)}
                        aria-pressed={guardado}
                      >
                        {guardado ? "Guardado ✓" : "Guardar servicio"}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>
    </>
  );
}
