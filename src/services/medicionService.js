import { crearCliente, leerUrlBase } from "./clienteHttp";

// Las mediciones corporales forman la ficha clínica y las sirve el
// microservicio de citas.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Historial del paciente que tiene la sesión abierta.
export function listarMias(token) {
  return cliente.solicitar("/mediciones/mias", { token });
}

// Mediciones que registró el nutricionista de la sesión.
export function listarRegistradas(token) {
  return cliente.solicitar("/mediciones/registradas", { token });
}

// Ficha de un paciente concreto; el nutricionista solo ve lo que él registró.
export function listarPorPaciente(token, correo) {
  return cliente.solicitar(`/mediciones/paciente/${encodeURIComponent(correo)}`, { token });
}

// El IMC lo calcula el backend, por eso no lo envío ni lo recalculo aquí.
export function crear(token, medicion) {
  return cliente.solicitar("/mediciones", { metodo: "POST", token, cuerpo: medicion });
}

export function actualizar(token, id, medicion) {
  return cliente.solicitar(`/mediciones/${id}`, { metodo: "PUT", token, cuerpo: medicion });
}

export function eliminar(token, id) {
  return cliente.solicitar(`/mediciones/${id}`, { metodo: "DELETE", token });
}
