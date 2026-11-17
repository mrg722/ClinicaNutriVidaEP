// Creación de usuarios del panel de administración de la primera entrega. Tengo las comunas
// escritas en el código porque no había servicio que las entregara; las dejo agrupadas por
// región para poder llenar el segundo select según lo que se elija en el primero y evitar
// combinaciones imposibles, como una comuna del sur dentro de una región del norte.
const comunasPorRegionAdmin =
{
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],     "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"],     "Antofagasta": ["Antofagasta", "Calama", "Mejillones", "Tocopilla"],     "Atacama": ["Copiapó", "Caldera", "Vallenar", "Huasco"],     "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel"],     "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio"],     "Metropolitana de Santiago": ["Santiago", "La Reina", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "Puente Alto", "San Bernardo"],     "O'Higgins": ["Rancagua", "Machalí", "Rengo", "San Fernando"],     "Maule": ["Talca", "Curicó", "Linares", "Molina"],     "Ñuble": ["Chillán", "San Carlos", "Bulnes", "Yungay"],     "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel"],     "La Araucanía": ["Temuco", "Villarrica", "Pucón", "Angol"],     "Los Ríos": ["Valdivia", "La Unión", "Río Bueno", "Panguipulli"],     "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud"],     "Aysén": ["Coyhaique", "Aysén", "Chile Chico", "Cochrane"],     "Magallanes y de la Antártica Chilena": ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"]
}
;
// Comparto esta clave con admin-usuarios.js: los dos archivos leen y escriben la misma lista en
// localStorage, y por eso el listado se actualiza al crear un usuario aquí.
const USUARIOS_KEY_ADMIN = "nutrivida_usuarios";
// Valido el RUN con el dígito verificador y no solo con el formato, porque un RUN bien escrito
// pero inválido entraría igual y después no habría forma de identificar a la persona.
function validarRunAdmin(run)
{
    // Normalizo antes de calcular: la gente escribe el RUN con puntos, con guión o sin nada, y el
    // algoritmo necesita puros dígitos más el verificador.
    const rut = run.replace(/[.\-]/g, "").toUpperCase();
    if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;
    // Este es el módulo 11 del Registro Civil: recorro el número de derecha a izquierda
    // multiplicando por la serie 2,3,4,5,6,7 y volviendo a 2 cuando se pasa.
    let suma = 0;
    let multiplicador = 2;
    for (let i = rut.length - 2;
    i >= 0;
    i--)
    {
        suma += Number(rut[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const resultado = 11 - (suma % 11);
    // Los dos casos de borde del algoritmo: 11 se representa como 0 y 10 como K. Sin estas dos
    // excepciones, todos los RUN terminados en 0 o en K serían rechazados por error.
    const digito = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);
    return digito === rut.at(-1);
}
document.addEventListener("DOMContentLoaded", () =>
{
    const form = document.getElementById("form-usuario");
    if (!form) return;
    const region = document.getElementById("region");
    const comuna = document.getElementById("comuna");
    const fecha = document.getElementById("fecha-nacimiento");
    // Lleno el select de regiones desde el objeto y no a mano en el HTML: así la lista de la
    // página y las comunas disponibles salen de la misma fuente y no se pueden contradecir.
    Object.keys(comunasPorRegionAdmin).forEach((nombreRegion) =>
    {
        const option = document.createElement("option");
        option.value = nombreRegion;
        option.textContent = nombreRegion;
        region.appendChild(option);
    }
    );
    // Al cambiar de región rearmo el select de comunas desde cero. Lo vacío primero para que no
    // quede seleccionada una comuna de la región anterior, que es el error más fácil de cometer
    // en estos dos selects encadenados.
    region.addEventListener("change", () =>
    {
        comuna.innerHTML = '<option value="">Selecciona una comuna</option>';
        (comunasPorRegionAdmin[region.value] || []).forEach((nombreComuna) =>
        {
            const option = document.createElement("option");
            option.value = nombreComuna;
            option.textContent = nombreComuna;
            comuna.appendChild(option);
        }
        );
        // Dejo el select de comunas deshabilitado mientras no haya región elegida: así se ve que
        // el orden es región y después comuna, en vez de ofrecer una lista vacía.
        comuna.disabled = !region.value;
    }
    );
    // Pongo el máximo de la fecha de nacimiento en hoy para que el calendario no deje elegir una
    // fecha futura. Lo calculo en vez de escribirlo fijo, porque un valor fijo se vencería.
    if (fecha) fecha.max = new Date().toISOString().split("T")[0];
    form.addEventListener("submit", (event) =>
    {
        event.preventDefault();
        clearAllFieldErrors(form);
        showFormMessage("mensaje-usuario", "");
        const values = Object.fromEntries(new FormData(form).entries());
        // Normalizo RUN y correo antes de validarlos y de guardarlos, porque más abajo los uso
        // para buscar duplicados: si guardara uno en mayúsculas y otro en minúsculas, la misma
        // persona podría registrarse dos veces sin que la comparación lo note.
        const run = values.run.trim().toUpperCase();
        const correo = values.correo.trim().toLowerCase();
        if (!validarRunAdmin(run)) return setFieldError("run", "Ingresa un RUN chileno válido.");
        if (!validName(values.nombre.trim())) return setFieldError("nombre", "Ingresa un nombre válido.");
        if (!validName(values.apellidos.trim())) return setFieldError("apellidos", "Ingresa apellidos válidos.");
        if (!validEmail(correo)) return setFieldError("correo", "Ingresa un correo válido.");
        if (!values["tipo-usuario"]) return setFieldError("tipo-usuario", "Selecciona un perfil.");
        if (!values.region) return setFieldError("region", "Selecciona una región.");
        if (!values.comuna) return setFieldError("comuna", "Selecciona una comuna.");
        if (values.direccion.trim().length < 5) return setFieldError("direccion", "La dirección debe tener al menos 5 caracteres.");
        // Reutilizo validName y validEmail de form-utils.js para que el panel exija exactamente lo
        // mismo que el registro público, y no queden dos reglas distintas para el mismo dato.
        let usuarios = [];
        try
        {
            usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY_ADMIN)) || [];
            // Compruebo que sea un arreglo además de atrapar el error de parseo: un JSON válido
            // pero con otra forma (un objeto, un número) no lanzaría y rompería el push de abajo.
            if (!Array.isArray(usuarios)) usuarios = [];
        }
        catch (error)
        {
            usuarios = [];
        }
        // Reviso duplicados por RUN y por correo antes de guardar: los dos identifican a la misma
        // persona, y repetir cualquiera de ellos dejaría dos fichas de alguien que es uno solo.
        // Esta comprobación sirve aquí porque la lista completa está en el navegador; con base de
        // datos real tiene que hacerla el servidor, que es el único que ve todos los registros.
        if (usuarios.some((usuario) => usuario.run === run)) return setFieldError("run", "Este RUN ya está registrado.");
        if (usuarios.some((usuario) => usuario.correo === correo)) return setFieldError("correo", "Este correo ya está registrado.");
        // Calculo el id como el mayor existente más uno, y no como largo del arreglo más uno: si
        // alguna vez se elimina un usuario del medio, el largo volvería a entregar un id ya usado.
        // Parto desde 2 porque las dos primeras filas de ejemplo vienen escritas en el HTML.
        const siguienteId = usuarios.reduce((max, usuario) => Math.max(max, Number(usuario.id) || 0), 2) + 1;
        usuarios.push(
        {
            id: siguienteId,             run,             nombre: values.nombre.trim(),             apellidos: values.apellidos.trim(),             correo,             fechaNacimiento: values["fecha-nacimiento"] || "",             rol: values["tipo-usuario"],             region: values.region,             comuna: values.comuna,             direccion: values.direccion.trim(),             estado: "Activo"
        }
        );
        // Guardo el usuario con estado "Activo" por defecto, porque recién creado debe poder
        // usar el sistema sin un paso extra de activación que en esta entrega no existe.
        localStorage.setItem(USUARIOS_KEY_ADMIN, JSON.stringify(usuarios));
        showFormMessage("mensaje-usuario", "Usuario creado correctamente. Ya aparece en el listado de Administración → Usuarios.", "success");
        form.reset();
        // form.reset() no alcanza para las comunas: devuelve el select a las opciones que yo le
        // agregué por código, que son las de la última región. Por eso lo vacío y lo vuelvo a
        // deshabilitar a mano, para dejar el formulario igual que al abrirlo.
        comuna.innerHTML = '<option value="">Selecciona una comuna</option>';
        comuna.disabled = true;
    }
    );
}
);
