import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

// Vista que muestra el enrutador cuando ninguna ruta coincide. La tengo porque la aplicación es
// de una sola página: sin esta pantalla, una dirección mal escrita dejaría el contenido en blanco
// y nadie sabría si se equivocó al escribir o si la aplicación falló.
export default function NoEncontrada() {
  return (
    // Marco el contenedor como main para que esta pantalla tenga la misma estructura semántica
    // que el resto de las vistas y el salto al contenido principal siga funcionando.
    <Container as="main" className="nv-section text-center">
      <p className="nv-eyebrow">ERROR 404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no corresponde a una vista disponible.</p>
      {/* Dejo siempre una salida al inicio: una pantalla de error sin camino de vuelta obliga a
          usar el botón atrás del navegador, que no siempre lleva a donde la persona espera. */}
      <Link className="btn btn-success" to="/">Volver al inicio</Link>
    </Container>
  );
}
