// Formulario de contacto de la primera entrega. No hay servidor de correo detrás: el objetivo
// evaluado era la validación completa de los cinco campos y el aviso de resultado, así que el
// envío se simula. Por eso el mensaje de éxito dice que se envió, pero nada sale del navegador.
document.addEventListener('DOMContentLoaded', () =>
{
    const form = document.getElementById('form-contacto');

    if (!form) return;

    // Misma estrategia que en el resto de los formularios: valido mientras la persona escribe
    // para que vea el error en el momento, y recibo la regla como función para no repetir el
    // enganche del evento en cada campo.
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
    };

    // Cada regla devuelve true si pasa, o el mensaje de error si no: así una misma función sirve
    // para decidir y para explicar, sin tener que devolver un objeto con dos campos.
    // Separo "está vacío" de "está mal escrito" porque son errores distintos y la persona
    // necesita saber si le falta el dato o si lo escribió con un formato que no acepto.
    validarCampoEnTiempoReal('nombre', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu nombre.';
        }

        return validName(value.trim())
            ? true
            : 'Ingresa un nombre válido.';
    });

    validarCampoEnTiempoReal('correo', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu correo.';
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
            : 'Ingresa un teléfono válido.';
    });

    validarCampoEnTiempoReal('asunto', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa un asunto.';
        }

        return value.trim().length >= 3
            ? true
            : 'El asunto debe tener al menos 3 caracteres.';
    });

    // Exijo un mínimo de 10 caracteres en el mensaje y 3 en el asunto: no es un capricho, es para
    // que no lleguen consultas de una palabra que después nadie puede responder.
    validarCampoEnTiempoReal('mensaje', value =>
    {
        if (!value.trim())
        {
            return 'Ingresa tu mensaje.';
        }

        return value.trim().length >= 10
            ? true
            : 'El mensaje debe tener al menos 10 caracteres.';
    });

    form.addEventListener('submit', e =>
    {
        // Sin preventDefault el navegador recargaría la página y borraría el mensaje de resultado.
        e.preventDefault();

        clearAllFieldErrors(form);
        showFormMessage('mensaje-contacto', '');

        const v =
            Object.fromEntries(
                new FormData(form).entries()
            );

        // Repito aquí las mismas reglas del modo en vivo. Parece duplicado, pero es necesario: la
        // validación en vivo solo corre si la persona escribe en el campo, y un formulario enviado
        // con Enter o con valores pegados nunca dispara ese evento. Este bloque es el único que
        // de verdad decide si el envío continúa.
        if (!v.nombre.trim())
        {
            return setFieldError(
                'nombre',
                'Ingresa tu nombre.'
            );
        }

        if (!validName(v.nombre.trim()))
        {
            return setFieldError(
                'nombre',
                'Ingresa un nombre válido.'
            );
        }

        if (!v.correo.trim())
        {
            return setFieldError(
                'correo',
                'Ingresa tu correo.'
            );
        }

        if (!validEmail(v.correo.trim()))
        {
            return setFieldError(
                'correo',
                'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.'
            );
        }

        if (!v.telefono.trim())
        {
            return setFieldError(
                'telefono',
                'Ingresa tu teléfono.'
            );
        }

        if (!validPhone(v.telefono.trim()))
        {
            return setFieldError(
                'telefono',
                'Ingresa un teléfono válido.'
            );
        }

        if (!v.asunto.trim())
        {
            return setFieldError(
                'asunto',
                'Ingresa un asunto.'
            );
        }

        if (v.asunto.trim().length < 3)
        {
            return setFieldError(
                'asunto',
                'El asunto debe tener al menos 3 caracteres.'
            );
        }

        if (!v.mensaje.trim())
        {
            return setFieldError(
                'mensaje',
                'Ingresa tu mensaje.'
            );
        }

        if (v.mensaje.trim().length < 10)
        {
            return setFieldError(
                'mensaje',
                'El mensaje debe tener al menos 10 caracteres.'
            );
        }

        showFormMessage(
            'mensaje-contacto',
            'Mensaje enviado correctamente.',
            'success'
        );

        // Limpio el formulario recién después de confirmar, para que se note que el envío terminó
        // y para que no se manden dos veces los mismos datos por un segundo clic.
        form.reset();
    });
});