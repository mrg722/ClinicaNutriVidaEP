import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProveedorSesion } from "../context/SesionContext";
import Administracion from "../pages/Administracion";
import Agenda from "../pages/Agenda";
import FichaClinica from "../pages/FichaClinica";
import MiProgreso from "../pages/MiProgreso";
import MisCitas from "../pages/MisCitas";
import { PERFILES, dejarSesionAbierta, simularApi } from "../test/apiFalsa";

// Respuestas con la misma forma que entregan los microservicios.
const CITA_SOLICITADA = {
  id: 10,
  correoPaciente: "paciente@nutrivida.cl",
  nutricionistaId: 1,
  nutricionistaNombre: "Nut. Carolina Fuentes M.",
  nutricionistaEspecialidad: "Obesidad y síndrome metabólico",
  servicioId: 1,
  servicioCodigo: "CN001",
  servicioNombre: "Primera consulta nutricional",
  servicioPrecio: 35000,
  fecha: "2026-12-03",
  hora: "10:30",
  motivo: "Control de peso y hábitos",
  estado: "SOLICITADA",
};

const MEDICION = {
  id: 4,
  correoPaciente: "paciente@nutrivida.cl",
  correoNutricionista: "carolina.fuentes@nutrivida.cl",
  fecha: "2026-11-16",
  pesoKg: 82.5,
  tallaCm: 172,
  cinturaCm: 95,
  imc: 27.89,
  observaciones: "Primer control",
  planAlimenticio: "Cuatro comidas diarias",
};

function renderConSesion(elemento, rol = "PACIENTE", ruta = "/") {
  dejarSesionAbierta(rol);
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>{elemento}</ProveedorSesion>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Vistas conectadas a la agenda", () => {
  it("muestra las citas que devuelve el servicio de citas", async () => {
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE },
      "/citas/mias": { estado: 200, cuerpo: [CITA_SOLICITADA] },
    });
    renderConSesion(<MisCitas />);
    expect(await screen.findByText("Primera consulta nutricional")).toBeInTheDocument();
    expect(screen.getByText("Solicitada")).toBeInTheDocument();
  });

  it("avisa cuando el paciente todavía no tiene citas", async () => {
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE },
      "/citas/mias": { estado: 200, cuerpo: [] },
    });
    renderConSesion(<MisCitas />);
    expect(await screen.findByText("Todavía no tienes citas agendadas.")).toBeInTheDocument();
  });

  it("pide confirmación antes de cancelar y envía el estado CANCELADA", async () => {
    const user = userEvent.setup();
    const { peticiones } = simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE },
      "/citas/mias": { estado: 200, cuerpo: [CITA_SOLICITADA] },
      "/citas/10/estado": { estado: 200, cuerpo: { ...CITA_SOLICITADA, estado: "CANCELADA" } },
    });
    renderConSesion(<MisCitas />);
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText(/no se puede deshacer/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));

    const envio = await encontrarPeticion(peticiones, "/citas/10/estado");
    expect(JSON.parse(envio.opciones.body)).toEqual({ estado: "CANCELADA" });
  });

  it("muestra el mensaje del backend si la lista de citas falla", async () => {
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE },
      "/citas/mias": { estado: 500, cuerpo: { error: "El servicio no está disponible." } },
    });
    renderConSesion(<MisCitas />);
    expect(await screen.findByText("El servicio no está disponible.")).toBeInTheDocument();
  });

  it("permite al profesional confirmar una cita de su agenda", async () => {
    const user = userEvent.setup();
    const { peticiones } = simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.NUTRICIONISTA },
      "/citas/mias": { estado: 200, cuerpo: [CITA_SOLICITADA] },
      "/citas/10/estado": { estado: 200, cuerpo: { ...CITA_SOLICITADA, estado: "CONFIRMADA" } },
    });
    renderConSesion(<Agenda />, "NUTRICIONISTA");
    await user.click(await screen.findByRole("button", { name: "Confirmar" }));

    const envio = await encontrarPeticion(peticiones, "/citas/10/estado");
    expect(JSON.parse(envio.opciones.body)).toEqual({ estado: "CONFIRMADA" });
  });
});

