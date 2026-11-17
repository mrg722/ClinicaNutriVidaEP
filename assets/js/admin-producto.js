// Mantenimiento de productos del panel de administración de la primera entrega. Aquí no hay
// base de datos: lo que se valida y se edita vive solo en la página, y el objetivo era demostrar
// las validaciones y la alerta de stock crítico. Cualquiera que abra la consola puede saltarse
// todo esto, así que no es un control real; eso lo hace hoy el backend.
function setupProductForm()
{
    const form=document.getElementById('form-producto');
    if (!form)return;
    form.addEventListener('submit',e=>
    {
        // Corto el envío nativo porque no hay endpoint que reciba el formulario.
        e.preventDefault();
        clearAllFieldErrors(form);
        showFormMessage('mensaje-producto','');
        const v=Object.fromEntries(new FormData(form).entries());
        // Valido campo por campo y corto en el primer error con un return: así solo muestro un
        // mensaje a la vez y la persona corrige de arriba hacia abajo, en el orden del formulario.
        if (v.codigo.trim().length<3)return setFieldError('codigo','El código debe tener al menos 3 caracteres.');
        if (!v.nombre.trim())return setFieldError('nombre','Ingresa el nombre del producto.');
        if (v.descripcion.length>500)return setFieldError('descripcion','La descripción no puede superar los 500 caracteres.');
        if (v.precio===''||Number(v.precio)<0)return setFieldError('precio','Ingresa un precio mayor o igual a 0.');
        // Comparo con la cadena vacía además de mirar el número, porque Number('') devuelve 0 y
        // un campo en blanco pasaría la validación como si hubieran escrito un cero.
        // El stock lo exijo entero: no existen medias unidades de un producto.
        if (v.stock===''||!Number.isInteger(Number(v.stock))||Number(v.stock)<0)return setFieldError('stock','El stock debe ser un entero mayor o igual a 0.');
        // El stock crítico es opcional, así que solo lo valido si viene con algo escrito.
        if (v['stock-critico']!==''&&(!Number.isInteger(Number(v['stock-critico']))||Number(v['stock-critico'])<0))return setFieldError('stock-critico','El stock crítico debe ser un entero válido.');
        if (!v.categoria)return setFieldError('categoria','Selecciona una categoría.');
        if (v.imagen)
        {
            // Uso el constructor URL en vez de una expresión regular propia: el navegador ya sabe
            // qué es una URL válida y lanza si no lo es, así que aprovecho esa comprobación.
            try
            {
                new URL(v.imagen)
            } catch
            {
                return setFieldError('imagen','Ingresa una URL de imagen válida.')
            }
        }
        showFormMessage('mensaje-producto','Producto creado correctamente.','success');
        form.reset()
    }
    )
}
// La edición la hago con prompt y alert porque en esta entrega no había un formulario modal ni
// servidor que guardara los cambios: era la forma más directa de demostrar la edición con
// validación. Los cambios se escriben en la tabla y se pierden al recargar.
function editarProducto(id)
{
    const rows=document.querySelectorAll('#tabla-productos tr');
    // Las filas están numeradas desde 1 en el HTML, por eso resto 1 para indexar el arreglo.
    const row=rows[id-1];
    if (!row)return;
    const name=prompt('Nuevo nombre del producto:',row.cells[1].textContent.trim());
    // prompt devuelve null si la persona cancela y cadena vacía si deja el campo en blanco. Los
    // distingo con === null para que cancelar no borre el valor que ya estaba en la tabla.
    if (name===null)return;
    if (name.trim().length<2)
    {
        alert('El nombre debe tener al menos 2 caracteres.');
        return
    }
    // En la tabla el precio está formateado ("$35.000"), así que le saco el signo y los puntos
    // antes de ofrecerlo como valor inicial: si no, el prompt partiría con un texto no numérico.
    const price=prompt('Nuevo precio del producto:',row.cells[3].textContent.replace(/[$.]/g,''));
    if (price===null)return;
    if (isNaN(Number(price))||Number(price)<0)
    {
        alert('Ingresa un precio válido.');
        return
    }
    // La celda de stock puede traer el aviso "12 · Stock crítico", así que corto en el separador
    // y me quedo solo con el número antes de mostrarlo.
    const stock=prompt('Nuevo stock del producto:',row.cells[4].textContent.split('·')[0].trim());
    if (stock===null)return;
    if (!Number.isInteger(Number(stock))||Number(stock)<0)
    {
        alert('El stock debe ser un entero mayor o igual a 0.');
        return
    }
    // Recién cuando los tres valores pasaron sus validaciones toco la tabla: así una cancelación
    // o un dato inválido a mitad de camino no deja la fila escrita a medias.
    row.cells[1].textContent=name.trim();
    row.cells[3].textContent='$'+Number(price).toLocaleString('es-CL');
    row.cells[4].textContent=Number(stock)<=3?Number(stock)+' · Stock crítico':String(stock);
    row.cells[4].className=Number(stock)<=3?'stock-critical':'stock-ok';
    // Recalculo la alerta después de editar, porque el stock que acabo de cambiar puede haber
    // entrado o salido del rango crítico.
    mostrarAlertaStock()
}
// Recorro toda la tabla y vuelvo a calcular el aviso completo en lugar de llevar un contador
// aparte: el conteo siempre refleja lo que está en pantalla y no se puede desincronizar.
// El umbral de 3 unidades es la regla de negocio que define cuándo el stock es crítico.
function mostrarAlertaStock()
{
    const table=document.getElementById('tabla-productos'),alerta=document.getElementById('alerta-stock');
    if (!table||!alerta)return;
    let count=0;
    table.querySelectorAll('tr').forEach(row=>
    {
        const cell=row.cells[4];
        if (!cell)return;
        const n=Number(cell.textContent.split('·')[0].trim());
        if (n<=3)
        {
            count++;
            cell.className='stock-critical'
        }
        else cell.className='stock-ok'
    }
    );
    // Muestro el aviso también cuando no hay nada crítico: un recuadro vacío haría dudar de si
    // la revisión se ejecutó, y así la persona sabe que el estado es correcto.
    alerta.textContent=count?`Hay ${count} producto(s) con stock crítico.`:'No hay productos con stock crítico.';
    alerta.className=count?'notice stock-critical':'notice stock-ok'
}
// Dejo las funciones fuera de DOMContentLoaded a propósito, porque los botones de la tabla las
// llaman con onclick desde el HTML y necesitan que sean globales. Aquí solo engancho el arranque.
document.addEventListener('DOMContentLoaded',()=>
{
    setupProductForm();
    // Calculo la alerta al cargar para que el aviso de stock crítico se vea sin tocar nada.
    mostrarAlertaStock()
}
)
