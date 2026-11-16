import { Button, Modal } from "react-bootstrap";

// Pido confirmación antes de las acciones que no se pueden deshacer, como
// cancelar una cita o eliminar un registro.
export default function DialogoConfirmacion({
  visible,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  onConfirmar,
  onCerrar,
}) {
  return (
    <Modal show={visible} onHide={onCerrar} centered>
      <Modal.Header closeButton closeLabel="Cerrar">
        <Modal.Title as="h2" className="h5">{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{mensaje}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCerrar}>Volver</Button>
        <Button variant="danger" onClick={onConfirmar}>{textoConfirmar}</Button>
      </Modal.Footer>
    </Modal>
  );
}
