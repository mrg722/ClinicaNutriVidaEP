import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProveedorSesion, useSesion } from "../context/SesionContext";
import RutaProtegida from "../components/RutaProtegida";
import { crearCliente } from "../services/clienteHttp";
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

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
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
