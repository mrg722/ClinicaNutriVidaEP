import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { obtenerPerfil } from "../services/authService";

// Guardo la sesión en sessionStorage para que sobreviva a una recarga de la
// página pero se cierre al cerrar la pestaña (indicador IE3.3.2).
const CLAVE_TOKEN = "nutrivida_token";
const CLAVE_USUARIO = "nutrivida_usuario";

const SesionContext = createContext(null);

// Leo el almacenamiento con cuidado: si el navegador lo bloquea o el contenido
// está corrupto prefiero empezar sin sesión antes que romper la aplicación.
function leerAlmacenado(clave) {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function leerUsuarioAlmacenado() {
  const texto = leerAlmacenado(CLAVE_USUARIO);
  if (!texto) return null;
  try {
    const datos = JSON.parse(texto);
    return datos && typeof datos === "object" ? datos : null;
  } catch {
    return null;
  }
}

export function ProveedorSesion({ children }) {
  const [token, setToken] = useState(() => leerAlmacenado(CLAVE_TOKEN));
  const [usuario, setUsuario] = useState(leerUsuarioAlmacenado);
  // Arranco en estado de carga solo si hay un token por revalidar; así evito el
  // parpadeo de "no autenticado" justo después de recargar.
  const [cargando, setCargando] = useState(() => Boolean(leerAlmacenado(CLAVE_TOKEN)));

  // Limpio por completo la sesión, tanto en memoria como en el almacenamiento.
  const cerrarSesion = useCallback(() => {
    setToken(null);
    setUsuario(null);
    try {
      sessionStorage.removeItem(CLAVE_TOKEN);
      sessionStorage.removeItem(CLAVE_USUARIO);
    } catch {
      // Si el navegador no permite escribir, la sesión ya quedó limpia en memoria.
    }
  }, []);

  // Al montar la aplicación pregunto por el perfil: recién cuando el backend
  // confirma el token doy la sesión por activa. Si responde 401 la descarto.
  useEffect(() => {
    if (!token) {
      setCargando(false);
      return;
    }

    let vigente = true;
    setCargando(true);

    obtenerPerfil(token)
      .then((perfil) => {
        if (!vigente) return;
        setUsuario(perfil);
        try {
          sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
        } catch {
          // El perfil sigue disponible en memoria aunque no se pueda guardar.
        }
      })
      .catch((error) => {
        if (!vigente) return;
        // Un 401 significa token vencido o alterado: cierro la sesión.
        // Ante un fallo de red conservo lo que ya tenía guardado.
        if (error?.estado === 401) cerrarSesion();
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [token, cerrarSesion]);

  // Guardo token y usuario tras un login correcto.
  const iniciarSesion = useCallback((datosSesion) => {
    const { token: nuevoToken, ...perfil } = datosSesion;
    try {
      sessionStorage.setItem(CLAVE_TOKEN, nuevoToken);
      sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
    } catch {
      // Sin almacenamiento la sesión vive solo mientras no se recargue.
    }
    setUsuario(perfil);
    setToken(nuevoToken);
    setCargando(false);
  }, []);

  const valor = useMemo(() => {
    const rol = usuario?.rol ?? null;
    return {
      token,
      usuario,
      cargando,
      iniciarSesion,
      cerrarSesion,
      // Helper de rol que uso tanto en la navegación como en las rutas.
      tieneRol: (...roles) => roles.flat().includes(rol),
      rol,
      autenticado: Boolean(token && usuario),
    };
  }, [token, usuario, cargando, iniciarSesion, cerrarSesion]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

// Hook de acceso al contexto; aviso en claro si alguien lo usa fuera del proveedor.
export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de ProveedorSesion.");
  }
  return contexto;
}
