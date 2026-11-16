import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Administracion from "../pages/Administracion";
import Acceso from "../pages/Acceso";
import Contacto from "../pages/Contacto";
import Reserva from "../pages/Reserva";
import { ProveedorSesion } from "../context/SesionContext";
import { simularApi } from "../test/apiFalsa";

// Envuelvo cada vista en el proveedor de sesión y en el router, igual que hace
// la aplicación real.
function renderConSesion(elemento, ruta = "/") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>{elemento}</ProveedorSesion>
    </MemoryRouter>,
  );
}

const productos = [
  { id: "EV002", nombre: "Bioimpedanciometría", categoria: "Evaluación", descripcion: "Evaluación de composición corporal.", precio: 12000, imagen: null },
];

function fechaFutura() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 2);
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

async function completarReserva(user) {
  await user.type(screen.getByLabelText("Nombre completo"), "Ana María");
  await user.type(screen.getByLabelText("Correo electrónico"), "ana@gmail.com");
  await user.type(screen.getByLabelText("Teléfono"), "+56 9 1234 5678");
  await user.selectOptions(screen.getByLabelText("Nutricionista preferido"), "nutricionista-01");
  await user.selectOptions(screen.getByLabelText("Servicio"), "Bioimpedanciometría");
  await user.type(screen.getByLabelText("Fecha solicitada"), fechaFutura());
  await user.type(screen.getByLabelText("Hora"), "10:00");
  await user.type(screen.getByLabelText("Motivo de consulta"), "Consulta general de alimentación");
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Integrante 3 · formularios y validaciones", () => {
  it("muestra errores al enviar una reserva vacía", async () => {
    const user = userEvent.setup();
    renderConSesion(<Reserva productos={productos} />);
    await user.click(screen.getByRole("button", { name: "Validar solicitud" }));
    expect(screen.getByText("Ingresa un nombre válido.")).toBeInTheDocument();
    expect(screen.getByText("Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.")).toBeInTheDocument();
  });

  it("rechaza correo no permitido en una reserva", async () => {
    const user = userEvent.setup();
    renderConSesion(<Reserva productos={productos} />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana María");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Validar solicitud" }));
    expect(screen.getByText("Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.")).toBeInTheDocument();
  });

  it("valida la reserva completa sin afirmar que existe una agenda conectada", async () => {
    const user = userEvent.setup();
    renderConSesion(<Reserva productos={productos} />);
    await completarReserva(user);
    await user.click(screen.getByRole("button", { name: "Validar solicitud" }));
    expect(screen.getByRole("status")).toHaveTextContent("no confirma una cita");
  });

  it("preselecciona el servicio consultado mediante el parámetro de URL", () => {
    renderConSesion(<Reserva productos={productos} />, "/reserva?servicio=EV002");
    expect(screen.getByLabelText("Servicio")).toHaveValue("Bioimpedanciometría");
  });

  it("rechaza un mensaje de contacto demasiado corto", async () => {
    const user = userEvent.setup();
    renderConSesion(<Contacto />);
    await user.type(screen.getByLabelText("Mensaje"), "Hola");
    await user.click(screen.getByRole("button", { name: "Validar mensaje" }));
    expect(screen.getByText("Escribe un mensaje de al menos 10 caracteres.")).toBeInTheDocument();
  });

  it("valida un formulario de contacto completo", async () => {
    const user = userEvent.setup();
    renderConSesion(<Contacto />);
    await user.type(screen.getByLabelText("Nombre"), "Ana María");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Teléfono"), "+56 9 1234 5678");
    await user.type(screen.getByLabelText("Asunto"), "Consulta");
    await user.type(screen.getByLabelText("Mensaje"), "Deseo más información sobre un servicio.");
    await user.click(screen.getByRole("button", { name: "Validar mensaje" }));
    expect(screen.getByRole("status")).toHaveTextContent("no se envían mensajes a un servidor");
  });

  it("valida nombre y dominio de correo al registrarse", async () => {
    const user = userEvent.setup();
    renderConSesion(<Acceso modo="registro" />);
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.click(screen.getByRole("button", { name: "Validar registro" }));
    expect(screen.getByText("Ingresa tu nombre.")).toBeInTheDocument();
    expect(
      screen.getByText("Usa @duoc.cl, @profesor.duoc.cl, @gmail.com o @nutrivida.cl."),
    ).toBeInTheDocument();
  });

  it("crea la cuenta en el servicio de autenticación y no guarda la contraseña", async () => {
    const user = userEvent.setup();
    const { peticiones } = simularApi({
      "/auth/registro": {
        estado: 201,
        cuerpo: { id: 9, nombre: "Ana María", correo: "ana@gmail.com", rol: "PACIENTE", activo: true },
      },
    });
    renderConSesion(<Acceso modo="registro" />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana María");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.click(screen.getByRole("button", { name: "Validar registro" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Cuenta creada correctamente");
    expect(peticiones.some((peticion) => peticion.url.includes("/auth/registro"))).toBe(true);
    expect(localStorage.getItem("password")).toBeNull();
  });

  it("muestra el mensaje del backend cuando el correo ya está registrado", async () => {
    const user = userEvent.setup();
    simularApi({
      "/auth/registro": { estado: 409, cuerpo: { error: "El correo ya está registrado." } },
    });
    renderConSesion(<Acceso modo="registro" />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana María");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave123");
    await user.click(screen.getByRole("button", { name: "Validar registro" }));
    expect(await screen.findByText("El correo ya está registrado.")).toBeInTheDocument();
  });

  it("crea un producto a través de las props del formulario administrativo", async () => {
    const user = userEvent.setup();
    const onCrearProducto = vi.fn();
    renderConSesion(
      <Administracion
        productos={productos}
        onCrearProducto={onCrearProducto}
        onEliminarProducto={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole("button", { name: "Catálogo local" }));
    await user.type(screen.getByLabelText("Nombre"), "Plan de prueba");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Taller");
    await user.type(screen.getByLabelText("Precio en pesos chilenos"), "18000");
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(onCrearProducto).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Plan de prueba",
        categoria: "Taller",
        precio: 18000,
      }),
    );
  });

  it("rechaza producto administrativo sin nombre, categoría o con precio negativo", async () => {
    const user = userEvent.setup();
    const onCrearProducto = vi.fn();
    renderConSesion(
      <Administracion
        productos={productos}
        onCrearProducto={onCrearProducto}
        onEliminarProducto={vi.fn()}
      />,
    );
    await user.click(await screen.findByRole("button", { name: "Catálogo local" }));
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona una categoría.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un precio igual o mayor que cero.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre"), "Plan inválido");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Taller");
    await user.type(screen.getByLabelText("Precio en pesos chilenos"), "-1");
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(screen.getByText("Ingresa un precio igual o mayor que cero.")).toBeInTheDocument();
    expect(onCrearProducto).not.toHaveBeenCalled();
  });
});
