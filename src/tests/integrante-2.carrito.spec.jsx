import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Carrito from "../pages/Carrito";

// Una línea con cantidad 2 y precio redondo, para que el total sea fácil de comprobar a ojo:
// 10.000 por 2 son 20.000.
const carritoEjemplo = [
  { id: "EV002", nombre: "Bioimpedanciometría", precio: 10000, cantidad: 2 },
];

// El carrito no guarda nada por su cuenta: recibe la lista y avisa hacia afuera cuando la
// persona hace algo. Por eso le paso funciones espía y en cada prueba reviso a cuál llamó y
// con qué. Con overrides puedo reemplazar solo lo que esa prueba necesita.
function renderCarrito(overrides = {}) {
  const props = {
    carrito: carritoEjemplo,
    onCambiarCantidad: vi.fn(),
    onEliminar: vi.fn(),
    onVaciar: vi.fn(),
    ...overrides,
  };
  return { ...render(<MemoryRouter><Carrito {...props} /></MemoryRouter>), props };
}

describe("Integrante 2 · carrito", () => {
  // Con el carrito vacío no dejo la pantalla en blanco: explico la situación y ofrezco salida.
  it("muestra el estado vacío y el enlace al catálogo", () => {
    renderCarrito({ carrito: [] });
    expect(screen.getByText("El carrito está vacío.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar servicios" })).toHaveAttribute("href", "/productos");
  });

  // Busco la fila por su contenido, que es como la ve la persona, no por su posición.
  it("muestra producto y cantidad recibidos", () => {
    renderCarrito();
    expect(screen.getByRole("row", { name: /Bioimpedanciometría/ })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // El total lo calcula el carrito, no llega hecho: 10.000 por 2 tienen que dar 20.000.
  it("calcula el total multiplicando precio por cantidad", () => {
    renderCarrito();
    expect(screen.getByText(/Total:.*20\.000/)).toBeInTheDocument();
  });

  // El botón no cambia la cantidad por su cuenta: avisa hacia afuera con el código y un +1.
  it("solicita aumentar la cantidad a través de la prop callback", async () => {
    const user = userEvent.setup();
    const onCambiarCantidad = vi.fn();
    renderCarrito({ onCambiarCantidad });
    await user.click(screen.getByRole("button", { name: "Agregar una unidad de Bioimpedanciometría" }));
    expect(onCambiarCantidad).toHaveBeenCalledWith("EV002", 1);
  });

  // Lo mismo al restar, pero con -1. Compruebo el signo porque es fácil invertirlo.
  it("solicita disminuir la cantidad a través de la prop callback", async () => {
    const user = userEvent.setup();
    const onCambiarCantidad = vi.fn();
    renderCarrito({ onCambiarCantidad });
    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Bioimpedanciometría" }));
    expect(onCambiarCantidad).toHaveBeenCalledWith("EV002", -1);
  });

  // Al eliminar basta con el código del servicio: quien decide qué hacer es el componente padre.
  it("solicita eliminar la línea seleccionada", async () => {
    const user = userEvent.setup();
    const onEliminar = vi.fn();
    renderCarrito({ onEliminar });
    await user.click(screen.getByRole("button", { name: "Eliminar Bioimpedanciometría" }));
    expect(onEliminar).toHaveBeenCalledWith("EV002");
  });

  // Vaciar avisa una sola vez y sin argumentos, porque se lleva todo.
  it("permite vaciar el carrito", async () => {
    const user = userEvent.setup();
    const onVaciar = vi.fn();
    renderCarrito({ onVaciar });
    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(onVaciar).toHaveBeenCalledOnce();
  });

  // Cada línea muestra su propio subtotal, no solo el total de abajo.
  it("muestra el subtotal de la línea", () => {
    renderCarrito();
    expect(screen.getByRole("row", { name: /Bioimpedanciometría.*20\.000/ })).toBeInTheDocument();
  });

  // El carrito termina en la reserva: compruebo que el enlace lleve a la página correcta.
  it("ofrece continuar hacia el formulario de reserva", () => {
    renderCarrito();
    expect(screen.getByRole("link", { name: "Continuar a reserva" })).toHaveAttribute("href", "/reserva");
  });

  // Con dos servicios distintos el total tiene que ser la suma de ambos, no el del primero.
  it("suma el importe de varias líneas", () => {
    renderCarrito({
      carrito: [
        { id: "A", nombre: "Consulta", precio: 10000, cantidad: 1 },
        { id: "B", nombre: "Taller", precio: 15000, cantidad: 1 },
      ],
    });
    expect(screen.getByText(/Total:.*25\.000/)).toBeInTheDocument();
  });
});
