// Generador del Manual de Usuario de la Clínica NutriVida.
//
// Lo escribo como script y no a mano en Word por dos razones: puedo volver a generar el
// documento completo si cambia una captura, y controlo las propiedades del archivo, que es
// donde queda registrado quién lo creó.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
} = require("docx");

const REPO = "C:/DuocTrabajos/ClinicaNutriVidaEP2";
const IMG = path.join(REPO, "documentacion/manual/imagenes");
const SALIDA = path.join(REPO, "documentacion/Manual_de_Usuario_NutriVida_EP3.docx");

// Ancho útil de la página: carta (12240) menos los dos márgenes de 1 pulgada (1440 cada uno).
const ANCHO_UTIL = 9360;
const BORDE_NEGRO = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const BORDES = { top: BORDE_NEGRO, bottom: BORDE_NEGRO, left: BORDE_NEGRO, right: BORDE_NEGRO };

let numeroImagen = 0;

// Cada imagen va con su número, su título, la imagen con borde negro de 1 px y una nota
// debajo, que es el formato que pide la plantilla de la evaluación.
function figura(archivo, titulo, nota) {
  numeroImagen += 1;
  const datos = fs.readFileSync(path.join(IMG, archivo));

  return [
    new Paragraph({
      spacing: { before: 240, after: 80 },
      keepNext: true,
      children: [
        new TextRun({ text: `Imagen ${numeroImagen}. `, bold: true, size: 20 }),
        new TextRun({ text: titulo, size: 20 }),
      ],
    }),
    // Pongo la imagen dentro de una tabla de una sola celda para que el borde se vea igual
    // en Word y en cualquier visor, que es más fiable que el contorno de la propia imagen.
    new Table({
      columnWidths: [ANCHO_UTIL],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: ANCHO_UTIL, type: WidthType.DXA },
              borders: BORDES,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 0 },
                  children: [
                    new ImageRun({
                      type: "jpg",
                      data: datos,
                      transformation: { width: 600, height: 403 },
                      altText: { title: titulo, description: nota, name: titulo },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 80, after: 240 },
      children: [
        new TextRun({ text: "Nota: ", bold: true, size: 18, italics: true }),
        new TextRun({ text: nota, size: 18, italics: true }),
      ],
    }),
  ];
}

// Atajos para no repetir la construcción de párrafos y títulos.
const p = (texto) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: texto, size: 22 })] });
const h1 = (texto) => new Paragraph({ text: texto, heading: HeadingLevel.HEADING_1 });
const h2 = (texto) => new Paragraph({ text: texto, heading: HeadingLevel.HEADING_2 });
const h3 = (texto) => new Paragraph({ text: texto, heading: HeadingLevel.HEADING_3 });

// Viñetas: uso la numeración declarada más abajo en vez de escribir el punto a mano.
const vineta = (texto) =>
  new Paragraph({ numbering: { reference: "vinetas", level: 0 }, spacing: { after: 60 },
    children: [new TextRun({ text: texto, size: 22 })] });

const paso = (texto) =>
  new Paragraph({ numbering: { reference: "pasos", level: 0 }, spacing: { after: 60 },
    children: [new TextRun({ text: texto, size: 22 })] });

// Construyo una tabla de datos con encabezado sombreado.
function tabla(encabezados, filas) {
  const anchos = encabezados.map(() => Math.floor(ANCHO_UTIL / encabezados.length));
  const celda = (texto, negrita, sombra) =>
    new TableCell({
      width: { size: anchos[0], type: WidthType.DXA },
      borders: BORDES,
      shading: sombra ? { type: ShadingType.CLEAR, fill: "E8F3EC" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: texto, bold: negrita, size: 20 })] })],
    });

  return new Table({
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((t) => celda(t, true, true)) }),
      ...filas.map((fila) => new TableRow({ children: fila.map((t) => celda(t, false, false)) })),
    ],
  });
}

