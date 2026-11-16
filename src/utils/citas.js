// Reúno aquí los textos y colores de los estados de una cita para que la vista
// del paciente, la agenda profesional y el panel de administración los muestren
// siempre igual. Los nombres de estado son los mismos que define el backend.
export const ESTADOS_CITA = [
  "SOLICITADA",
  "CONFIRMADA",
  "ATENDIDA",
  "CANCELADA",
  "NO_ASISTIO",
];

const ETIQUETAS = {
  SOLICITADA: "Solicitada",
  CONFIRMADA: "Confirmada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
};

const COLORES = {
  SOLICITADA: "secondary",
  CONFIRMADA: "success",
  ATENDIDA: "primary",
  CANCELADA: "dark",
  NO_ASISTIO: "warning",
};

export function etiquetaEstado(estado) {
  return ETIQUETAS[estado] ?? estado;
}

export function colorEstado(estado) {
  return COLORES[estado] ?? "secondary";
}

// Una cita ya cerrada no admite más cambios: el backend responde 409, así que
// tampoco ofrezco los botones en pantalla.
export function estaCerrada(estado) {
  return ["ATENDIDA", "CANCELADA", "NO_ASISTIO"].includes(estado);
}

// Muestro la fecha en formato chileno sin construir un Date, para que la zona
// horaria no desplace el día que envió el backend.
export function formatearFecha(fecha) {
  if (typeof fecha !== "string") return "";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  const [anio, mes, dia] = partes;
  return `${dia}-${mes}-${anio}`;
}

// La hora llega como "10:30" o "10:30:00"; dejo solo horas y minutos.
export function formatearHora(hora) {
  if (typeof hora !== "string") return "";
  return hora.slice(0, 5);
}