describe("Vistas de seguimiento nutricional", () => {
  it("muestra el historial del paciente con el IMC que calculó el backend", async () => {
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE },
      "/mediciones/mias": { estado: 200, cuerpo: [MEDICION] },
    });
    renderConSesion(<MiProgreso />);
    expect((await screen.findAllByText("82.5 kg")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("27.9").length).toBeGreaterThan(0);
    expect(screen.getByText("Cuatro comidas diarias")).toBeInTheDocument();
  });

  it("registra una medición nueva desde la ficha clínica", async () => {
    const user = userEvent.setup();
    const { peticiones } = simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.NUTRICIONISTA },
      "/mediciones/paciente/": { estado: 200, cuerpo: [] },
      "/mediciones": { estado: 201, cuerpo: MEDICION },
    });
    renderConSesion(
      <FichaClinica />,
      "NUTRICIONISTA",
      "/ficha-clinica?correo=paciente@nutrivida.cl",
    );

    await user.type(await screen.findByLabelText("Peso en kilos"), "80");
    await user.type(screen.getByLabelText("Talla en centímetros"), "170");
    await user.click(screen.getByRole("button", { name: "Registrar medición" }));

    const envio = await encontrarPeticion(peticiones, "/mediciones", "POST");
    const cuerpo = JSON.parse(envio.opciones.body);
    expect(cuerpo.correoPaciente).toBe("paciente@nutrivida.cl");
    expect(cuerpo.pesoKg).toBe(80);
    // El IMC lo calcula el backend, así que no debe viajar en la petición.
    expect(cuerpo.imc).toBeUndefined();
  });
});

describe("Panel de administración", () => {
  it("lista las cuentas que entrega el servicio de autenticación", async () => {
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN },
      "/usuarios": { estado: 200, cuerpo: [PERFILES.ADMIN, PERFILES.PACIENTE] },
    });
    renderConSesion(
      <Administracion productos={[]} onCrearProducto={() => {}} onEliminarProducto={() => {}} />,
      "ADMIN",
    );
    expect(await screen.findByText("admin@nutrivida.cl")).toBeInTheDocument();
    expect(screen.getByText("paciente@nutrivida.cl")).toBeInTheDocument();
  });

  it("muestra los indicadores de gestión de la clínica", async () => {
    const user = userEvent.setup();
    simularApi({
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN },
      "/usuarios": { estado: 200, cuerpo: [] },
      "/estadisticas": {
        estado: 200,
        cuerpo: {
          totalCitas: 8,
          citasPorEstado: { SOLICITADA: 2, CONFIRMADA: 3, ATENDIDA: 2, CANCELADA: 0, NO_ASISTIO: 1 },
          tasaInasistencia: 12.5,
          atencionesPorNutricionista: [{ nutricionistaId: 1, nombre: "Nut. Carolina Fuentes M.", total: 2 }],
        },
      },
    });
    renderConSesion(
      <Administracion productos={[]} onCrearProducto={() => {}} onEliminarProducto={() => {}} />,
      "ADMIN",
    );
    await user.click(await screen.findByRole("button", { name: "Estadísticas" }));
    expect(await screen.findByText("8")).toBeInTheDocument();
    expect(screen.getByText("12.5 %")).toBeInTheDocument();
  });
});

// Espero a que la petición buscada aparezca entre las que se enviaron.
async function encontrarPeticion(peticiones, fragmento, metodo) {
  for (let intento = 0; intento < 20; intento += 1) {
    const encontrada = peticiones.find(
      (peticion) =>
        peticion.url.includes(fragmento) &&
        (!metodo || peticion.opciones.method === metodo),
    );
    if (encontrada) return encontrada;
    await new Promise((resolver) => setTimeout(resolver, 25));
  }
  throw new Error(`No se envió ninguna petición a ${fragmento}`);
}
