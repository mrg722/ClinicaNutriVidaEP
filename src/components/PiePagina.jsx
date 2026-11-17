import { Container } from "react-bootstrap";

// Pie de página único para todas las vistas: lo monto una vez en App y no dentro de cada página,
// así el texto se cambia en un solo lugar y nunca aparece desigual entre vistas.
export default function PiePagina() {
  return (
    // Uso la etiqueta footer y no un div para que el lector de pantalla lo anuncie como el pie
    // del documento y pueda saltar directo a él.
    <footer className="nv-footer">
      <Container className="d-flex flex-wrap justify-content-between gap-2">
        <span>Clínica NutriVida · Tu bienestar comienza con buenos hábitos.</span>
        <span>Proyecto académico DSY1104 · EP3</span>
      </Container>
    </footer>
  );
}
