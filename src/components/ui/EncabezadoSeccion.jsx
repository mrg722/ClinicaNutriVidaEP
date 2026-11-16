// Encabezado reutilizable: mantengo la misma jerarquía visual en todas las
// vistas (texto de contexto, título y descripción) y dejo un espacio a la
// derecha para acciones como un botón de recarga.
export default function EncabezadoSeccion({ contexto, titulo, descripcion, acciones }) {
  return (
    <header className="nv-encabezado">
      <div>
        {contexto ? <p className="nv-eyebrow">{contexto}</p> : null}
        <h1>{titulo}</h1>
        {descripcion ? <p className="nv-encabezado__texto">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="nv-encabezado__acciones">{acciones}</div> : null}
    </header>
  );
}
