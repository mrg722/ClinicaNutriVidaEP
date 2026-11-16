import { crearCliente, leerUrlBase } from "./clienteHttp";

// Todas las operaciones de agenda pasan por el microservicio de citas.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Uso esta ruta en las vistas de usuario: el backend decide qué devolver según
// el rol del token (sus citas al paciente, su agenda al nutricionista y todas
// al administrador), así que no necesito preguntar el rol desde el frontend.
export function listarMias(token) {
  return cliente.solicitar("/citas/mias", { token });
}

// Listado completo reservado al rol ADMIN.
export function listarTodas(token) {
  return cliente.solicitar("/citas", { token });
}

export function obtener(token, id) {
  return cliente.solicitar(`/citas/${id}`, { token });
}

// La reserva la realiza el paciente o el administrador.
export function crear(token, cita) {
  return cliente.solicitar("/citas", { metodo: "POST", token, cuerpo: cita });
}

// Reprogramar vuelve a dejar la cita en estado SOLICITADA.
export function reprogramar(token, id, cita) {
  return cliente.solicitar(`/citas/${id}`, { metodo: "PUT", token, cuerpo: cita });
}

// El paciente solo puede pasar a CANCELADA; el profesional y el administrador
// disponen de todos los estados.
export function cambiarEstado(token, id, estado) {
  return cliente.solicitar(`/citas/${id}/estado`, {
    metodo: "PUT",
    token,
    cuerpo: { estado },
  });
}

export function eliminar(token, id) {
  return cliente.solicitar(`/citas/${id}`, { metodo: "DELETE", token });
}
