import { crearCliente, leerUrlBase } from "./clienteHttp";

// El catálogo de prestaciones lo entrega el microservicio de citas.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Cualquier sesión válida puede leer el catálogo; admite filtrar por tipo y
// pedir solo los servicios activos.
export function listar(token, { soloActivos, tipo } = {}) {
  return cliente.solicitar("/servicios", { token, params: { soloActivos, tipo } });
}

export function obtener(token, id) {
  return cliente.solicitar(`/servicios/${id}`, { token });
}

// Las tres operaciones de escritura las autoriza el backend solo para ADMIN.
export function crear(token, servicio) {
  return cliente.solicitar("/servicios", { metodo: "POST", token, cuerpo: servicio });
}

export function actualizar(token, id, servicio) {
  return cliente.solicitar(`/servicios/${id}`, { metodo: "PUT", token, cuerpo: servicio });
}

export function eliminar(token, id) {
  return cliente.solicitar(`/servicios/${id}`, { metodo: "DELETE", token });
}
