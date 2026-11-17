import bioimpedanciometria from "../../assets/img/bioimpedanciometria.jpg";
import habitosAlimentarios from "../../assets/img/habitos-alimentarios.jpg";
import analisisExamenes from "../../assets/img/analisis-examenes.jpg";
import alimentacionSaludable from "../../assets/img/alimentacion-saludable.jpg";
import cocinaNutritiva from "../../assets/img/cocina-nutritiva.jpg";
import nutricionDeportiva from "../../assets/img/nutricion-deportiva.jpg";

// Importo las imágenes en vez de escribir la ruta como texto para que Vite las procese: al
// compilar les pone un nombre con huella digital y las copia al build. Con una ruta escrita a
// mano, la imagen se vería en desarrollo y faltaría en la versión publicada.

// Los códigos, nombres, descripciones y precios se conservan desde
// assets/js/detalle-producto.js, que ya pertenecía al proyecto original. Mantengo los mismos
// códigos a propósito: son los que usa la clínica y los que aparecen en las páginas antiguas,
// así que cambiarlos rompería la continuidad entre las dos entregas.
// Este catálogo es el estado inicial de la tienda; el de los servicios clínicos sí viene del
// backend, porque ese cambia y este no.
export const productosIniciales = [
  {
    id: "EV002",
    nombre: "Bioimpedanciometría",
    categoria: "Evaluación",
    descripcion: "Evaluación de composición corporal.",
    precio: 12000,
    imagen: bioimpedanciometria,
  },
  {
    id: "EV003",
    nombre: "Encuesta de hábitos alimentarios",
    categoria: "Evaluación",
    descripcion: "Análisis de hábitos y patrón alimentario.",
    precio: 10000,
    imagen: habitosAlimentarios,
  },
  {
    id: "EV004",
    nombre: "Análisis de exámenes",
    categoria: "Evaluación",
    descripcion: "Interpretación nutricional de exámenes.",
    precio: 15000,
    imagen: analisisExamenes,
  },
  {
    id: "TG001",
    nombre: "Taller de alimentación saludable",
    categoria: "Taller",
    descripcion: "Taller sobre alimentación equilibrada.",
    precio: 15000,
    imagen: alimentacionSaludable,
  },
  {
    id: "TG002",
    nombre: "Taller de cocina nutritiva",
    categoria: "Taller",
    descripcion: "Preparación de recetas saludables.",
    precio: 20000,
    imagen: cocinaNutritiva,
  },
  {
    id: "TG003",
    nombre: "Taller de nutrición para deportistas",
    categoria: "Taller",
    descripcion: "Alimentación e hidratación para deportistas.",
    precio: 18000,
    imagen: nutricionDeportiva,
  },
];
