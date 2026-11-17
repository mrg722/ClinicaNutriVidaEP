// Registro público de pacientes de la primera entrega. Todo se resuelve en el navegador porque
// aún no existía el backend: la lista de usuarios queda en localStorage bajo la misma clave que
// lee el panel de administración, y eso es lo que hace que un registro nuevo aparezca allá.
// Las comunas van agrupadas por región para encadenar los dos selects y evitar que alguien
// combine una región con una comuna que no le pertenece.
const comunasPorRegion =
{
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"],
    "Antofagasta": ["Antofagasta", "Calama", "Mejillones", "Tocopilla"],
    "Atacama": ["Copiapó", "Caldera", "Vallenar", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel"],
    "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio"],
    "Metropolitana de Santiago": ["Santiago", "La Reina", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "Puente Alto", "San Bernardo"],
    "O'Higgins": ["Rancagua", "Machalí", "Rengo", "San Fernando"],
    "Maule": ["Talca", "Curicó", "Linares", "Molina"],
    "Ñuble": ["Chillán", "San Carlos", "Bulnes", "Yungay"],
    "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel"],
    "La Araucanía": ["Temuco", "Villarrica", "Pucón", "Angol"],
    "Los Ríos": ["Valdivia", "La Unión", "Río Bueno", "Panguipulli"],
    "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud"],
    "Aysén": ["Coyhaique", "Aysén", "Chile Chico", "Cochrane"],
    "Magallanes y de la Antártica Chilena": ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"]
};

const USUARIOS_KEY = "nutrivida_usuarios";

// Leo la lista con dos intentos: primero la clave actual y, si no hay nada, reviso si quedó un
// usuario guardado con el formato viejo. Lo hago para no perder el dato de quien se registró con
// una versión anterior de la página, que es el caso que me obligó a agregar la migración.
function obtenerUsuarios()
{
    try
    {
        const guardados = JSON.parse(localStorage.getItem(USUARIOS_KEY));

        // Compruebo que sea un arreglo, no solo que el JSON sea válido: cualquier otra forma
        // rompería los recorridos que hago después.
        if (Array.isArray(guardados))
        {
            return guardados;
        }
    }
    catch (error)
    {
        console.warn("No se pudo leer la lista de usuarios.", error);
    }

    try
    {
        // Esta es la migración del formato antiguo, que guardaba un solo usuario en otra clave.
        // Lo convierto a la lista nueva y lo dejo escrito, para que esta conversión ocurra una
        // sola vez y las siguientes cargas usen ya la clave actual.
        const usuarioAnterior = JSON.parse(
            localStorage.getItem("nutrivida_usuario_demo")
        );

        if (usuarioAnterior)
        {
            // Le completo rol y estado porque el formato viejo no los tenía, y sin ellos el
            // listado del panel mostraría columnas vacías.
            const migrado =
            [
                {
                    ...usuarioAnterior,
                    id: 3,
                    rol: "Paciente",
                    estado: "Activo"
                }
            ];

            localStorage.setItem(
                USUARIOS_KEY,
                JSON.stringify(migrado)
            );

            return migrado;
        }
    }
    catch (error)
    {
        console.warn(
            "No se pudo migrar el usuario de demostración.",
            error
        );
    }

    return [];
}

// Dejo el guardado en una función aparte para que todas las escrituras pasen por el mismo lugar
// y nadie escriba en la clave equivocada por error.
function guardarUsuarios(usuarios)
{
    localStorage.setItem(
        USUARIOS_KEY,
        JSON.stringify(usuarios)
    );
}

// Valido el RUN con su dígito verificador y no solo con el formato: un número bien escrito pero
// inválido entraría igual y después no habría manera de identificar a la persona en la clínica.
function validarRun(run)
{
    // Normalizo primero, porque la gente escribe el RUN con puntos, con guión o sin nada y el
    // cálculo necesita únicamente los dígitos más el verificador.
    const rut = run
        .replace(/[.\-]/g, "")
        .toUpperCase();

    if (!/^\d{7,8}[0-9K]$/.test(rut))
    {
        return false;
    }

    // Módulo 11 del Registro Civil: recorro el número de derecha a izquierda multiplicando por la
    // serie 2,3,4,5,6,7 y volviendo a 2 al pasarme. Empiezo en length-2 para saltarme el dígito
    // verificador, que es justamente el valor que quiero recalcular y comparar.
    let suma = 0;
    let multiplicador = 2;

    for (let i = rut.length - 2; i >= 0; i--)
    {
        suma += Number(rut[i]) * multiplicador;

        multiplicador =
            multiplicador === 7
                ? 2
                : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);

    // Los dos casos especiales del algoritmo: el 11 se escribe como 0 y el 10 como K. Sin estas
    // excepciones rechazaría por error todos los RUN que terminan en 0 o en K.
    const digito =
        resultado === 11
            ? "0"
            : resultado === 10
                ? "K"
                : String(resultado);

    return digito === rut.at(-1);
}

