import { crearCliente, leerUrlBase } from "./clienteHttp";

// Este servicio solo conoce la dirección del microservicio de autenticación.
const cliente = crearCliente(
  leerUrlBase("VITE_AUTH_API_URL", "http://localhost:8081/api/v1"),
);

// Envío las credenciales y recibo el token junto con el nombre y el rol.
export function iniciarSesion(correo, password) {
  return cliente.solicitar("/auth/login", {
    metodo: "POST",
    cuerpo: { correo, password },
  });
}

// El registro público siempre crea una cuenta con rol PACIENTE en el backend.
export function registrar(nombre, correo, password) {
  return cliente.solicitar("/auth/registro", {
    metodo: "POST",
    cuerpo: { nombre, correo, password },
  });
}

// Uso este endpoint al recargar la página para comprobar que el token guardado
// sigue siendo válido antes de dar la sesión por activa.
export function obtenerPerfil(token) {
  return cliente.solicitar("/auth/perfil", { token });
}
