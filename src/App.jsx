import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navegacion from "./components/Navegacion";
import PiePagina from "./components/PiePagina";
import RutaProtegida from "./components/RutaProtegida";
import { ProveedorSesion } from "./context/SesionContext";
import { useCatalogoServicios } from "./hooks/useCatalogoServicios";
import { productosIniciales } from "./data/productos";
import Acceso from "./pages/Acceso";
import Administracion from "./pages/Administracion";
import Agenda from "./pages/Agenda";
import Carrito from "./pages/Carrito";
import Contacto from "./pages/Contacto";
import DetalleProducto from "./pages/DetalleProducto";
import FichaClinica from "./pages/FichaClinica";
import Inicio from "./pages/Inicio";
import MiProgreso from "./pages/MiProgreso";
import MisCitas from "./pages/MisCitas";
import NoEncontrada from "./pages/NoEncontrada";
import Productos from "./pages/Productos";
import Reserva from "./pages/Reserva";
import Servicios from "./pages/Servicios";
import { guardarJSON, leerJSON } from "./utils/persistencia";

function cargarProductos() {
  const guardados = leerJSON("nutrivida-productos", null);
  return Array.isArray(guardados) ? guardados : productosIniciales;
}

function cargarCarrito() {
  const guardados = leerJSON("carrito", []);
  if (!Array.isArray(guardados)) return [];

  return guardados
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.id &&
        Number.isFinite(Number(item.precio)) &&
        Number(item.precio) >= 0,
    )
    .map((item) => ({
      ...item,
      precio: Number(item.precio),
      cantidad: Math.max(1, Number(item.cantidad) || 1),
    }));
}

function Aplicacion() {
  // Catálogo local de respaldo: lo conservo porque la tienda y el carrito deben
  // seguir funcionando antes de iniciar sesión.
  const [productosLocales, setProductosLocales] = useState(cargarProductos);
  const [carrito, setCarrito] = useState(cargarCarrito);
  // Con sesión abierta el catálogo se alimenta de GET /servicios?soloActivos=true.
  const catalogo = useCatalogoServicios(productosLocales);

  useEffect(() => {
    guardarJSON("nutrivida-productos", productosLocales);
  }, [productosLocales]);

  useEffect(() => {
    guardarJSON("carrito", carrito);
  }, [carrito]);

  function agregarAlCarrito(producto) {
    setCarrito((actual) => {
      const existente = actual.find((item) => item.id === producto.id);
      if (existente) {
        return actual.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }

      return [...actual, { ...producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, delta) {
    setCarrito((actual) =>
      actual.flatMap((item) => {
        if (item.id !== id) return [item];
        const cantidad = item.cantidad + delta;
        return cantidad < 1 ? [] : [{ ...item, cantidad }];
      }),
    );
  }

  function eliminarDelCarrito(id) {
    setCarrito((actual) => actual.filter((item) => item.id !== id));
  }

  function vaciarCarrito() {
    setCarrito([]);
  }

  function crearProducto(producto) {
    setProductosLocales((actual) => [...actual, producto]);
  }

  function eliminarProducto(id) {
    setProductosLocales((actual) => actual.filter((producto) => producto.id !== id));
    setCarrito((actual) => actual.filter((item) => item.id !== id));
  }

  const cantidadCarrito = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  return (
    <>
      <Navegacion cantidadCarrito={cantidadCarrito} />
      <Routes>
        {/* Rutas abiertas a cualquier visitante. */}
        <Route path="/" element={<Inicio />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route
          path="/productos"
          element={
            <Productos
              productos={catalogo.productos}
              onAgregar={agregarAlCarrito}
              cargando={catalogo.cargando}
              error={catalogo.error}
              desdeApi={catalogo.desdeApi}
              onReintentar={catalogo.recargar}
            />
          }
        />
        <Route
          path="/productos/:id"
          element={
            <DetalleProducto
              productos={catalogo.productos}
              onAgregar={agregarAlCarrito}
              cargando={catalogo.cargando}
              error={catalogo.error}
              onReintentar={catalogo.recargar}
            />
          }
        />
        <Route
          path="/carrito"
          element={
            <Carrito
              carrito={carrito}
              onCambiarCantidad={cambiarCantidad}
              onEliminar={eliminarDelCarrito}
              onVaciar={vaciarCarrito}
            />
          }
        />
        <Route path="/reserva" element={<Reserva productos={catalogo.productos} />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Acceso />} />
        <Route path="/registro" element={<Acceso modo="registro" />} />

        {/* Rutas del paciente: también las puede ver el administrador. */}
        <Route element={<RutaProtegida roles={["PACIENTE", "ADMIN"]} />}>
          <Route path="/mis-citas" element={<MisCitas />} />
          <Route path="/mi-progreso" element={<MiProgreso />} />
        </Route>

        {/* Rutas del profesional. */}
        <Route element={<RutaProtegida roles={["NUTRICIONISTA", "ADMIN"]} />}>
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/ficha-clinica" element={<FichaClinica />} />
        </Route>

        {/* Panel reservado al administrador. */}
        <Route element={<RutaProtegida roles={["ADMIN"]} />}>
          <Route
            path="/admin/*"
            element={
              <Administracion
                productos={productosLocales}
                onCrearProducto={crearProducto}
                onEliminarProducto={eliminarProducto}
              />
            }
          />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      <PiePagina />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* El proveedor de sesión envuelve toda la aplicación para que la
          navegación, las rutas protegidas y las vistas compartan el token. */}
      <ProveedorSesion>
        <Aplicacion />
      </ProveedorSesion>
    </BrowserRouter>
  );
}
