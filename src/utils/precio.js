// Dejo el formato de los montos en una sola función para que el precio se vea idéntico en el
// catálogo, el detalle y el carrito, y para decidir en un solo lugar qué mostrar en los casos
// raros. Devuelvo un texto listo para pintar, no un número: así ninguna vista tiene que resolver
// por su cuenta qué hacer cuando el precio no viene.
export function formatearPrecio(valor) {
  const numero = Number(valor);

  // Un precio ausente, un texto o un número negativo no son errores que deba ocultar con un
  // "$0": prefiero decirlo, porque un cero haría creer que el servicio es gratis.
  // Uso Number.isFinite y no isNaN, porque también quiero descartar Infinity.
  if (!Number.isFinite(numero) || numero < 0) {
    return "Precio no disponible";
  }

  // El cero sí es un precio válido, y "Gratis" se entiende mejor que "$0".
  if (numero === 0) {
    return "Gratis";
  }

  // Delego el formato en Intl con es-CL en vez de armar el texto a mano: el navegador ya sabe que
  // en Chile el separador de miles es el punto y que el peso no usa decimales.
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(numero);
}
