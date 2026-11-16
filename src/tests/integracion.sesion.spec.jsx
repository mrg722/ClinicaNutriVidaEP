import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProveedorSesion, useSesion } from "../context/SesionContext";
import RutaProtegida from "../components/RutaProtegida";
import { crearCliente } from "../services/clienteHttp";
import { milisegundosHastaExpirar, milisegundosParaRenovar } from "../utils/token";
import { PERFILES, dejarSesionAbierta, simularApi } from "../test/apiFalsa";

// Vista mínima para comprobar qué deja pasar la ruta protegida.
function Panel() {
  return <h1>Panel reservado</h1>;
}

function Entrada() {
  return <h1>Iniciar sesión</h1>;
}

// Pequeña vista que muestra lo que expone el contexto de sesión.
function EstadoSesion() {
  const { usuario, cargando, autenticado, tieneRol } = useSesion();
  if (cargando) return <p>Validando</p>;
  return (
    <p>
      {autenticado ? `Sesión de ${usuario.nombre}` : "Sin sesión"} ·
      {tieneRol("ADMIN") ? " es admin" : " no es admin"}
    </p>
  );
}

function renderConRutas(elemento, ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <Routes>
          <Route path="/login" element={<Entrada />} />
          <Route element={elemento}>
            <Route path="/admin" element={<Panel />} />
          </Route>
        </Routes>
      </ProveedorSesion>
    </MemoryRouter>,
  );
}

// Armo un token de prueba con la expiración que necesito. La firma es de
// relleno porque el frontend solo lee la carga útil; validarla es del backend.
function tokenConExpiracion(segundosDesdeAhora) {
  const carga = {
    sub: "admin@nutrivida.cl",
    rol: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + segundosDesdeAhora,
  };
  const base = btoa(JSON.stringify(carga)).split("+").join("-").split("/").join("_");
  return `cabecera.${base}.firma`;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Gestión de sesión y restricción por rol", () => {
  it("revalida el token guardado contra el perfil al montar la aplicación", async () => {
    const { peticiones } = simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN } });
    dejarSesionAbierta("ADMIN");
    render(
      <MemoryRouter>
        <ProveedorSesion><EstadoSesion /></ProveedorSesion>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Sesión de Administrador NutriVida/)).toBeInTheDocument();
    expect(peticiones.some((peticion) => peticion.url.includes("/auth/perfil"))).toBe(true);
  });

  it("limpia la sesión guardada si el perfil responde 401", async () => {
    simularApi({ "/auth/perfil": { estado: 401, cuerpo: { error: "Token vencido." } } });
    dejarSesionAbierta("PACIENTE");
    render(
      <MemoryRouter>
        <ProveedorSesion><EstadoSesion /></ProveedorSesion>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Sin sesión/)).toBeInTheDocument();
    expect(sessionStorage.getItem("nutrivida_token")).toBeNull();
  });

  it("envía al login cuando no hay sesión", async () => {
    simularApi({});
    renderConRutas(<RutaProtegida roles={["ADMIN"]} />, "/admin");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("deja pasar al rol permitido", async () => {
    simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN } });
    dejarSesionAbierta("ADMIN");
    renderConRutas(<RutaProtegida roles={["ADMIN"]} />, "/admin");
    expect(await screen.findByRole("heading", { name: "Panel reservado" })).toBeInTheDocument();
  });

  it("avisa que falta permiso cuando el rol no alcanza", async () => {
    simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE } });
    dejarSesionAbierta("PACIENTE");
    renderConRutas(<RutaProtegida roles={["ADMIN"]} />, "/admin");
    expect(await screen.findByRole("heading", { name: "Sin permiso" })).toBeInTheDocument();
  });
});

