// Bloque para cuando una lista no tiene datos: explico la situación y, si
// corresponde, ofrezco la acción que la resuelve.
export default function EstadoVacio({ titulo, mensaje, children }) {
  return (
    <div className="nv-empty" role="status">
      {titulo ? <p className="nv-empty__titulo">{titulo}</p> : null}
      {mensaje ? <p className="nv-empty__texto">{mensaje}</p> : null}
      {children}
    </div>
  );
}
