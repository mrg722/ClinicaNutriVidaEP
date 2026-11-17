// Este es el acceso de la primera entrega, hecho solo con HTML y JavaScript: todavía no existía
// el backend, así que el perfil se deduce del correo y la sesión se simula en el navegador. Lo
// conservo porque es la evidencia de esa etapa, pero el acceso real de la aplicación hoy pasa
// por nutrivida-auth, que es el único que de verdad verifica la contraseña.
document.addEventListener('DOMContentLoaded', () =>
{
    const form = document.getElementById('form-login');

    // El script se carga en varias páginas, así que salgo si no estoy en la del formulario.
    if (!form) return;

    // Valido mientras la persona escribe, además de al enviar, para que corrija el error en el
    // momento y no después de apretar el botón. Recibo la función de validación como parámetro
    // para usar el mismo mecanismo con el correo y con la contraseña.
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

    validarCampoEnTiempoReal('correo', value =>
    {
        return validEmail(value.trim())
            ? true
            : 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.';
    });

    validarCampoEnTiempoReal('password', value =>
    {
        return value.length >= 4 && value.length <= 10
            ? true
            : 'La contraseña debe tener entre 4 y 10 caracteres.';
    });

    form.addEventListener('submit', e =>
    {
        // Corto el envío nativo porque no hay servidor al que postear: todo el acceso de esta
        // entrega se resuelve en el navegador y una recarga borraría el resultado en pantalla.
        e.preventDefault();

        clearAllFieldErrors(form);
        showFormMessage('mensaje-login', '');

        const v =
            Object.fromEntries(
                new FormData(form).entries()
            );

        const correo = v.correo.trim().toLowerCase();

        // Vuelvo a validar aquí aunque ya valide mientras se escribe: la validación en vivo no
        // corre si la persona pega el valor o envía el formulario con Enter sin tocar el campo.
        if (!validEmail(correo))
        {
            return setFieldError(
                'correo',
                'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.'
            );
        }

        if (
            v.password.length < 4 ||
            v.password.length > 10
        )
        {
            return setFieldError(
                'password',
                'La contraseña debe tener entre 4 y 10 caracteres.'
            );
        }

        // Deduzco el perfil desde el correo porque en esta entrega no hay base de datos donde
        // consultarlo. Es una simulación para la demostración, no un control de acceso: cualquiera
        // podría escribir ese correo y entrar. El rol de verdad lo entrega hoy el token del
        // backend, que se firma en el servidor y el navegador no puede falsificar.
        let role = 'Paciente';

        if (correo === 'admin@duoc.cl')
        {
            role = 'Administrador';
        }
        else if (correo.includes('nutricionista'))
        {
            role = 'Nutricionista';
        }

        // Guardo la sesión en sessionStorage y no en localStorage: así sobrevive a una recarga
        // mientras la persona navega entre las páginas HTML, pero se borra al cerrar la pestaña y
        // no queda abierta en un computador compartido, como los del laboratorio.
        sessionStorage.setItem(
            'nutrivida_sesion',
            JSON.stringify(
            {
                correo: correo,
                rol: role
            })
        );

        showFormMessage(
            'mensaje-login',
            'Inicio de sesión realizado correctamente.',
            'success'
        );

        const box = document.getElementById('acceso-rol');

        box.hidden = false;
        // Vacío el recuadro y armo el contenido con createElement en vez de pegar HTML en
        // innerHTML, porque aquí entra texto que viene de lo que la persona escribió y así el
        // navegador lo trata como texto y no como marcado que podría ejecutarse.
        box.innerHTML = '';

        const p = document.createElement('p');

        p.textContent = 'Perfil detectado: ' + role;

        const a = document.createElement('a');

        // Dejo el destino como un enlace que la persona decide tocar, en lugar de redirigir solo:
        // así alcanza a leer el perfil detectado, que es justamente lo que quiero mostrar.
        a.className = 'btn';
        a.href =
            role === 'Administrador'
                ? 'admin.html'
                : 'index.html';

        a.textContent =
            role === 'Administrador'
                ? 'Ir a administración'
                : 'Continuar al sitio';

        box.append(p, a);
    });
});