describe("Cliente HTTP compartido", () => {
  const cliente = crearCliente("http://api-de-prueba/v1");

  it("agrega el token y los parámetros de consulta", async () => {
    const { peticiones } = simularApi({ "/servicios": { estado: 200, cuerpo: [] } });
    await cliente.solicitar("/servicios", { token: "abc", params: { soloActivos: true, tipo: "" } });
    const enviada = peticiones[0];
    expect(enviada.url).toBe("http://api-de-prueba/v1/servicios?soloActivos=true");
    expect(enviada.opciones.headers.Authorization).toBe("Bearer abc");
  });

  it("usa el mensaje del campo error que devuelve el backend", async () => {
    simularApi({ "/citas": { estado: 409, cuerpo: { error: "Ese horario ya está tomado." } } });
    await expect(cliente.solicitar("/citas", { metodo: "POST", cuerpo: {} })).rejects.toThrow(
      "Ese horario ya está tomado.",
    );
  });

  it("devuelve nulo ante una respuesta 204 sin cuerpo", async () => {
    simularApi({ "/citas/5": { estado: 204, cuerpo: null } });
    await expect(cliente.solicitar("/citas/5", { metodo: "DELETE" })).resolves.toBeNull();
  });

  it("avisa en claro cuando no se puede contactar al servidor", async () => {
    const { falsa } = simularApi({});
    falsa.mockRejectedValueOnce(new Error("conexión rechazada"));
    await expect(cliente.solicitar("/servicios")).rejects.toThrow(/no pudimos conectarnos/i);
  });
});

describe("Renovación del token antes de que venza", () => {
  it("calcula el plazo a partir de la expiración del token", () => {
    const token = tokenConExpiracion(3600);
    expect(milisegundosHastaExpirar(token)).toBeGreaterThan(3500 * 1000);
    // Renuevo dos minutos antes del vencimiento.
    expect(milisegundosParaRenovar(token)).toBeLessThan(3500 * 1000);
    expect(milisegundosParaRenovar(token)).toBeGreaterThan(3400 * 1000);
  });

  it("nunca programa la renovación con menos de treinta segundos", () => {
    expect(milisegundosParaRenovar(tokenConExpiracion(10))).toBe(30 * 1000);
  });

  it("usa un plazo por defecto si el token no trae expiración legible", () => {
    expect(milisegundosHastaExpirar("token-sin-forma-de-jwt")).toBe(50 * 60 * 1000);
  });

  it("pide un token nuevo y lo guarda sin devolver a la persona al login", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const tokenNuevo = tokenConExpiracion(3600);
    const { peticiones } = simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN },
      "/auth/renovar": {
        estado: 200,
        cuerpo: { token: tokenNuevo, ...PERFILES.ADMIN },
      },
    });
    sessionStorage.setItem("nutrivida_token", tokenConExpiracion(130));
    sessionStorage.setItem("nutrivida_usuario", JSON.stringify(PERFILES.ADMIN));

    render(
      <MemoryRouter>
        <ProveedorSesion><EstadoSesion /></ProveedorSesion>
      </MemoryRouter>,
    );
    await screen.findByText(/Sesión de Administrador NutriVida/);

    // Avanzo el reloj hasta el momento en que toca renovar.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31 * 1000);
    });

    await waitFor(() => {
      expect(peticiones.some((peticion) => peticion.url.includes("/auth/renovar"))).toBe(true);
    });
    await waitFor(() => {
      expect(sessionStorage.getItem("nutrivida_token")).toBe(tokenNuevo);
    });
    expect(screen.getByText(/Sesión de Administrador NutriVida/)).toBeInTheDocument();
  });

  it("cierra la sesión si la renovación responde 401", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN },
      "/auth/renovar": { estado: 401, cuerpo: { error: "Token vencido." } },
    });
    sessionStorage.setItem("nutrivida_token", tokenConExpiracion(130));
    sessionStorage.setItem("nutrivida_usuario", JSON.stringify(PERFILES.ADMIN));

    render(
      <MemoryRouter>
        <ProveedorSesion><EstadoSesion /></ProveedorSesion>
      </MemoryRouter>,
    );
    await screen.findByText(/Sesión de Administrador NutriVida/);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31 * 1000);
    });

    expect(await screen.findByText(/Sin sesión/)).toBeInTheDocument();
    expect(sessionStorage.getItem("nutrivida_token")).toBeNull();
  });
});
