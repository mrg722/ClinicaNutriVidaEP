import { vi } from "vitest";

// Reemplazo fetch durante las pruebas para no depender de que los
// microservicios estén en marcha. Cada entrada de "rutas" es un fragmento de
// URL y la respuesta que debe devolver, con la misma forma que usa el backend.
export function simularApi(rutas = {}) {
  const peticiones = [];

  const falsa = vi.fn(async (url, opciones = {}) => {
    const direccion = String(url);
    peticiones.push({ url: direccion, opciones });

    const clave = Object.keys(rutas).find((fragmento) => direccion.includes(fragmento));
    const definicion = clave ? rutas[clave] : undefined;
    const estado = definicion?.estado ?? (definicion ? 200 : 404);
    const cuerpo = definicion?.cuerpo ?? { error: "Ruta no simulada en la prueba." };

    return {
      ok: estado >= 200 && estado < 300,
      status: estado,
      text: async () => JSON.stringify(cuerpo),
    };
  });

  vi.stubGlobal("fetch", falsa);
  return { falsa, peticiones };
}

// Cuentas de prueba con la misma forma que devuelve GET /auth/perfil.
export const PERFILES = {
  ADMIN: { id: 1, nombre: "Administrador NutriVida", correo: "admin@nutrivida.cl", rol: "ADMIN", activo: true },
  NUTRICIONISTA: { id: 2, nombre: "Nut. Carolina Fuentes M.", correo: "carolina.fuentes@nutrivida.cl", rol: "NUTRICIONISTA", activo: true },
  PACIENTE: { id: 3, nombre: "Paciente de prueba", correo: "paciente@nutrivida.cl", rol: "PACIENTE", activo: true },
};

// Dejo una sesión ya abierta en sessionStorage, como ocurre tras recargar la página.
export function dejarSesionAbierta(rol = "ADMIN") {
  const perfil = PERFILES[rol];
  sessionStorage.setItem("nutrivida_token", `token-de-prueba-${rol}`);
  sessionStorage.setItem("nutrivida_usuario", JSON.stringify(perfil));
  return perfil;
}
