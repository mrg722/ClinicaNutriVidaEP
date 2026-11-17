// Este archivo es mi caja de herramientas de formularios para las páginas HTML. Lo cargo antes
// que login.js, registro.js, contacto.js y reserva.js para que todos validen y muestren los
// errores igual: si cada formulario armara sus mensajes a su manera, la experiencia cambiaría
// de página en página y tendría la misma expresión regular copiada cuatro veces.
function getField(id)
{
    return document.getElementById(id)
}

// Creo el párrafo de error la primera vez que un campo falla, en vez de dejarlo escrito en cada
// HTML. Así ninguna página se queda sin el contenedor y no tengo que repetir el marcado.
function ensureErrorElement(field)
{
    if (!field)return null;

    // Derivo el id del error desde el id del campo para poder encontrarlo después sin guardar
    // referencias, y para enlazarlo con aria-describedby más abajo.
    const id='error-'+field.id;
    let el=document.getElementById(id);

    if (!el)
    {
        el=document.createElement('p');
        el.id=id;
        el.className='field-error';
        // Con aria-live el lector de pantalla anuncia el error cuando aparece, sin que la persona
        // tenga que volver al campo; uso "polite" para que espere a que termine de escribir.
        el.setAttribute('aria-live','polite');
        field.insertAdjacentElement('afterend',el)
    }

    // aria-describedby amarra el mensaje al campo: al enfocarlo, el lector lee también el error.
    field.setAttribute('aria-describedby',id);
    return el
}

// Devuelvo siempre false a propósito: así en los formularios puedo escribir
// "return setFieldError(...)" y cortar el envío en una sola línea.
function setFieldError(id,message)
{
    const field=getField(id);
    const error=ensureErrorElement(field);

    if (!field||!error)return false;

    // Marco aria-invalid además de pintar el texto, porque el borde rojo del CSS se cuelga de
    // ese atributo y el color por sí solo no basta como señal de error.
    field.setAttribute('aria-invalid','true');
    error.textContent=message;
    return false
}

// Vacío el texto en lugar de borrar el elemento: si lo eliminara perdería el aria-describedby
// y tendría que volver a crearlo en el siguiente error.
function clearFieldError(id)
{
    const field=getField(id);
    if (!field)return;

    const error=document.getElementById('error-'+id);

    field.removeAttribute('aria-invalid');

    if (error)error.textContent=''
}

// Limpio todo el formulario de una pasada al inicio de cada envío, para que no queden mensajes
// de un intento anterior conviviendo con los del intento nuevo.
function clearAllFieldErrors(form)
{
    form.querySelectorAll('[aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(el=>el.textContent='')
}

// Este es el mensaje general del formulario, distinto del error de un campo: lo uso para el
// resultado del envío completo. El tipo viaja como clase CSS para no repetir estilos en línea.
function showFormMessage(id,message,type='error')
{
    const el=getField(id);

    if (!el)return;

    el.textContent=message;
    el.className='form-message '+type
}

// Dejo el correo en minúsculas y sin espacios antes de guardarlo o compararlo, porque para el
// sistema "Ana@Duoc.cl" y "ana@duoc.cl" son la misma persona y no quiero duplicados por eso.
function normalizeEmail(value)
{
    return value.trim().toLowerCase()
}

// Acepto solo los tres dominios que pide el enunciado en vez de validar cualquier correo: es una
// restricción del caso, no un descuido. Toda esta validación es de comodidad para la persona;
// la que de verdad protege los datos es la del backend, porque esto se puede saltar desde la
// consola del navegador.
function validEmail(value)
{
    return /^[^\s@]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(value)
}

// Incluyo tildes y ñ en el patrón porque son nombres chilenos y rechazarlos sería un error;
// no permito números ni símbolos, que en un nombre casi siempre son un dedazo.
function validName(value)
{
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,100}$/.test(value)
}

// Dejo pasar el + inicial y los espacios o guiones de separación para no obligar a la persona a
// escribir el teléfono con un formato exacto; el largo acota el resto.
function validPhone(value)
{
    return /^\+?\d[\d\s-]{7,14}$/.test(value)
}

// Conecto aquí el botón de mostrar u ocultar contraseña, una sola vez para todas las páginas:
// el campo nace como type="password" y solo lo cambio cuando la persona lo pide, para que la
// clave no quede visible por defecto frente a quien esté al lado.
document.addEventListener('DOMContentLoaded',()=>
{
    document.querySelectorAll('.password-toggle').forEach(btn=>
        btn.addEventListener('click',()=>
        {
            const input=getField(btn.dataset.target);

            if (!input)return;

            const show=input.type==='password';

            input.type=show?'text':'password';

            btn.textContent=show?'Ocultar':'Mostrar';

            // Cambio también el aria-label: el texto del botón lo ve quien mira la pantalla, pero
            // quien usa lector de pantalla necesita que la etiqueta diga la acción actual.
            btn.setAttribute(
                'aria-label',
                show?'Ocultar contraseña':'Mostrar contraseña'
            )
        })
    )
})