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

// Uso la clave "carrito" sin prefijo porque es la misma que escriben los scripts de la primera
// entrega: así la aplicación React recoge lo que la persona había dejado en las páginas HTML.
// Esa compatibilidad obliga a desconfiar de lo guardado, porque pudo quedar con el formato
// antiguo. Por eso descarto las líneas que no tengan id o precio usable, en vez de confiar en
// ellas: un precio que no sea número haría aparecer "NaN" en el total del carrito.
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
    // Normalizo precio y cantidad a número al cargar y no cada vez que calculo el total: si la
    // cantidad quedara como texto, sumarle uno la concatenaría ("1"+1 daría "11"). El mínimo de 1
    // evita que una línea quedada en cero siga ocupando sitio en la tabla.
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
  // El carrito vive aquí arriba y no dentro de la vista del carrito, porque el contador del
  // encabezado y la tabla tienen que mostrar lo mismo: con dos estados separados se
  // desincronizarían. Las vistas lo reciben por props junto con las funciones que lo modifican.
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

        {/* Agrupo las rutas privadas bajo un Route sin path que monta RutaProtegida: así la
            comprobación de rol se escribe una vez por grupo y no se me puede olvidar en una ruta
            nueva. Aun así, esto solo decide qué se muestra; lo que impide de verdad el acceso a
            los datos es el backend, que revisa el rol del token en cada endpoint. */}

        {/* Rutas del paciente: también las puede ver el administrador, porque desde el panel
            necesita revisar las citas sin tener que entrar con otra cuenta. */}
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

        {/* El comodín va al final porque las rutas se evalúan en orden: si estuviera arriba,
            atraparía todas las direcciones y ninguna vista llegaría a montarse. */}
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
