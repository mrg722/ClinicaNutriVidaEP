// Listado de usuarios del panel de la primera entrega. Lee la misma clave de localStorage que
// escribe admin-usuario.js: esa clave compartida es todo el "contrato" entre las dos páginas,
// porque en esta etapa no había API ni base de datos en medio.
const USUARIOS_KEY = "nutrivida_usuarios";

// Encapsulo la lectura en una función para que el resto del archivo nunca reciba algo que no sea
// un arreglo, y así no tener que repetir el try en cada lugar donde necesito la lista.
function obtenerUsuariosAdmin() {
    try {
        const usuarios = JSON.parse(
            localStorage.getItem(USUARIOS_KEY)
        );

        // Solo devuelvo el valor si de verdad es un arreglo: un JSON válido con otra forma no
        // haría fallar el parseo, pero sí reventaría el .map() de más abajo.
        if (Array.isArray(usuarios)) {
            return usuarios;
        }
    } catch (error) {
        // Aviso en consola y sigo con la lista vacía: que el dato guardado esté corrupto no
        // debería dejar el panel en blanco sin ninguna explicación para quien lo revise.
        console.warn(
            "No se pudo leer la lista de usuarios.",
            error
        );
    }

    return [];
}

// Más abajo armo las filas con plantillas literales, así que todo lo que venga de los datos
// guardados tiene que pasar por aquí. Sin este escape, un nombre que contenga etiquetas se
// insertaría como marcado y se ejecutaría: es el riesgo de usar innerHTML en vez de textContent.
// Convierto el & primero a propósito, porque si lo hiciera al final volvería a escapar los
// "&lt;" que acabo de generar.
function escaparHtml(valor) {
    // El ?? deja en cadena vacía los campos que falten, para no escribir "null" en la tabla.
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {

    const tbody =
        document.getElementById("tabla-usuarios");

    const contador =
        document.getElementById("contador-usuarios");

    if (!tbody) {
        return;
    }

    // Dejo todo el pintado en una función para poder volver a llamarla desde los eventos de abajo
    // y reconstruir la tabla completa; repintar entera es más simple que calcular qué cambió.
    const renderizarUsuarios = () => {

        const usuarios =
            obtenerUsuariosAdmin();

        // Ajusto el plural según la cantidad para que no quede escrito "1 usuarios registrados",
        // que se lee como un descuido delante de quien revisa la pantalla.
        if (contador) {
            contador.textContent =
                `${usuarios.length} usuario${
                    usuarios.length === 1 ? "" : "s"
                } registrado${
                    usuarios.length === 1 ? "" : "s"
                }`;
        }

        // Con la lista vacía muestro una fila que lo explica, en vez de dejar la tabla en blanco:
        // así se distingue "no hay usuarios" de "la página no cargó".
        if (usuarios.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No hay usuarios registrados todavía.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = usuarios
            .map((usuario) => {

                // No guardo el nombre completo como campo: lo armo al mostrarlo juntando nombre y
                // apellidos. Si lo almacenara tendría el mismo dato dos veces y, al corregir uno
                // de los dos campos, el nombre completo quedaría desactualizado.
                // El filter(Boolean) saca los vacíos para que no aparezca un espacio sobrante.
                const nombreCompleto =
                    [
                        usuario.nombre,
                        usuario.apellidos
                    ]
                        .filter(Boolean)
                        .join(" ");

                // En la fila guardo el id del usuario en un data-user-id, y no la posición de la
                // fila: así el botón "Ver ficha" sigue apuntando a la persona correcta aunque la
                // tabla cambie de orden o se filtre más adelante.
                return `
                    <tr>

                        <td>
                            ${escaparHtml(usuario.id)}
                        </td>

                        <td>
                            ${escaparHtml(nombreCompleto)}
                        </td>

                        <td>
                            ${escaparHtml(usuario.correo)}
                        </td>

                        <td>
                            ${escaparHtml(
                                usuario.rol || "Paciente"
                            )}
                        </td>

                        <td>
                            <span class="stock-ok">
                                ${escaparHtml(
                                    usuario.estado || "Activo"
                                )}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="btn-table"
                                data-user-id="${escaparHtml(
                                    usuario.id
                                )}">
                                Ver ficha
                            </button>
                        </td>

                    </tr>
                `;
            })
            .join("");

        // Engancho los listeners después de escribir el innerHTML: los botones recién existen en
        // ese momento, porque al reemplazar el contenido el navegador descarta los anteriores
        // junto con sus eventos.
        tbody
            .querySelectorAll("[data-user-id]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        // Comparo los id convertidos a texto con String(): el data-* siempre llega
                        // como cadena, y un 3 numérico guardado no sería igual al "3" del atributo.
                        const usuario =
                            usuarios.find(
                                (item) =>
                                    String(item.id) ===
                                    String(
                                        button.dataset.userId
                                    )
                            );

                        if (!usuario) {
                            return;
                        }

                        // Muestro la ficha en un alert porque en esta entrega no había una página
                        // de detalle ni un modal: era la manera más breve de demostrar que la
                        // fila guarda todos los datos del usuario, no solo las columnas visibles.
                        alert(
                            `Ficha de usuario\n\n` +
                            `Nombre: ${
                                usuario.nombre
                            } ${
                                usuario.apellidos
                            }\n` +
                            `RUN: ${
                                usuario.run
                            }\n` +
                            `Correo: ${
                                usuario.correo
                            }\n` +
                            `Rol: ${
                                usuario.rol || "Paciente"
                            }\n` +
                            `Ubicación: ${
                                usuario.comuna
                            }, ${
                                usuario.region
                            }`
                        );
                    }
                );
            });
    };

    renderizarUsuarios();

    // Me suscribo a storage para enterarme si crean un usuario en otra pestaña.
    window.addEventListener(
        "storage",
        renderizarUsuarios
    );

    // Y a pageshow porque al volver con el botón "atrás" el navegador puede restaurar la página
    // desde su caché sin volver a ejecutar el script: sin esto, el listado se vería viejo.
    window.addEventListener(
        "pageshow",
        renderizarUsuarios
    );
});