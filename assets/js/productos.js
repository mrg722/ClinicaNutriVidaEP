// Carrito del catálogo de la primera entrega. Lo guardo en localStorage y no en sessionStorage
// porque quiero que lo que la persona eligió siga ahí si cierra la pestaña y vuelve más tarde:
// una compra a medias no debería perderse, a diferencia de la sesión, que sí conviene que caduque.
let carrito=[];
// Lo que hay en localStorage es texto que pudo quedar de una versión anterior del sitio, así que
// si el JSON no se puede leer parto con el carrito vacío en vez de dejar la página caída.
try
{
    carrito=JSON.parse(localStorage.getItem('carrito'))||[]
} catch
{
    carrito=[]
}
// Fuerzo la cantidad a número al cargar: si quedó guardada como texto, el "+=" la concatenaría
// ("1"+1 daría "11") y el total saldría mal. Normalizo una vez aquí y no en cada operación.
carrito=carrito.map(p=>(
{
    ...p,cantidad:Number(p.cantidad||1)
}
));
const botones=document.querySelectorAll('.btn-agregar');
const contenido=document.querySelector('#carrito-contenido');
const total=document.querySelector('#total-carrito');
// Centralizo el guardado en una sola función para no olvidar nunca el aviso al encabezado.
// Lanzo el evento storage a mano porque el navegador solo lo dispara en las otras pestañas: sin
// esta línea, el contador del menú no se actualizaría en la pestaña que hizo el cambio.
function guardar()
{
    localStorage.setItem('carrito',JSON.stringify(carrito));
    window.dispatchEvent(new Event('storage'))
}
// Si el servicio ya está en el carrito subo la cantidad en lugar de agregar otra fila, para que
// la lista no se llene de líneas repetidas del mismo producto.
function agregar(producto)
{
    const existente=carrito.find(p=>p.id===producto.id);
    if (existente)existente.cantidad+=1;
    else carrito.push(
    {
        ...producto,cantidad:1
    }
    );
    guardar();
    mostrarCarrito()
}
function cambiarCantidad(id,delta)
{
    const p=carrito.find(x=>x.id===id);
    if (!p)return;
    p.cantidad+=delta;
    // Cuando la cantidad llega a cero saco el producto del carrito: dejar una línea con 0
    // unidades confundiría a la persona y obligaría a tener un botón de eliminar aparte.
    if (p.cantidad<=0)carrito=carrito.filter(x=>x.id!==id);
    guardar();
    mostrarCarrito()
}
// Repinto el carrito completo después de cada cambio en vez de ir tocando filas sueltas: es
// menos eficiente, pero garantiza que lo que se ve coincide siempre con el arreglo guardado.
function mostrarCarrito()
{
    if (!contenido||!total)return;
    contenido.innerHTML='';
    if (!carrito.length)
    {
        contenido.innerHTML='<p>El carrito está vacío.</p>';
        total.textContent='$0';
        return
    }
    // Voy sumando mientras recorro para no guardar el total en ninguna parte: así el monto se
    // calcula siempre desde los precios y las cantidades vigentes y no puede quedar desfasado.
    let suma=0;
    // Armo cada fila con createElement en lugar de concatenar HTML: el nombre del producto entra
    // como texto y el navegador no puede interpretarlo como marcado.
    carrito.forEach(p=>
    {
        const item=document.createElement('div');
        item.className='cart-item';
        const info=document.createElement('div');
        info.className='cart-item-name';
        const name=document.createElement('strong');
        name.textContent=p.nombre;
        const sub=document.createElement('small');
        sub.textContent=' '+p.cantidad+' × $'+Number(p.precio).toLocaleString('es-CL');
        info.append(name,sub);
        const minus=document.createElement('button');
        minus.type='button';
        minus.textContent='−';
        // Los botones solo muestran "−" y "+", que fuera de contexto no dicen nada. Por eso les
        // pongo un aria-label con el nombre del producto: así el lector de pantalla anuncia sobre
        // cuál de las filas actúa cada botón.
        minus.setAttribute('aria-label','Quitar una unidad de '+p.nombre);
        minus.addEventListener('click',()=>cambiarCantidad(p.id,-1));
        const plus=document.createElement('button');
        plus.type='button';
        plus.textContent='+';
        plus.setAttribute('aria-label','Agregar una unidad de '+p.nombre);
        plus.addEventListener('click',()=>cambiarCantidad(p.id,1));
        item.append(info,minus,plus);
        contenido.appendChild(item);
        suma+=Number(p.precio)*p.cantidad
    }
    );
    // Formateo con es-CL para que el monto se vea con el punto de miles chileno.
    total.textContent='$'+suma.toLocaleString('es-CL')
}
// Los datos de cada producto los leo de los data-* del botón en el HTML: así el catálogo vive en
// el marcado de la página y este script sirve igual sin tener la lista duplicada adentro.
botones.forEach(b=>b.addEventListener('click',()=>agregar(
{
    id:b.dataset.id,nombre:b.dataset.nombre,precio:Number(b.dataset.precio)
}
)));
// Pinto el carrito al cargar la página para mostrar lo que quedó guardado de la visita anterior.
mostrarCarrito()
