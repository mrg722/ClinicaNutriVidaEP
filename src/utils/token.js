// Leo la fecha de expiración que viaja dentro del token para saber cuándo
// conviene renovarlo. Solo interpreto la carga útil; la firma la valida el
// backend, aquí nunca decido si el token es legítimo.
const MINUTOS_POR_DEFECTO = 50;

function decodificarCarga(token) {
  try {
    const carga = String(token).split(".")[1];
    if (!carga) return null;
    // El JWT usa base64url, así que repongo los caracteres estándar.
    const normalizada = carga.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizada));
  } catch {
    return null;
  }
}

// Devuelvo los milisegundos que faltan para que el token expire. Si no puedo
// leer la fecha, uso un plazo prudente por defecto.
export function milisegundosHastaExpirar(token, ahora = Date.now()) {
  const carga = decodificarCarga(token);
  const expiracion = Number(carga?.exp);
  if (!Number.isFinite(expiracion)) return MINUTOS_POR_DEFECTO * 60 * 1000;
  return expiracion * 1000 - ahora;
}

// Programo la renovación un poco antes del vencimiento y nunca con menos de
// treinta segundos de espera, para no encadenar llamadas seguidas.
export function milisegundosParaRenovar(token, ahora = Date.now()) {
  const restantes = milisegundosHastaExpirar(token, ahora);
  return Math.max(30 * 1000, restantes - 2 * 60 * 1000);
}
