import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TarjetaProducto from "../components/TarjetaProducto";
import Productos from "../pages/Productos";
import { formatearPrecio } from "../utils/precio";

// Dos servicios de mentira, suficientes para probar el catálogo: uno con imagen y otro sin
// ella, y de categorías distintas, que es lo que necesito para el filtro y la búsqueda.
const productos = [
  { id: "EV002", nombre: "Bioimpedanciometría", categoria: "Evaluación", descripcion: "Evaluación corporal.", precio: 12000, imagen: "/bio.jpg" },
  { id: "TG001", nombre: "Taller de alimentación saludable", categoria: "Taller", descripcion: "Taller de hábitos.", precio: 15000, imagen: null },
];

// Envuelvo el catálogo en MemoryRouter porque las tarjetas llevan enlaces al detalle, y un
// enlace fuera de un router hace fallar el render. Esta función me evita repetirlo en cada caso.
function renderCatalogo(props = {}) {
  return render(
    <MemoryRouter>
      <Productos productos={productos} onAgregar={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

// Pruebas del catálogo: primero la tarjeta sola y después la página completa con sus filtros.
describe("Integrante 1 · catálogo y componentes", () => {
  // La tarjeta tiene que pintar lo que recibe, sin inventar nada por su cuenta.
  it("muestra nombre y categoría desde las props", () => {
    render(<MemoryRouter><TarjetaProducto producto={productos[0]} onAgregar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
    expect(screen.getByText("Evaluación")).toBeInTheDocument();
  });

  // El precio no se muestra crudo: pasa por el formateador y sale con separador de miles.
  it("muestra el precio formateado", () => {
    render(<MemoryRouter><TarjetaProducto producto={productos[0]} onAgregar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/12\.000/)).toBeInTheDocument();
  });

  // Busco la imagen por su texto alternativo, no por su archivo. Si el alt estuviera vacío,
  // esta prueba falla, y de paso me asegura que un lector de pantalla pueda describirla.
  it("da a la imagen un texto alternativo descriptivo", () => {
    render(<MemoryRouter><TarjetaProducto producto={productos[0]} onAgregar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("img", { name: "Imagen de Bioimpedanciometría" })).toBeInTheDocument();
  });

  // Compruebo que el botón avise con el producto correcto: con dos tarjetas en pantalla es
  // fácil que el componente entregue siempre el primero.
  it("llama al callback con el producto correcto", async () => {
    const user = userEvent.setup();
    const onAgregar = vi.fn();
    render(<MemoryRouter><TarjetaProducto producto={productos[0]} onAgregar={onAgregar} /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Agregar Bioimpedanciometría al carrito" }));
    expect(onAgregar).toHaveBeenCalledWith(productos[0]);
  });

  // El enlace tiene que armarse con el código del servicio, no con su posición en la lista.
  it("enlaza al detalle usando el código del producto", () => {
    render(<MemoryRouter><TarjetaProducto producto={productos[0]} onAgregar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/productos/EV002");
  });

  // De aquí en adelante pruebo la página entera, no la tarjeta suelta.
  it("genera las tarjetas desde todos los objetos recibidos", () => {
    renderCatalogo();
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Taller de alimentación saludable" })).toBeInTheDocument();
  });

  // El filtro no basta con que muestre lo buscado: tiene que esconder lo demás. Por eso la
  // segunda comprobación, que es la que de verdad prueba que filtra.
  it("filtra los productos por categoría", async () => {
    const user = userEvent.setup();
    renderCatalogo();
    await user.selectOptions(screen.getByLabelText("Filtrar por categoría"), "Taller");
    expect(screen.getByRole("heading", { name: "Taller de alimentación saludable" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bioimpedanciometría" })).not.toBeInTheDocument();
  });

  // Escribo el nombre en minúsculas y con tilde: la búsqueda tiene que encontrarlo igual.
  it("busca por nombre del servicio", async () => {
    const user = userEvent.setup();
    renderCatalogo();
    await user.type(screen.getByLabelText("Buscar servicios"), "bioimpedanciometría");
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Taller de alimentación saludable" })).not.toBeInTheDocument();
  });

  // Cuando no hay resultados no dejo la pantalla vacía: muestro un aviso, y lo busco por su
  // rol de estado para que un lector de pantalla también lo anuncie.
  it("muestra un aviso si no hay coincidencias", async () => {
    const user = userEvent.setup();
    renderCatalogo();
    await user.type(screen.getByLabelText("Buscar servicios"), "servicio inexistente");
    expect(screen.getByRole("status")).toHaveTextContent("No encontramos servicios");
  });

  // Los dos casos del precio que el catálogo no puede mostrar como un número cualquiera.
  it("trata precios gratis e inválidos de forma explícita", () => {
    expect(formatearPrecio(0)).toBe("Gratis");
    expect(formatearPrecio(-1)).toBe("Precio no disponible");
  });
});
