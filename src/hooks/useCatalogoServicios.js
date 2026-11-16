import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { listar } from "../services/servicioService";
import { adaptarServicio } from "../data/imagenesServicios";

// Este hook alimenta el catálogo de la tienda con GET /servicios?soloActivos=true.
// El backend exige una sesión válida para leer el catálogo, así que cuando no
// hay token devuelvo el catálogo local de respaldo para que la tienda pública
// y el carrito sigan funcionando igual que antes.
export function useCatalogoServicios(catalogoLocal) {
  const { token, cargando: cargandoSesion } = useSesion();
  const [servicios, setServicios] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    if (!token) {
      setServicios(null);
      setError("");
      return undefined;
    }

    let vigente = true;
    setCargando(true);
    setError("");

    listar(token, { soloActivos: true })
      .then((lista) => {
        if (!vigente) return;
        setServicios(Array.isArray(lista) ? lista.map(adaptarServicio) : []);
      })
      .catch((problema) => {
        if (!vigente) return;
        setError(problema.message);
        setServicios(null);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [token]);

  useEffect(() => {
    if (cargandoSesion) return undefined;
    return cargar();
  }, [cargar, cargandoSesion]);

  return {
    // Cuando hay datos de la API los uso; si no, el catálogo local.
    productos: servicios ?? catalogoLocal,
    desdeApi: servicios !== null,
    cargando: cargando || cargandoSesion,
    error,
    recargar: cargar,
  };
}
