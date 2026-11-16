import bioimpedanciometria from "../../assets/img/bioimpedanciometria.jpg";
import habitosAlimentarios from "../../assets/img/habitos-alimentarios.jpg";
import analisisExamenes from "../../assets/img/analisis-examenes.jpg";
import alimentacionSaludable from "../../assets/img/alimentacion-saludable.jpg";
import cocinaNutritiva from "../../assets/img/cocina-nutritiva.jpg";
import nutricionDeportiva from "../../assets/img/nutricion-deportiva.jpg";

// Conservo las fotografías locales de assets/img y las asocio por el código del
// servicio, porque el backend entrega los datos pero no las imágenes.
const imagenesPorCodigo = {
  EV002: bioimpedanciometria,
  EV003: habitosAlimentarios,
  EV004: analisisExamenes,
  TG001: alimentacionSaludable,
  TG002: cocinaNutritiva,
  TG003: nutricionDeportiva,
};

export function imagenDeServicio(codigo) {
  return imagenesPorCodigo[codigo] ?? null;
}

// Traduzco la forma que entrega la API a la que ya usan las tarjetas y el
// detalle del catálogo, y conservo el identificador numérico porque es el que
// necesita el POST /citas.
export function adaptarServicio(servicio) {
  return {
    id: servicio.codigo,
    servicioId: servicio.id,
    nombre: servicio.nombre,
    categoria: servicio.tipo,
    descripcion: servicio.descripcion,
    precio: servicio.precio,
    imagen: imagenDeServicio(servicio.codigo),
    duracionMinutos: servicio.duracionMinutos,
    modalidad: servicio.modalidad,
    activo: servicio.activo,
  };
}
