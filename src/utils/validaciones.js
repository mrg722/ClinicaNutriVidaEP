// Concentro aquí las reglas de validación para que el contacto, la reserva y el registro exijan
// exactamente lo mismo. Si cada formulario tuviera su propia expresión regular, al corregir una
// me quedarían las otras con la regla vieja.
// Son validaciones de conveniencia para la persona que escribe: ayudan a corregir antes de
// enviar, pero no protegen nada, porque cualquiera puede llamar a la API sin pasar por el
// formulario. La validación que de verdad decide es la del backend.
const PATRON_CORREO = /^[^\s@]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
// Las cuentas del backend usan el dominio institucional de la clínica, así que
// el acceso y el registro aceptan además @nutrivida.cl.
const PATRON_CORREO_CUENTA = /^[^\s@]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com|nutrivida\.cl)$/i;
const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,100}$/;
const PATRON_TELEFONO = /^\+?\d[\d\s-]{7,14}$/;

// Paso por String(valor ?? "") antes de cada prueba porque a estas funciones puede llegar
// undefined desde un campo que todavía no se ha tocado, y test() sobre undefined lo convertiría
// al texto "undefined", que en algunos patrones pasaría como válido.
export function normalizarCorreo(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

export function validarCorreo(valor) {
  return PATRON_CORREO.test(normalizarCorreo(valor));
}

// Uso esta variante solo en el inicio de sesión y el registro de cuentas.
export function validarCorreoCuenta(valor) {
  return PATRON_CORREO_CUENTA.test(normalizarCorreo(valor));
}

export function validarNombre(valor) {
  return PATRON_NOMBRE.test(String(valor ?? "").trim());
}

export function validarTelefono(valor) {
  return PATRON_TELEFONO.test(String(valor ?? "").trim());
}

// Armo la fecha de hoy como texto "AAAA-MM-DD" a mano, en vez de usar toISOString(): ese método
// entrega la fecha en UTC y en Chile, de noche, devolvería el día siguiente. Así comparo contra
// el mismo día que ve la persona en su calendario.
export function obtenerFechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return [anio, mes, dia].join("-");
}

// Comparo las fechas como texto y no como objetos Date: el formato "AAAA-MM-DD" ordena igual
// alfabéticamente que cronológicamente, así que me evito construir fechas y arrastrar la zona
// horaria. Recibo "hoy" como parámetro para poder fijarlo en las pruebas.
export function validarFechaNoAnterior(valor, hoy = new Date()) {
  return Boolean(valor) && valor >= obtenerFechaLocal(hoy);
}

// Las 09:00 y las 18:00 son el horario de atención de la clínica, no un límite técnico. También
// aquí comparo texto, porque el campo de hora entrega siempre "HH:MM" con dos dígitos.
export function validarHoraConsulta(valor) {
  return Boolean(valor) && valor >= "09:00" && valor <= "18:00";
}

// Exijo diez caracteres en el motivo para que el nutricionista reciba algo que pueda leer antes
// de la cita: un motivo de una palabra no le sirve para prepararse.
export function validarMotivoConsulta(valor) {
  return String(valor ?? "").trim().length >= 10;
}
