import { crearCliente, leerUrlBase } from "./clienteHttp";

// Los indicadores de gestión los entrega el microservicio de citas y el backend
// los reserva al rol ADMIN.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Devuelve el total de citas, el detalle por estado, la tasa de inasistencia y
// las atenciones por profesional.
export function obtener(token) {
  return cliente.solicitar("/estadisticas", { token });
}
