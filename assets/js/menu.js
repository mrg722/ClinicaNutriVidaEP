// Este es el menú lateral de las páginas HTML de la primera entrega. Todo el archivo vive dentro
// de DOMContentLoaded porque necesito que los elementos del encabezado ya existan antes de
// buscarlos: si lo ejecutara antes, getElementById devolvería null y el menú quedaría muerto.
document.addEventListener('DOMContentLoaded',()=>
{
    const button=document.getElementById('boton-menu');
    const menu=document.getElementById('menu-lateral');
    const close=document.getElementById('cerrar-menu');
    const backdrop=document.getElementById('menu-backdrop');
    // Uso el mismo archivo en todas las páginas, y no todas tienen menú lateral. Si falta el
    // botón o el panel salgo sin hacer nada, para no reventar el resto de los scripts de la página.
    if (!button||!menu)return;
    // Abrir y cerrar no es solo mostrar u ocultar: además muevo los atributos ARIA y el foco,
    // porque quien navega con lector de pantalla o teclado necesita saber que el panel cambió
    // de estado. Por eso aria-hidden, aria-expanded y el foco al primer enlace van juntos.
    const open=()=>
    {
        menu.classList.add('menu-visible');
        menu.setAttribute('aria-hidden','false');
        button.setAttribute('aria-expanded','true');
        button.setAttribute('aria-label','Cerrar menú principal');
        if (backdrop)
        {
            backdrop.hidden=false
        }
        document.body.classList.add('menu-open');
        const first=menu.querySelector('a');
        if (first)first.focus()
    }
    ;
    const shut=()=>
    {
        menu.classList.remove('menu-visible');
        menu.setAttribute('aria-hidden','true');
        button.setAttribute('aria-expanded','false');
        button.setAttribute('aria-label','Abrir menú principal');
        if (backdrop)
        {
            backdrop.hidden=true
        }
        document.body.classList.remove('menu-open')
    }
    ;
    // Decido abrir o cerrar mirando la clase que tiene el panel en ese momento, en vez de guardar
    // una variable aparte: así el estado real del DOM es la única fuente de verdad y no se puede
    // desincronizar con una bandera mía.
    button.addEventListener('click',()=>menu.classList.contains('menu-visible')?shut():open());
    if (close)close.addEventListener('click',shut);
    // El fondo oscuro también cierra, porque es lo que la gente espera al tocar fuera del panel.
    if (backdrop)backdrop.addEventListener('click',shut);
    // Escape cierra y devuelvo el foco al botón: si lo dejara dentro de un panel oculto, quien
    // navega con teclado quedaría sin referencia de dónde está.
    document.addEventListener('keydown',e=>
    {
        if (e.key==='Escape'&&menu.classList.contains('menu-visible'))
        {
            shut();
            button.focus()
        }
    }
    );
    // Cierro al hacer clic en un enlace porque entre páginas HTML distintas no hay enrutador:
    // si no lo cerrara, la página siguiente podría pintarse con el panel abierto.
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',shut));
    // Marco el enlace de la página actual con aria-current. Saco el nombre del archivo desde la
    // ruta y caigo en index.html cuando la URL termina en "/", que es como la sirve el servidor.
    const current=window.location.pathname.split('/').pop()||'index.html';
    menu.querySelectorAll('a').forEach(a=>
    {
        const href=(a.getAttribute('href')||'').split('?')[0];
        if (href===current)a.setAttribute('aria-current','page')
    }
    );
    // Sobre 700 px el CSS ya muestra la navegación normal, así que el panel lateral dejaría de
    // tener sentido y encima bloquea el scroll del body. Lo cierro al agrandar la ventana.
    window.addEventListener('resize',()=>
    {
        if (window.innerWidth>700&&menu.classList.contains('menu-visible'))shut()
    }
    );
    // El contador del carrito vive en el encabezado de todas las páginas, por eso lo actualizo
    // desde aquí y no desde productos.js: así el número es correcto aunque la persona entre
    // directo a una página que no tiene catálogo.
    const updateCartBadge=()=>
    {
        let cart=[];
        // Envuelvo el JSON.parse en try porque lo que hay en localStorage lo puede haber dejado
        // una versión anterior o editado alguien a mano. Si está corrupto prefiero mostrar 0
        // antes que dejar el encabezado roto con una excepción.
        try
        {
            cart=JSON.parse(localStorage.getItem('carrito'))||[]
        } catch
        {
        }
        const count=cart.reduce((n,p)=>n+Number(p.cantidad||1),0);
        document.querySelectorAll('.cart-count').forEach(el=>el.textContent=count)
    }
    ;
    updateCartBadge();
    // Escucho el evento storage para que, si la persona agrega productos en otra pestaña, el
    // contador de esta se entere. El navegador solo avisa a las demás pestañas, nunca a la que
    // hizo el cambio, y por eso además llamo a la función una vez al cargar.
    window.addEventListener('storage',updateCartBadge)
}
)