const contenido = [
  // ---------------------------------------------------------------- Portada
  new Paragraph({ spacing: { before: 2400, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Manual de Usuario", bold: true, size: 56, font: "Calibri" })] }),
  new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Clínica Nutricional NutriVida", size: 36, color: "1F6B45" })] }),
  new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Versión del documento: 1.0", size: 22 })] }),
  new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "DSY1104 · Desarrollo FullStack II · Evaluación Parcial 3", size: 22 })] }),
  new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Caso Forma D · Clínica Nutricional NutriVida", size: 22 })] }),
  new Paragraph({ children: [new PageBreak()] }),

  // ---------------------------------------------------------- 1. Introducción
  h1("1. Introducción"),

  h2("1.1 Propósito del documento"),
  p("Este manual explica cómo usar el sistema web de la Clínica Nutricional NutriVida. Está " +
    "dirigido a las tres personas que trabajan con él a diario: el paciente que pide sus horas y " +
    "revisa su progreso, el nutricionista que atiende y registra las mediciones, y el " +
    "administrador que gestiona las cuentas y el catálogo de servicios."),
  p("No hace falta tener conocimientos técnicos para seguirlo. Cada función se explica primero " +
    "con palabras y después se muestra con una imagen de la pantalla real del sistema."),

  h2("1.2 Descripción del sistema"),
  p("NutriVida es una clínica de nutrición de Temuco que hasta ahora llevaba su agenda en papel " +
    "y las fichas de los pacientes escritas a mano en un archivador. Eso provocaba tres " +
    "problemas: un 20 % de inasistencia porque nadie recordaba las horas, fichas difíciles de " +
    "compartir cuando un paciente cambiaba de profesional, y pacientes que no podían ver su " +
    "progreso entre sesiones."),
  p("El sistema resuelve esos tres puntos. Permite pedir, reprogramar y cancelar horas desde " +
    "cualquier dispositivo; guarda las mediciones y el plan alimenticio en forma digital; y deja " +
    "que el paciente consulte su historial cuando quiera."),
  p("Por dentro está construido con una aplicación web hecha en React y dos servicios " +
    "independientes que guardan la información en una base de datos. Uno se encarga de las " +
    "cuentas y de comprobar quién es cada persona; el otro, de las citas, el catálogo de " +
    "servicios y las fichas clínicas."),

  h2("1.3 Cómo usar este manual"),
  p("Si es la primera vez que entras, lee los capítulos 2, 3 y 4 en orden: cubren lo que " +
    "necesitas, cómo poner el sistema en marcha y cómo iniciar sesión."),
  p("Si ya sabes entrar y solo quieres aprender una función concreta, ve directo al capítulo 5 y " +
    "busca la sección de tu perfil. Cada perfil tiene las suyas y no se mezclan."),
  vineta("Paciente: sección 5.4"),
  vineta("Nutricionista: sección 5.5"),
  vineta("Administrador: sección 5.6"),
  p("Las imágenes están numeradas y llevan una nota debajo que explica qué hay que mirar en cada " +
    "una."),

  // ----------------------------------------------------- 2. Requisitos
  new Paragraph({ children: [new PageBreak()] }),
  h1("2. Requisitos del sistema"),

  h2("2.1 Hardware necesario"),
  p("Para usar el sistema como paciente, nutricionista o administrador basta con cualquier " +
    "equipo capaz de abrir un navegador web moderno: un computador, una tableta o un teléfono. " +
    "La interfaz se adapta a los tres tamaños, desde pantallas de 360 píxeles de ancho hasta " +
    "monitores de escritorio."),
  p("Para ejecutar el sistema completo, es decir, alojar los servicios y la base de datos, el " +
    "equipo necesita al menos 4 GB de memoria y 2 GB libres en disco."),

  h2("2.2 Software necesario"),
  p("Quien solo va a usar el sistema necesita únicamente un navegador actualizado: Chrome, Edge, " +
    "Firefox o Safari. No hay que instalar nada más."),
  p("Quien va a ejecutar el sistema necesita además:"),
  tabla(
    ["Programa", "Versión", "Para qué se usa"],
    [
      ["Java (JDK)", "21", "Ejecutar los dos servicios"],
      ["MySQL", "8", "Guardar la información"],
      ["Node.js", "20 o superior", "Compilar y publicar la aplicación web"],
    ],
  ),

  // ------------------------------------------- 3. Instalación y configuración
  new Paragraph({ children: [new PageBreak()] }),
  h1("3. Instalación y configuración"),

  h2("3.1 Puesta en marcha"),
  p("El sistema se levanta con un solo archivo. En la carpeta del proyecto hay un archivo " +
    "llamado arrancar-demostracion.bat que hace todo el trabajo en orden:"),
  paso("Enciende la base de datos."),
  paso("Enciende el servicio de cuentas y el servicio de citas."),
  paso("Espera a que los dos respondan, para que la página no se abra antes de tiempo."),
  paso("Publica la aplicación web."),
  paso("Muestra en pantalla las direcciones para abrirla."),
  p("Basta con hacer doble clic sobre él. Si alguna parte ya estaba encendida, la detecta y no la " +
    "vuelve a arrancar."),

  h2("3.2 Configuración inicial"),
  p("No hay que configurar nada para empezar. La primera vez que el sistema arranca crea solo:"),
  vineta("Las tablas de la base de datos."),
  vineta("El catálogo completo de la clínica, con sus 18 servicios entre consultas, planes, evaluaciones y talleres."),
  vineta("El directorio de los cuatro nutricionistas con sus especialidades y horarios."),
  vineta("Las cuentas de los tres perfiles para poder entrar y probar."),
  p("Las contraseñas de esas cuentas iniciales deben cambiarse antes de usar el sistema con " +
    "pacientes reales."),

  // ----------------------------------------------------- 4. Comenzando
  new Paragraph({ children: [new PageBreak()] }),
  h1("4. Comenzando"),

  h2("4.1 La pantalla de inicio"),
  p("Al abrir la dirección del sistema aparece la página principal. Desde aquí cualquier persona, " +
    "aunque no tenga cuenta, puede conocer la clínica, revisar los servicios y encontrar la " +
    "dirección de la consulta."),
  ...figura("01-inicio.jpg", "Página principal del sistema",
    "En la barra superior están los accesos a cada sección. A la derecha aparece el enlace para " +
    "iniciar sesión, que es por donde se entra a las funciones privadas."),

  h2("4.2 Crear una cuenta"),
  p("Si todavía no tienes cuenta, en la pantalla de acceso hay un enlace que dice Registrarse. " +
    "Te pedirá tu nombre, tu correo y una contraseña. Las cuentas creadas por esa vía quedan " +
    "siempre con el perfil de paciente: los perfiles de nutricionista y administrador solo los " +
    "puede asignar el administrador desde su panel."),

  h2("4.3 Iniciar sesión"),
  p("Para entrar se usa el correo y la contraseña. El sistema reconoce automáticamente el perfil " +
    "de cada persona y la lleva a la pantalla que le corresponde."),
  ...figura("02-iniciar-sesion.jpg", "Pantalla de inicio de sesión",
    "Si el correo o la contraseña no son correctos, el sistema lo avisa con un mensaje y no " +
    "revela cuál de los dos falló. Eso evita que alguien pueda averiguar qué correos están " +
    "registrados."),

  h2("4.4 Los tres perfiles"),
  p("Lo que cada persona puede hacer depende de su perfil. El sistema no muestra las opciones " +
    "que no corresponden, y además comprueba los permisos en el servidor cada vez que se pide un " +
    "dato."),
  tabla(
    ["Perfil", "Qué puede hacer"],
    [
      ["Paciente", "Pedir, reprogramar y cancelar sus horas. Ver su historial de mediciones y su plan alimenticio."],
      ["Nutricionista", "Ver su agenda, confirmar horas y registrar las mediciones de sus pacientes."],
      ["Administrador", "Gestionar cuentas y perfiles, administrar el catálogo y revisar los indicadores de la clínica."],
    ],
  ),

  // ----------------------------------------------------- 5. Uso del software
  new Paragraph({ children: [new PageBreak()] }),
  h1("5. Uso del software"),

  h2("5.1 Navegación"),
  p("La barra superior acompaña siempre y cambia según quién esté dentro. Un paciente ve los " +
    "accesos a sus citas y a su progreso; un nutricionista, los de su agenda y la ficha clínica; " +
    "y el administrador, el panel de gestión. A la derecha aparecen el nombre y el perfil de la " +
    "persona, junto al botón para cerrar sesión."),
  p("En pantallas pequeñas la barra se reemplaza por un botón de menú que despliega las mismas " +
    "opciones."),

  h2("5.2 Catálogo de servicios"),
  p("La sección Tienda muestra los servicios de la clínica. Se pueden buscar por nombre y filtrar " +
    "por categoría, y cada tarjeta lleva a una página de detalle."),
  ...figura("04-catalogo-sin-sesion.jpg", "Catálogo de servicios",
    "Sin iniciar sesión se muestra un catálogo de referencia. Al entrar con una cuenta, el " +
    "sistema reemplaza esa lista por la oferta vigente que tiene registrada la clínica."),

  h2("5.3 Contacto y ubicación"),
  p("La sección Contacto tiene un formulario para escribir a la clínica y un mapa interactivo con " +
    "la ubicación de la consulta, que se puede acercar y mover para orientarse."),
  ...figura("03-contacto-mapa.jpg", "Formulario de contacto y mapa de la clínica",
    "El mapa marca la consulta en Temuco. Permite acercar, alejar y desplazarse, igual que " +
    "cualquier mapa en línea."),

  h2("5.4 Funciones del paciente"),

  h3("Pedir una hora"),
  p("En la sección Agendar cita se elige el profesional y el servicio, se indica la fecha y la " +
    "hora, y se escribe el motivo de la consulta. El nombre y el correo vienen rellenados con los " +
    "datos de la sesión."),
  ...figura("08-paciente-agendar.jpg", "Formulario para pedir una hora",
    "Las listas de profesionales y de servicios se cargan desde el sistema, así que siempre " +
    "muestran la oferta vigente. La clínica atiende entre las 09:00 y las 18:00."),
  p("Si el horario elegido ya está tomado con ese profesional, el sistema lo avisa indicando con " +
    "quién está ocupado, y la hora no se reserva."),

  h3("Revisar mis citas"),
  p("La sección Mis citas muestra todas las horas con su estado. Desde ahí se puede reprogramar " +
    "o cancelar."),
  ...figura("09-paciente-mis-citas.jpg", "Listado de citas del paciente",
    "Cada estado tiene su color. Una cita ya atendida aparece sin acciones disponibles, porque " +
    "es parte del historial y no se puede modificar."),
  p("Los estados por los que pasa una hora son:"),
  tabla(
    ["Estado", "Qué significa"],
    [
      ["Solicitada", "La pediste y la clínica todavía no la revisa."],
      ["Confirmada", "La clínica aceptó el horario."],
      ["Atendida", "La consulta ya ocurrió."],
      ["Cancelada", "Se dio de baja antes de ocurrir."],
      ["No asistió", "No llegaste a la hora reservada."],
    ],
  ),

  h3("Ver mi progreso"),
  p("La sección Mi progreso reúne todas las mediciones que los profesionales han registrado, con " +
    "el índice de masa corporal calculado y el plan alimenticio indicado en cada control. Es la " +
    "información que antes se entregaba en una hoja impresa que era fácil de perder."),
  ...figura("10-paciente-mi-progreso.jpg", "Historial de mediciones del paciente",
    "Arriba se resumen el último peso, el índice de masa corporal actual con su clasificación, y " +
    "la variación desde el primer control. Abajo está el detalle de cada medición."),

  h2("5.5 Funciones del nutricionista"),

  h3("La agenda"),
  p("Al iniciar sesión, el profesional llega directamente a su agenda, donde ve únicamente las " +
    "horas que tiene asignadas. Desde ahí confirma las solicitudes y registra lo que ocurrió con " +
    "cada consulta."),
  ...figura("12-nutricionista-agenda.jpg", "Agenda del nutricionista",
    "Las citas de otros profesionales no aparecen aquí. Los botones disponibles cambian según el " +
    "estado: una hora ya cerrada no ofrece acciones."),

  h3("La ficha clínica"),
  p("En la sección Ficha clínica se busca al paciente por su correo y se registran las mediciones " +
    "de la sesión: peso, talla y, si corresponde, circunferencia de cintura, además de las " +
    "observaciones y el plan alimenticio indicado."),
  ...figura("13-nutricionista-ficha.jpg", "Ficha clínica de un paciente",
    "El índice de masa corporal lo calcula el sistema a partir del peso y la talla. Cada " +
    "profesional ve solamente las mediciones que registró él, aunque el paciente tenga otras de " +
    "otro nutricionista."),
  p("Esa última regla es importante y es una exigencia del caso: los datos clínicos son " +
    "información sensible, y solo el paciente y el profesional que lo atendió pueden verlos."),

  h2("5.6 Funciones del administrador"),

  h3("Gestión de cuentas"),
  p("El panel de administración permite crear cuentas, editarlas, cambiarles el perfil, " +
    "desactivarlas y eliminarlas. Desactivar una cuenta impide que esa persona entre, pero " +
    "conserva su información."),
  ...figura("05-admin-usuarios.jpg", "Gestión de cuentas de usuario",
    "La lista se puede filtrar por perfil. Al editar una cuenta, si se deja la contraseña en " +
    "blanco se conserva la que ya tenía."),

  h3("Catálogo de servicios"),
  p("Desde la pestaña del catálogo se agregan, editan y eliminan servicios. Cada uno tiene un " +
    "código que no se puede repetir, un tipo, una duración, una modalidad y un precio."),
  ...figura("06-admin-catalogo.jpg", "Administración del catálogo de servicios",
    "Un servicio marcado como inactivo deja de ofrecerse al pedir una hora, pero no se borra, " +
    "así que las citas antiguas conservan su información."),

  h3("Indicadores de la clínica"),
  p("La pestaña de estadísticas responde a una necesidad concreta del caso: antes no había forma " +
    "de obtener cifras sin revisar las agendas de papel página por página."),
  ...figura("07-admin-estadisticas.jpg", "Indicadores de atención de la clínica",
    "Muestra el total de citas, la tasa de inasistencia, las citas confirmadas a la espera de " +
    "atención, la distribución por estado y cuántas atenciones acumula cada profesional."),

  h2("5.7 Restricciones de acceso"),
  p("El sistema no se limita a ocultar las opciones que no corresponden. Si alguien escribe " +
    "directamente la dirección de una sección a la que no tiene acceso, recibe un aviso y no " +
    "puede entrar."),
  ...figura("11-sin-permiso.jpg", "Aviso al intentar entrar a una sección restringida",
    "La imagen muestra lo que ve un paciente al intentar abrir el panel de administración. " +
    "Además de este aviso, el servidor rechaza cualquier petición de datos que no corresponda al " +
    "perfil de quien la hace."),

  // --------------------------------------------- 6. Documentación técnica
  new Paragraph({ children: [new PageBreak()] }),
  h1("6. Documentación técnica de los servicios"),
  p("Esta sección es para quien necesite revisar el sistema por dentro. No hace falta leerla para " +
    "usarlo."),
  p("Los dos servicios publican su documentación en una página interactiva donde se puede ver " +
    "cada operación disponible y probarla directamente."),
  ...figura("14-swagger-auth.jpg", "Documentación del servicio de cuentas",
    "Se abre en la dirección http://localhost:8081/swagger-ui/index.html. Reúne el inicio de " +
    "sesión, el registro, la consulta del perfil, la renovación de la sesión y la gestión de " +
    "cuentas."),
  ...figura("15-swagger-citas.jpg", "Documentación del servicio de citas",
    "Se abre en la dirección http://localhost:8082/swagger-ui/index.html. Reúne el catálogo, el " +
    "directorio de profesionales, las citas, las fichas clínicas y los indicadores."),
  p("Para probar una operación protegida hay que iniciar sesión primero en la documentación del " +
    "servicio de cuentas, copiar el valor que devuelve y pegarlo en el botón Authorize de la otra " +
    "página."),
];

