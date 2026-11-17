import { crearCliente, leerUrlBase } from "./clienteHttp";

// La ficha de los profesionales también pertenece al microservicio de citas.
const cliente = crearCliente(
  leerUrlBase("VITE_CITAS_API_URL", "http://localhost:8082/api/v1"),
);

// Para la agenda me interesan únicamente los profesionales activos, así que el filtro viaja como
// parámetro en la URL y lo aplica el backend: traer el directorio completo y descartarlo acá
// significaría enviar por la red datos que no voy a mostrar.
// Dejo soloActivos como objeto con valor por omisión para poder llamar a listar(token) sin
// argumentos cuando sí quiero el directorio entero, como en el mantenedor del panel.
export function listar(token, { soloActivos } = {}) {
  return cliente.solicitar("/nutricionistas", { token, params: { soloActivos } });
}

// Cada función recibe el token y lo pasa al cliente, en lugar de que el cliente lo saque solo de
// sessionStorage: así estos servicios no dependen de dónde esté guardada la sesión y las pruebas
// pueden llamarlos con un token inventado.
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
