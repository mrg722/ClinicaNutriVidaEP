// Una sola página de detalle sirve para todos los servicios: cuál mostrar llega en la query
// string (detalle-producto.html?id=EV002). Lo hago así porque en esta entrega no hay backend ni
// enrutador, y crear un archivo HTML por servicio significaría repetir el mismo marcado seis veces.
const parametros=new URLSearchParams(location.search);
const idProducto=parametros.get('id');
// Tengo el catálogo escrito aquí porque todavía no existía la API que hoy lo entrega. El id de
// la URL es la clave del objeto, así que buscar el servicio es un acceso directo y no un recorrido.
const productos=
{
    EV002:
    {
        nombre:'Bioimpedanciometría',descripcion:'Evaluación de composición corporal.',precio:12000,imagen:'bioimpedanciometria.jpg'
    }
    ,EV003:
    {
        nombre:'Encuesta de hábitos alimentarios',descripcion:'Análisis de hábitos y patrón alimentario.',precio:10000,imagen:'habitos-alimentarios.jpg'
    }
    ,EV004:
    {
        nombre:'Análisis de exámenes',descripcion:'Interpretación nutricional de exámenes.',precio:15000,imagen:'analisis-examenes.jpg'
    }
    ,TG001:
    {
        nombre:'Taller de alimentación saludable',descripcion:'Taller sobre alimentación equilibrada.',precio:15000,imagen:'alimentacion-saludable.jpg'
    }
    ,TG002:
    {
        nombre:'Taller de cocina nutritiva',descripcion:'Preparación de recetas saludables.',precio:20000,imagen:'cocina-nutritiva.jpg'
    }
    ,TG003:
    {
        nombre:'Taller de nutrición para deportistas',descripcion:'Alimentación e hidratación para deportistas.',precio:18000,imagen:'nutricion-deportiva.jpg'
    }
}
;
const p=productos[idProducto];
// El id viene de la URL, así que cualquiera puede escribir uno que no existe. Por eso compruebo
// antes de pintar: sin esta guarda la página mostraría "undefined" en cada campo.
if (p)
{
    document.querySelector('#nombre-producto').textContent=p.nombre;
    document.querySelector('#descripcion-producto').textContent=p.descripcion;
    document.querySelector('#codigo-producto').textContent=idProducto;
    document.querySelector('#precio-producto').textContent=p.precio.toLocaleString('es-CL');
    // Relleno los textos con textContent, nunca con innerHTML, para que el contenido se trate
    // como texto plano. La imagen la armo con el nombre de archivo del catálogo y le pongo un alt
    // descriptivo, porque una imagen sin alt deja fuera a quien usa lector de pantalla.
    const img=document.querySelector('#imagen-producto');
    img.src='assets/img/'+p.imagen;
    img.alt='Imagen representativa de '+p.nombre;
    document.querySelector('#btn-agregar-detalle').addEventListener('click',()=>
    {
        // Vuelvo a leer el carrito desde localStorage en el momento de agregar, en vez de usar una
        // copia cargada al abrir la página: si la persona lo modificó en otra pestaña, trabajar
        // con la copia vieja borraría esos cambios al guardar.
        let c=[];
        try
        {
            c=JSON.parse(localStorage.getItem('carrito'))||[]
        } catch
        {
        }
        // Mismo criterio que en el catálogo: si ya está, subo la cantidad en lugar de duplicar.
        const found=c.find(x=>x.id===idProducto);
        if (found)found.cantidad=Number(found.cantidad||1)+1;
        else c.push(
        {
            id:idProducto,nombre:p.nombre,precio:p.precio,cantidad:1
        }
        );
        localStorage.setItem('carrito',JSON.stringify(c));
        const m=document.querySelector('#mensaje-producto');
        m.textContent='Servicio agregado al carrito.';
        m.className='form-message success';
        // Aviso al encabezado para que actualice su contador, igual que en el catálogo.
        window.dispatchEvent(new Event('storage'))
    }
    )
} else
{
    // Si el id no existe explico qué pasó y deshabilito el botón de agregar: prefiero eso a
    // dejarlo activo y permitir que se guarde en el carrito un servicio que no existe.
    document.querySelector('#nombre-producto').textContent='Servicio no encontrado';
    document.querySelector('#descripcion-producto').textContent='El servicio solicitado no existe. Vuelve al catálogo para continuar.';
    document.querySelector('#btn-agregar-detalle').disabled=true
}
