import { Button, Container, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { formatearPrecio } from "../utils/precio";

// Esta vista solo muestra el carrito: recibe la lista y las tres acciones desde App, que es quien
// guarda el estado. Lo hago así porque el contador del encabezado y esta tabla tienen que mostrar
// siempre lo mismo, y eso solo se garantiza si el carrito vive en un único lugar más arriba.
export default function Carrito({
  carrito,
  onCambiarCantidad,
  onEliminar,
  onVaciar,
}) {
  // Calculo el total al renderizar en vez de guardarlo: así no existe la posibilidad de que el
  // monto mostrado quede desfasado respecto de las cantidades que están en la tabla.
  const total = carrito.reduce(
    (suma, item) => suma + Number(item.precio) * item.cantidad,
    0,
  );

  return (
    <Container as="main" className="nv-section">
      <p className="nv-eyebrow">TU SELECCIÓN</p>
      <h1>Tu carrito</h1>
      {/* Con el carrito vacío muestro un mensaje con enlace al catálogo, en lugar de una tabla
          con cero filas: así la pantalla ofrece el siguiente paso en vez de dejar un hueco. */}
      {carrito.length === 0 ? (
        <div className="nv-empty mt-3">
          <p>El carrito está vacío.</p>
          <Link className="btn btn-success" to="/productos">
            Explorar servicios
          </Link>
        </div>
      ) : (
        <>
          {/* table-responsive deja la tabla con scroll horizontal en pantallas angostas, para que
              en el celular no se desborde ni obligue a mover la página entera. */}
          <div className="table-responsive mt-4">
            <Table hover className="align-middle">
              {/* El caption describe la tabla para los lectores de pantalla; lo oculto a la vista
                  con visually-hidden porque en pantalla el título h1 ya cumple ese papel. */}
              <caption className="visually-hidden">Servicios agregados al carrito</caption>
              <thead>
                {/* Pongo scope en cada encabezado para que el lector de pantalla sepa a qué
                    columna pertenece cada celda al recorrer la tabla. */}
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* La key es el id del producto, no el índice: con el índice, al eliminar una fila
                    React reutilizaría el nodo equivocado y la tabla podría mostrar datos mezclados. */}
                {carrito.map((item) => (
                  <tr key={item.id}>
                    {/* El nombre va como th con scope="row" porque es lo que identifica la fila:
                        al leer un subtotal, el lector de pantalla puede decir de qué servicio es. */}
                    <th scope="row">{item.nombre}</th>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{item.cantidad}</td>
                    <td>{formatearPrecio(Number(item.precio) * item.cantidad)}</td>
                    <td>
                      {/* Los botones "−" y "+" no dicen nada fuera de contexto, así que cada uno
                          lleva un aria-label con el nombre del servicio sobre el que actúa. */}
                      <div className="d-flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline-success"
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                          onClick={() => onCambiarCantidad(item.id, -1)}
                        >
                          −
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-success"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                          onClick={() => onCambiarCantidad(item.id, 1)}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          aria-label={`Eliminar ${item.nombre}`}
                          onClick={() => onEliminar(item.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            {/* Uso la clase h4 sobre un párrafo y no una etiqueta h4 real: quiero el tamaño, pero
                el total no es un título de sección y no debería entrar en el índice de encabezados. */}
            <p className="h4 mb-0">Total: {formatearPrecio(total)}</p>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="outline-danger" onClick={onVaciar}>
                Vaciar carrito
              </Button>
              <Link className="btn btn-success" to="/reserva">
                Continuar a reserva
              </Link>
            </div>
          </div>
          {/* Dejo esta advertencia a la vista a propósito: la reserva continúa, pero no hay pasarela
              de pago, y no quiero que alguien crea que entregó datos de una tarjeta. */}
          <p className="text-secondary small mt-3">
            Demostración académica: el carrito es local y no procesa pagos.
          </p>
        </>
      )}
    </Container>
  );
}
