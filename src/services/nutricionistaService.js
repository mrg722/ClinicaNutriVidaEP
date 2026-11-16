import { crearCliente, leerUrlBase } from "./clienteHttp";

// La ficha de los profesionales también pertenece al microservicio de citas.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Para la agenda me interesan únicamente los profesionales activos.
export function listar(token, { soloActivos } = {}) {
  return cliente.solicitar("/nutricionistas", { token, params: { soloActivos } });
}

export function obtener(token, id) {
  return cliente.solicitar(`/nutricionistas/${id}`, { token });
}

export function crear(token, nutricionista) {
  return cliente.solicitar("/nutricionistas", { metodo: "POST", token, cuerpo: nutricionista });
}

export function actualizar(token, id, nutricionista) {
  return cliente.solicitar(`/nutricionistas/${id}`, { metodo: "PUT", token, cuerpo: nutricionista });
}

export function eliminar(token, id) {
  return cliente.solicitar(`/nutricionistas/${id}`, { metodo: "DELETE", token });
}
