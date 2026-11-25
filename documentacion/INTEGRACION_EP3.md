# Integración del frontend con los microservicios · EP3

Este documento resume cómo la aplicación React se conecta con los dos
microservicios Spring Boot del proyecto y dónde queda la evidencia de los
indicadores de la rúbrica que dependen del frontend.

## Direcciones de las APIs

Las URL base llegan por variables de entorno de Vite:

| Archivo | `VITE_AUTH_API_URL` | `VITE_CITAS_API_URL` |
| --- | --- | --- |
| `.env.development` | `http://localhost:8081/api/v1` | `http://localhost:8082/api/v1` |
| `.env.production` | `/api/auth-service/v1` | `/api/citas-service/v1` |

En producción las rutas son relativas porque Nginx trabaja como proxy inverso
delante de los dos servicios. `.env.example` queda como plantilla.

## Capa de servicios

`src/services/clienteHttp.js` centraliza el `fetch`: arma la URL con sus
parámetros, agrega el encabezado `Authorization: Bearer`, resuelve las
respuestas 204 sin cuerpo y convierte el campo `error` del JSON en el mensaje
que se muestra en pantalla. Sobre ese cliente hay un archivo por recurso:

- `authService.js` → login, registro y perfil (solo conoce la URL de auth).
- `usuarioService.js` → CRUD de cuentas (solo ADMIN en el backend).
- `servicioService.js`, `nutricionistaService.js`, `citaService.js`,
  `medicionService.js` y `estadisticaService.js` → microservicio de citas.

Ningún servicio importa a otro ni conoce la URL del microservicio ajeno.

## IE3.2.2 · Integración REST

- Catálogo de la tienda y detalle: `GET /servicios?soloActivos=true`.
- Reserva: `GET /nutricionistas?soloActivos=true` y `POST /citas`.
- Citas del paciente y agenda profesional: `GET /citas/mias`,
  `PUT /citas/{id}` y `PUT /citas/{id}/estado`.
- Progreso y ficha clínica: `GET /mediciones/mias`,
  `GET /mediciones/paciente/{correo}`, `POST /mediciones`, `PUT /mediciones/{id}` y
  `DELETE /mediciones/{id}`.
- Panel de administración: `GET /usuarios`, CRUD de usuarios y de servicios, y
  `GET /estadisticas`.

Los errores del backend se muestran tal como llegan; por ejemplo, el 409 de
horario ocupado aparece con su propio texto en el formulario de reserva.

## IE3.3.2 · Gestión de sesión

`src/context/SesionContext.jsx` guarda el token y el usuario en
`sessionStorage`. Al montar la aplicación, si hay token, llama a
`GET /auth/perfil` y solo entonces considera la sesión activa; mientras tanto
expone `cargando`, para que una recarga no muestre un parpadeo de
"no autenticado". Si el perfil responde 401 limpia la sesión completa.

### Renovación del token

Antes de que el token venza, el contexto llama a `POST /auth/renovar` y guarda
el token nuevo sin pedir otra vez la contraseña. El plazo se calcula leyendo la
fecha de expiración de la carga útil del propio token (`src/utils/token.js`) y
se programa dos minutos antes, con un mínimo de treinta segundos. Si la
renovación responde 401 (token vencido o cuenta desactivada) la sesión se
cierra; ante un fallo de red se conserva lo que ya había.

## IE3.3.3 · Restricción de acceso por rol

`src/components/RutaProtegida.jsx` agrupa las rutas en `src/App.jsx`:

| Ruta | Roles permitidos |
| --- | --- |
| `/mis-citas`, `/mi-progreso` | PACIENTE y ADMIN |
| `/agenda`, `/ficha-clinica` | NUTRICIONISTA y ADMIN |
| `/admin` | ADMIN |

Sin sesión redirige a `/login`; con sesión y rol insuficiente muestra una vista
de "Sin permiso". La barra de navegación también esconde los enlaces que el rol
no puede usar. Esta restricción mejora la navegación: la seguridad real la
aplica el backend, que valida el token y el rol en cada endpoint.

## Cuentas de prueba

Todas usan la contraseña `Cambiar123!`:

- `admin@nutrivida.cl` · ADMIN
- `carolina.fuentes@nutrivida.cl` y los otros tres profesionales · NUTRICIONISTA
- `paciente@nutrivida.cl` · PACIENTE

## Catálogo sin sesión

El backend exige una sesión válida para leer `GET /servicios`. Para que la
tienda pública y el carrito sigan funcionando antes de iniciar sesión, el
catálogo local de `src/data/productos.js` se mantiene como respaldo y la vista
indica de dónde vienen los datos en cada caso.
