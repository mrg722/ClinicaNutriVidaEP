import { describe, expect, it } from "vitest";
import {
  normalizarCorreo,
  obtenerFechaLocal,
  validarCorreo,
  validarFechaNoAnterior,
  validarHoraConsulta,
  validarMotivoConsulta,
  validarNombre,
  validarTelefono,
} from "./validaciones";

// Estas son las reglas que revisan los formularios antes de enviar nada al backend. Las pruebo
// una por una porque son las que evitan que lleguen datos mal escritos, y porque cada una tiene
// un caso límite que es fácil equivocar.
describe("validaciones de NutriVida", () => {
  // Dejo el correo en minúsculas y sin espacios antes de compararlo, porque la persona puede
  // escribirlo de cualquier forma y para el sistema tiene que ser el mismo correo.
  it("normaliza correo y trata valores nulos", () => {
    expect(normalizarCorreo("  Ana@GMAIL.COM ")).toBe("ana@gmail.com");
    expect(normalizarCorreo(null)).toBe("");
  });

  // El formulario acepta solo tres dominios. El último caso confirma que uno cualquiera se
  // rechaza, que es lo que de verdad prueba que la regla existe.
  it("acepta los dominios del formulario original", () => {
    expect(validarCorreo("ana@gmail.com")).toBe(true);
    expect(validarCorreo("alumno@duoc.cl")).toBe(true);
    expect(validarCorreo("profe@profesor.duoc.cl")).toBe(true);
    expect(validarCorreo("ana@example.com")).toBe(false);
  });

  // Compruebo que las tildes y la ñ pasen, porque es lo que primero se rompe cuando la regla se
  // escribe pensando solo en el alfabeto inglés. Y que un número no se cuele en un nombre.
  it("valida nombres con tildes y rechaza números", () => {
    expect(validarNombre("Ana María")).toBe(true);
    expect(validarNombre("José Núñez")).toBe(true);
    expect(validarNombre("Ana3")).toBe(false);
    expect(validarNombre(null)).toBe(false);
  });

  // Acepto el teléfono con prefijo del país y espacios, y también escrito de corrido, porque la
  // gente usa las dos formas y rechazarlas sería estorbar sin motivo.
  it("valida teléfonos nacionales o internacionales", () => {
    expect(validarTelefono("+56 9 1234 5678")).toBe(true);
    expect(validarTelefono("912345678")).toBe(true);
    expect(validarTelefono("teléfono")).toBe(false);
    expect(validarTelefono(null)).toBe(false);
  });

  // Armo la fecha con la hora local y no en UTC. Si usara UTC, en Chile una reserva hecha de
  // noche se guardaría con la fecha del día siguiente. Por eso octubre es el mes 9 aquí.
  it("crea fecha local con formato AAAA-MM-DD", () => {
    expect(obtenerFechaLocal(new Date(2026, 9, 15))).toBe("2026-10-15");
  });

  // El día de hoy sí vale, el de ayer no. Le paso la fecha de referencia en vez de usar la del
  // sistema para que la prueba dé el mismo resultado hoy y dentro de un año.
  it("acepta reservas de hoy o posteriores", () => {
    const hoy = new Date(2026, 9, 15);
    expect(validarFechaNoAnterior("", hoy)).toBe(false);
    expect(validarFechaNoAnterior("2026-10-14", hoy)).toBe(false);
    expect(validarFechaNoAnterior("2026-10-15", hoy)).toBe(true);
    expect(validarFechaNoAnterior("2026-10-16", hoy)).toBe(true);
  });

  // Los dos extremos entran y el minuto de más queda fuera por los dos lados. Pruebo justo el
  // borde porque es donde se nota si la comparación usó mayor o mayor o igual.
  it("valida horario de consulta inclusive entre 09:00 y 18:00", () => {
    expect(validarHoraConsulta("09:00")).toBe(true);
    expect(validarHoraConsulta("18:00")).toBe(true);
    expect(validarHoraConsulta("08:59")).toBe(false);
    expect(validarHoraConsulta("18:01")).toBe(false);
    expect(validarHoraConsulta("")).toBe(false);
  });

  // Pido diez caracteres para que el motivo le sirva de algo al profesional. "Dolor" tiene
  // cinco y queda fuera; es el caso que delimita la regla.
  it("requiere al menos diez caracteres en el motivo", () => {
    expect(validarMotivoConsulta("Dolor")).toBe(false);
    expect(validarMotivoConsulta("Consulta general")).toBe(true);
    expect(validarMotivoConsulta(null)).toBe(false);
  });
});
