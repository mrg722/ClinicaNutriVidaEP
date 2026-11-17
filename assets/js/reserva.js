// Agendamiento de la primera entrega. Aquí no se consulta disponibilidad real: la reserva se
// valida, se guarda en el navegador y se muestra en la página de confirmación. El control de
// choques de horario y la cita definitiva son trabajo del backend, porque es el único que ve la
// agenda completa de la clínica; este formulario solo revisa que los datos estén bien escritos.
document.addEventListener('DOMContentLoaded', () =>
{
    const form = document.getElementById('form-reserva');

    if (!form) return;

    // Acepto el servicio preseleccionado por la URL para que, al llegar desde el catálogo con
    // "reserva.html?servicio=CN001", el formulario venga ya elegido y la persona no tenga que
    // buscarlo de nuevo en la lista.
    const params = new URLSearchParams(location.search);

    const service = document.getElementById('servicio');

    if (params.get('servicio') && service)
    {
        service.value = params.get('servicio');
    }

    const date = document.getElementById('fecha');

    // Pongo el mínimo del calendario en hoy: así el propio control del navegador impide elegir
    // una fecha pasada, antes de que yo tenga que rechazarla con un mensaje. Lo calculo cada vez
    // que se carga la página porque un valor fijo quedaría viejo al día siguiente.
    if (date)
    {
        date.min = new Date()
            .toISOString()
            .split('T')[0];
    }

    const validarCampoEnTiempoReal = (id, validar) =>
    {
        const campo = document.getElementById(id);

        if (!campo) return;

        campo.addEventListener('input', () =>
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

        // Escucho también change, además de input: los selects y los campos de fecha y hora se
        // llenan desde el control del navegador y en varios casos no emiten input al elegir.
        campo.addEventListener('change', () =>
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

    validarCampoEnTiempoReal('nombre', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu nombre completo.';
        }

        return validName(value.trim())
            ? true
            : 'Usa solo letras y espacios (2 a 100 caracteres).';
    });

    validarCampoEnTiempoReal('correo', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu correo electrónico.';
        }

        return validEmail(value.trim())
            ? true
            : 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.';
    });

    validarCampoEnTiempoReal('telefono', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu teléfono.';
        }

        return validPhone(value.trim())
            ? true
            : 'Ingresa un teléfono válido, por ejemplo +56 9 1234 5678.';
    });

    validarCampoEnTiempoReal('fecha', value =>
    {
        if (!value)
        {
            return 'Selecciona una fecha.';
        }

        // Dejo la hora de hoy en 00:00 para comparar día contra día: si no, una cita de hoy más
        // temprano aparecería como pasada solo por la hora en que se está usando la página.
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        // Le agrego 'T00:00:00' a propósito. Si construyera la fecha solo con "2026-03-15", el
        // navegador la interpretaría en UTC y en Chile podría caer un día antes; con la hora
        // explícita queda en horario local, que es el que ve la persona.
        const selected =
            new Date(value + 'T00:00:00');

        return selected >= today
            ? true
            : 'La fecha no puede ser anterior al día de hoy.';
    });

    validarCampoEnTiempoReal('hora', value =>
    {
        if (!value)
        {
            return 'Selecciona una hora.';
        }

        // Comparo las horas como texto, que funciona porque el campo time entrega siempre el
        // formato "HH:MM" con dos dígitos y ese orden ordena igual que el reloj. Las 09:00 y las
        // 18:00 son el horario de atención de la clínica, no un límite técnico.
        return value >= '09:00' && value <= '18:00'
            ? true
            : 'Selecciona un horario entre 09:00 y 18:00.';
    });

    validarCampoEnTiempoReal('motivo', value =>
    {
        if (!value.trim())
        {
            return 'Describe brevemente el motivo de consulta.';
        }

        return value.trim().length >= 10
            ? true
            : 'El motivo debe tener al menos 10 caracteres.';
    });

    form.addEventListener('submit', e =>
    {
        e.preventDefault();

        clearAllFieldErrors(form);
        showFormMessage('mensaje-reserva', '');

        const values =
            Object.fromEntries(
                new FormData(form).entries()
            );

        // Vuelvo a validar todo al enviar, porque la validación en vivo no se ejecuta si la
        // persona no llega a tocar un campo. Este bloque es el que realmente decide si se agenda.
        if (!values.nombre.trim())
        {
            return setFieldError(
                'nombre',
                'Ingresa tu nombre completo.'
            );
        }

        if (!validName(values.nombre.trim()))
        {
            return setFieldError(
                'nombre',
                'Usa solo letras y espacios (2 a 100 caracteres).'
            );
        }

        if (!values.correo.trim())
        {
            return setFieldError(
                'correo',
                'Ingresa tu correo electrónico.'
            );
        }

        if (!validEmail(values.correo.trim()))
        {
            return setFieldError(
                'correo',
                'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.'
            );
        }

        if (!values.telefono.trim())
        {
            return setFieldError(
                'telefono',
                'Ingresa tu teléfono.'
            );
        }

        if (!validPhone(values.telefono.trim()))
        {
            return setFieldError(
                'telefono',
                'Ingresa un teléfono válido.'
            );
        }

        // Nutricionista y servicio son selects, así que solo necesito comprobar que haya algo
        // elegido: las opciones posibles las define el HTML y no se escriben a mano.
        if (!values.nutricionista)
        {
            return setFieldError(
                'nutricionista',
                'Selecciona un nutricionista.'
            );
        }

        if (!values.servicio)
        {
            return setFieldError(
                'servicio',
                'Selecciona un servicio.'
            );
        }

        if (!values.fecha)
        {
            return setFieldError(
                'fecha',
                'Selecciona una fecha.'
            );
        }

        // Reviso la fecha de nuevo en el servidor de la lógica, por así decirlo: el atributo min
        // del input es solo una ayuda del navegador y se puede quitar desde las herramientas de
        // desarrollo, así que no me puedo apoyar únicamente en él.
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const selected =
            new Date(values.fecha + 'T00:00:00');

        if (selected < today)
        {
            return setFieldError(
                'fecha',
                'La fecha no puede ser anterior al día de hoy.'
            );
        }

        if (!values.hora)
        {
            return setFieldError(
                'hora',
                'Selecciona una hora.'
            );
        }

        if (
            values.hora < '09:00' ||
            values.hora > '18:00'
        )
        {
            return setFieldError(
                'hora',
                'Selecciona un horario entre 09:00 y 18:00.'
            );
        }

        if (!values.motivo.trim())
        {
            return setFieldError(
                'motivo',
                'Describe brevemente el motivo de consulta.'
            );
        }

        if (values.motivo.trim().length < 10)
        {
            return setFieldError(
                'motivo',
                'El motivo debe tener al menos 10 caracteres.'
            );
        }

        // Guardo la reserva en sessionStorage para poder leerla en confirmacion.html: entre dos
        // páginas HTML distintas no queda nada en memoria. Uso sessionStorage y no localStorage
        // porque son datos de un trámite puntual, y no quiero que la reserva de alguien quede
        // guardada en el navegador después de cerrar la pestaña.
        sessionStorage.setItem(
            'nutrivida_reserva',
            JSON.stringify(values)
        );

        // Navego con location.href en lugar de mostrar el resumen aquí, porque la confirmación es
        // una página aparte del flujo y así queda en el historial como un paso propio.
        location.href = 'confirmacion.html';
    });
});