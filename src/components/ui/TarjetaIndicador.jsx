// Tarjeta de indicador para el panel de estadísticas: un número grande con su
// título y, si hace falta, una nota que lo explica.
export default function TarjetaIndicador({ titulo, valor, nota, tono = "principal" }) {
  return (
    <article className={`nv-indicador nv-indicador--${tono}`}>
      <p className="nv-indicador__titulo">{titulo}</p>
      <p className="nv-indicador__valor">{valor}</p>
      {nota ? <p className="nv-indicador__nota">{nota}</p> : null}
    </article>
  );
}
