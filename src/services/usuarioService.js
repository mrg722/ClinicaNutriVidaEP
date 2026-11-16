import { crearCliente, leerUrlBase } from "./clienteHttp";

// La gestión de usuarios vive en el microservicio de autenticación y el backend
// la restringe al rol ADMIN; aquí solo preparo las llamadas.
const cliente = crearCliente(
  leerUrlBase("VITE_AUTH_API_URL", "http://localhost:8081/api/v1"),
);

// Puedo filtrar por rol para, por ejemplo, listar solo a los nutricionistas.
export function listar(token, rol) {
  return cliente.solicitar("/usuarios", { token, params: { rol } });
}

export function obtener(token, id) {
  return cliente.solicitar(`/usuarios/${id}`, { token });
}

export function crear(token, usuario) {
  return cliente.solicitar("/usuarios", {
    metodo: "POST",
    token,
    cuerpo: usuario,
  });
}

// En la actualización la contraseña puede ir vacía: el backend conserva la anterior.
export function actualizar(token, id, usuario) {
  return cliente.solicitar(`/usuarios/${id}`, {
    metodo: "PUT",
    token,
    cuerpo: usuario,
  });
}

export function eliminar(token, id) {
  return cliente.solicitar(`/usuarios/${id}`, { metodo: "DELETE", token });
}
