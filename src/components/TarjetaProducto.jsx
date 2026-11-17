import { Button, Card, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { formatearPrecio } from "../utils/precio";

// Tarjeta reutilizable del catálogo. No sabe nada del carrito a propósito: recibe el producto y
// la función onAgregar desde arriba, así el mismo componente sirve en el listado y en cualquier
// otra vista, y quien maneja el estado es la página, no la tarjeta.
export default function TarjetaProducto({ producto, onAgregar }) {
  return (
    // h-100 hace que todas las tarjetas de una fila queden del mismo alto aunque las
    // descripciones tengan largos distintos.
    <Card className="nv-card h-100">
      {/* Muestro la imagen solo si el producto trae una: si pintara un src vacío, el navegador
          dibujaría el ícono de imagen rota. */}
      {producto.imagen ? (
        <Card.Img
          variant="top"
          src={producto.imagen}
          alt={`Imagen de ${producto.nombre}`}
          className="nv-product-image"
        />
      ) : null}
      <Card.Body className="p-4 d-flex flex-column">
        <span className="badge text-bg-success align-self-start mb-2">
          {producto.categoria}
        </span>
        {/* Pongo el título como h2 pero con la clase h5: así el tamaño es el que necesito y, al
            mismo tiempo, la jerarquía de encabezados de la página queda correcta bajo el h1. */}
        <Card.Title as="h2" className="h5">{producto.nombre}</Card.Title>
        <Card.Text>{producto.descripcion}</Card.Text>
        {/* Dejo el formato del precio en formatearPrecio y no aquí, para que el monto se vea igual
            en todas las vistas y los casos raros (cero, valor inválido) se decidan en un lugar. */}
        <p className="fw-bold fs-5">{formatearPrecio(producto.precio)}</p>
        {/* mt-auto empuja los botones al fondo de la tarjeta: así quedan todos a la misma altura
            en la fila, sin importar el largo de cada descripción. */}
        <Stack direction="horizontal" gap={2} className="mt-auto flex-wrap">
          {/* Todos los botones de la página dicen "Agregar al carrito", así que sin el aria-label
              quien usa lector de pantalla no sabría de qué producto es cada uno. */}
          <Button
            variant="success"
            onClick={() => onAgregar(producto)}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            Agregar al carrito
          </Button>
          {/* Uso Link y no un botón con navegación manual: Link genera un enlace real, así que se
              puede abrir en otra pestaña y el enrutador cambia de vista sin recargar la página. */}
          <Link
            className="btn btn-outline-success"
            to={`/productos/${producto.id}`}
          >
            Ver detalle
          </Link>
        </Stack>
      </Card.Body>
    </Card>
  );
}