document.addEventListener("DOMContentLoaded", () =>
{
    const form = document.getElementById("form-registro");

    if (!form) return;

    const region = document.getElementById("region");
    const comuna = document.getElementById("comuna");
    const fecha = document.getElementById("fecha-nacimiento");

    // Lleno el select de regiones desde el objeto para que la lista de la página y las comunas
    // disponibles salgan de la misma fuente y no puedan contradecirse.
    Object.keys(comunasPorRegion).forEach((nombreRegion) =>
    {
        const option = document.createElement("option");

        option.value = nombreRegion;
        option.textContent = nombreRegion;

        region.appendChild(option);
    });

    // Al cambiar de región rearmo las comunas desde cero: lo primero es vaciar el select, para que
    // no quede seleccionada una comuna de la región anterior.
    region.addEventListener("change", () =>
    {
        comuna.innerHTML =
            '<option value="">Selecciona una comuna</option>';

        (comunasPorRegion[region.value] || []).forEach(
            (nombreComuna) =>
            {
                const option = document.createElement("option");

                option.value = nombreComuna;
                option.textContent = nombreComuna;

                comuna.appendChild(option);
            }
        );

        // Mantengo las comunas deshabilitadas mientras no haya región: así queda claro el orden
        // y no ofrezco una lista vacía.
        comuna.disabled = !region.value;

        // Limpio el error de región en cuanto elige una, sin esperar al próximo envío.
        if (region.value)
        {
            clearFieldError("region");
        }
    });

    // Tope de la fecha de nacimiento en hoy: nadie nace en el futuro, y así el propio calendario
    // lo impide. Lo calculo en cada carga porque un valor fijo se vencería al día siguiente.
    if (fecha)
    {
        fecha.max = new Date()
            .toISOString()
            .split("T")[0];
    }

    // VALIDACIÓN EN TIEMPO REAL
    // Valido mientras la persona escribe para que corrija en el momento, y recibo la regla como
    // función para no repetir el enganche del evento en cada uno de los campos.
    const validarCampoEnTiempoReal = (id, validar) =>
    {
        const campo = document.getElementById(id);

        if (!campo) return;

        campo.addEventListener("input", () =>
        {
            const resultado = validar(campo.value);

            if (resultado === true)
            {
                clearFieldError(id);
            }
            else
            {
                setFieldError(id, resultado);
            }
        });
    };

    validarCampoEnTiempoReal("run", (value) =>
    {
        return validarRun(value.trim().toUpperCase())
            ? true
            : "Ingresa un RUN chileno válido.";
    });

    validarCampoEnTiempoReal("nombre", (value) =>
    {
        return validName(value.trim())
            ? true
            : "Ingresa un nombre válido.";
    });

    validarCampoEnTiempoReal("apellidos", (value) =>
    {
        return validName(value.trim())
            ? true
            : "Ingresa apellidos válidos.";
    });

    validarCampoEnTiempoReal("correo", (value) =>
    {
        return validEmail(value.trim())
            ? true
            : "Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    });

    validarCampoEnTiempoReal("direccion", (value) =>
    {
        return value.trim().length >= 5
            ? true
            : "La dirección debe tener al menos 5 caracteres.";
    });

    validarCampoEnTiempoReal("password", (value) =>
    {
        return value.length >= 4 && value.length <= 10
            ? true
            : "La contraseña debe tener entre 4 y 10 caracteres.";
    });

    // El largo de 4 a 10 caracteres lo pide el enunciado del caso; no es lo que elegiría para una
    // clave real, pero es el requisito que tengo que cumplir.
    // La confirmación la comparo leyendo el otro campo en el momento, no una copia guardada: así
    // el aviso es correcto aunque la persona cambie la primera clave después de confirmarla.
    validarCampoEnTiempoReal("password-confirmar", (value) =>
    {
        const password =
            document.getElementById("password")?.value || "";

        return value === password
            ? true
            : "Las contraseñas no coinciden.";
    });

    // VALIDACIÓN AL ENVIAR
    // Repito todas las reglas aquí a propósito: la validación en vivo solo se ejecuta si la
    // persona toca el campo, así que un formulario enviado con Enter o con valores pegados
    // llegaría sin revisar. Este bloque es el único que decide si el registro se guarda.
    form.addEventListener("submit", (event) =>
    {
        event.preventDefault();

        clearAllFieldErrors(form);
        showFormMessage("mensaje-registro", "");

        const values =
            Object.fromEntries(
                new FormData(form).entries()
            );

        // Normalizo RUN y correo antes de validar y de guardar, porque más abajo los uso para
        // buscar duplicados: si uno quedara en mayúsculas y otro en minúsculas, la misma persona
        // podría registrarse dos veces sin que la comparación lo detecte.
        const runNormalizado =
            values.run.trim().toUpperCase();

        const correoNormalizado =
            values.correo.trim().toLowerCase();

        if (!validarRun(runNormalizado))
        {
            return setFieldError(
                "run",
                "Ingresa un RUN chileno válido."
            );
        }

        if (!validName(values.nombre.trim()))
        {
            return setFieldError(
                "nombre",
                "Ingresa un nombre válido."
            );
        }

        if (!validName(values.apellidos.trim()))
        {
            return setFieldError(
                "apellidos",
                "Ingresa apellidos válidos."
            );
        }

        if (!validEmail(correoNormalizado))
        {
            return setFieldError(
                "correo",
                "Usa @duoc.cl, @profesor.duoc.cl o @gmail.com."
            );
        }

        // La fecha de nacimiento es opcional, así que solo la reviso si viene con algo. Vuelvo a
        // comprobarla aunque ya puse el atributo max: ese tope es ayuda del navegador y se puede
        // quitar desde las herramientas de desarrollo. Le agrego 'T00:00:00' para que la fecha se
        // interprete en horario local y no en UTC, donde en Chile podría caer un día antes.
        if (
            values["fecha-nacimiento"] &&
            new Date(
                values["fecha-nacimiento"] + "T00:00:00"
            ) > new Date()
        )
        {
            return setFieldError(
                "fecha-nacimiento",
                "La fecha no puede ser futura."
            );
        }

        if (!values.region)
        {
            return setFieldError(
                "region",
                "Selecciona una región."
            );
        }

        if (!values.comuna)
        {
            return setFieldError(
                "comuna",
                "Selecciona una comuna."
            );
        }

        if (values.direccion.trim().length < 5)
        {
            return setFieldError(
                "direccion",
                "La dirección debe tener al menos 5 caracteres."
            );
        }

        if (
            values.password.length < 4 ||
            values.password.length > 10
        )
        {
            return setFieldError(
                "password",
                "La contraseña debe tener entre 4 y 10 caracteres."
            );
        }

        if (
            values.password !==
            values["password-confirmar"]
        )
        {
            return setFieldError(
                "password-confirmar",
                "Las contraseñas no coinciden."
            );
        }

        // Reviso duplicados por RUN y por correo: los dos identifican a la misma persona y
        // repetir cualquiera de ellos crearía dos fichas de alguien que es uno solo. Esto funciona
        // aquí porque la lista completa está en este navegador; con una base de datos real la
        // comprobación tiene que hacerla el servidor, que es el único que ve todos los registros.
        const usuarios = obtenerUsuarios();

        const duplicadoRun =
            usuarios.some(
                (usuario) =>
                    usuario.run === runNormalizado
            );

        const duplicadoCorreo =
            usuarios.some(
                (usuario) =>
                    usuario.correo === correoNormalizado
            );

        if (duplicadoRun)
        {
            return setFieldError(
                "run",
                "Este RUN ya está registrado."
            );
        }

        if (duplicadoCorreo)
        {
            return setFieldError(
                "correo",
                "Este correo ya está registrado."
            );
        }

        // Calculo el id como el mayor existente más uno, no como el largo del arreglo más uno: si
        // se eliminara un usuario del medio, el largo volvería a entregar un id ya usado. Parto
        // desde 2 porque las dos primeras filas de ejemplo vienen escritas en el HTML del panel.
        const siguienteId =
            usuarios.reduce(
                (max, usuario) =>
                    Math.max(
                        max,
                        Number(usuario.id) || 0
                    ),
                2
            ) + 1;

        // No se almacena la contraseña: armo el objeto campo por campo justamente para dejarla
        // fuera, en vez de guardar "values" completo. localStorage es texto plano que cualquiera
        // puede leer desde la consola del navegador, así que una clave ahí quedaría a la vista.
        // Guardar contraseñas es trabajo del backend, que las deja cifradas con BCrypt.
        const usuario =
        {
            id: siguienteId,
            run: runNormalizado,
            nombre: values.nombre.trim(),
            apellidos: values.apellidos.trim(),
            correo: correoNormalizado,
            fechaNacimiento:
                values["fecha-nacimiento"] || "",
            region: values.region,
            comuna: values.comuna,
            direccion: values.direccion.trim(),
            rol: "Paciente",
            estado: "Activo"
        };

        usuarios.push(usuario);

        guardarUsuarios(usuarios);

        showFormMessage(
            "mensaje-registro",
            "Registro realizado correctamente. El usuario quedó disponible en Administración → Usuarios.",
            "success"
        );

        form.reset();

        // form.reset() no sirve para las comunas: devuelve el select a las opciones que yo le
        // agregué por código, que son las de la última región elegida. Por eso lo vacío y lo
        // deshabilito a mano, para que el formulario quede igual que al abrirlo.
        comuna.innerHTML =
            '<option value="">Selecciona una comuna</option>';

        comuna.disabled = true;
    });
});