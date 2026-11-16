import { Alert, Button } from "react-bootstrap";

// Muestro el mensaje real que devolvió el backend en el campo "error" y, cuando
// la operación se puede repetir, ofrezco reintentar.
export default function BloqueError({ mensaje, onReintentar }) {
  if (!mensaje) return null;

  return (
    <Alert variant="danger" role="alert" className="nv-error">
      <p className="mb-0">{mensaje}</p>
      {onReintentar ? (
        <Button variant="outline-danger" size="sm" className="mt-2" onClick={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </Alert>
  );
}