const documento = new Document({
  // Estas son las propiedades que quedan guardadas dentro del archivo.
  creator: "Martín Reyes Guajardo",
  lastModifiedBy: "Martín Reyes Guajardo",
  title: "Manual de Usuario · Clínica Nutricional NutriVida",
  description: "Manual de usuario del sistema web de la Clínica Nutricional NutriVida, " +
    "asignatura DSY1104 Desarrollo FullStack II.",
  subject: "DSY1104 Desarrollo FullStack II · Evaluación Parcial 3",
  keywords: "NutriVida, manual de usuario, DSY1104",

  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      title: { run: { font: "Calibri", size: 56, bold: true },
        paragraph: { spacing: { before: 0, after: 240 }, keepNext: true } },
      heading1: { run: { font: "Calibri", size: 32, bold: true, color: "1F6B45" },
        paragraph: { spacing: { before: 320, after: 160 }, keepNext: true } },
      heading2: { run: { font: "Calibri", size: 26, bold: true, color: "2E7D55" },
        paragraph: { spacing: { before: 260, after: 120 }, keepNext: true } },
      heading3: { run: { font: "Calibri", size: 23, bold: true, color: "333333" },
        paragraph: { spacing: { before: 200, after: 100 }, keepNext: true } },
    },
  },

  // Declaro las listas aquí en vez de escribir los símbolos a mano en el texto.
  numbering: {
    config: [
      { reference: "vinetas", levels: [{ level: 0, format: "bullet", text: "\u2022",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 230 } } } }] },
      { reference: "pasos", levels: [{ level: 0, format: "decimal", text: "%1.",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 230 } } } }] },
    ],
  },

  sections: [{
    properties: {
      // Tamaño carta, que es el que se usa en Chile.
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    children: contenido,
  }],
});

Packer.toBuffer(documento).then((buffer) => {
  fs.writeFileSync(SALIDA, buffer);
  console.log("Documento generado:", SALIDA);
  console.log("Imágenes incluidas:", numeroImagen);
  console.log("Tamaño:", (buffer.length / 1024).toFixed(0), "KB");
});
