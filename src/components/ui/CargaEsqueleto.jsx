// Esqueleto de carga: muestro bloques con la forma del contenido que viene en
// camino en vez de un spinner suelto, así la espera se siente más breve.
export default function CargaEsqueleto({ filas = 3, etiqueta = "Cargando información…" }) {
  return (
    <div className="nv-esqueleto" role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">{etiqueta}</span>
      {Array.from({ length: filas }, (_, indice) => (
        <span className="nv-esqueleto__linea" key={indice} />
      ))}
    </div>
  );
}
