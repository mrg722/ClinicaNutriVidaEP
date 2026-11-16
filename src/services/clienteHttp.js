// Centralizo en este archivo todo el trato con fetch para no repetirlo en cada
// servicio: armo la URL, agrego el token, interpreto el cuerpo y convierto los
// errores del backend (que siempre llegan como {"error": "texto"}) en una
// excepción con el mensaje real para mostrarlo en pantalla.

// Uso un error propio para poder leer el código HTTP desde las vistas,
// por ejemplo para distinguir un 409 de horario ocupado de un 401 de sesión.
export class ErrorHttp extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = "ErrorHttp";
    this.estado = estado;
  }
}

// Traduzco los problemas de red o de servidor a un texto entendible en español.
function mensajePorDefecto(estado) {
  if (estado === 401) return "Tu sesión no es válida o ya expiró.";
  if (estado === 403) return "No tienes permisos para realizar esta acción.";
  if (estado === 404) return "No encontramos el recurso solicitado.";
  return "No pudimos completar la operación. Inténtalo nuevamente.";
}

// Agrego los parámetros de consulta solo cuando traen un valor real, así evito
// enviar cadenas vacías que el backend tendría que filtrar.
function construirRuta(ruta, params) {
  if (!params) return ruta;
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      consulta.set(clave, String(valor));
    }
  }
  const texto = consulta.toString();
  return texto ? `${ruta}?${texto}` : ruta;
}

// Cada microservicio crea su propio cliente con su URL base, de modo que un
// servicio nunca necesita conocer la dirección del otro.
export function crearCliente(urlBase) {
  async function solicitar(ruta, opciones = {}) {
    const { metodo = "GET", cuerpo, token, params } = opciones;
    const cabeceras = {};
    if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
    if (token) cabeceras.Authorization = `Bearer ${token}`;

    let respuesta;
    try {
      respuesta = await fetch(`${urlBase}${construirRuta(ruta, params)}`, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      // Si fetch falla no hubo respuesta: casi siempre el servicio está apagado.
      throw new ErrorHttp(
        "No pudimos conectarnos con el servidor. Verifica que los servicios estén en marcha.",
        0,
      );
    }

    // El 204 y cualquier respuesta sin contenido no traen cuerpo que interpretar.
    if (respuesta.status === 204 || respuesta.status === 205) {
      if (!respuesta.ok) throw new ErrorHttp(mensajePorDefecto(respuesta.status), respuesta.status);
      return null;
    }

    const texto = await respuesta.text();
    let datos = null;
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      // Prefiero el mensaje que escribió el backend en el campo "error".
      const mensaje = datos?.error || mensajePorDefecto(respuesta.status);
      throw new ErrorHttp(mensaje, respuesta.status);
    }

    return datos;
  }

  return { solicitar };
}

// Leo las URL desde las variables de entorno de Vite y dejo un valor local de
// respaldo para que la aplicación siga funcionando si el archivo .env falta.
export function leerUrlBase(nombre, respaldo) {
  const valor = import.meta.env?.[nombre];
  return typeof valor === "string" && valor.trim() ? valor.trim() : respaldo;
}
