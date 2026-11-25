import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { PERFILES, dejarSesionAbierta, simularApi } from "./test/apiFalsa";


// Antes de cada prueba dejo el navegador como recién abierto: sin datos guardados, sin sesión
// y en la portada. Si no lo hiciera, lo que deja una prueba cambiaría el resultado de la
// siguiente y pasarían o fallarían según el orden en que corran.
beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("Aplicación NutriVida", () => {
  // La portada tiene que cargar con su encabezado: si esto falla, nada más vale la pena revisar.

  it("muestra el título principal de la clínica", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: "Cuida tu alimentación, mejora tu vida",
      }),
    ).toBeInTheDocument();
  });

  // Las tres tarjetas son la promesa de la clínica. Las busco por su encabezado, no por su posición.


  it("muestra las tres tarjetas de servicios de la portada", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Consulta nutricional" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Planes de alimentación" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seguimiento nutricional" })).toBeInTheDocument();
  });

  // El botón de guardar funciona como interruptor: el segundo clic deshace el primero.


  it("permite guardar y quitar un servicio", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Guardar servicio" })[0]);
    expect(screen.getByRole("button", { name: "Guardado ✓" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Guardado ✓" }));
    expect(screen.getAllByRole("button", { name: "Guardar servicio" })).toHaveLength(3);
  });

  // Compruebo que lo guardado quede de verdad en el navegador y no solo en la memoria de React.


  it("guarda el servicio mediante localStorage", async () => {
    const user = userEvent.setup();
    const espia = vi.spyOn(Storage.prototype, "setItem");
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Guardar servicio" })[0]);
    expect(espia).toHaveBeenCalledWith(
      "nutrivida-guardados",
      JSON.stringify(["Consulta nutricional"]),
    );
  });

  // Entro por la dirección directa, como quien pega un enlace, no haciendo clic en el menú.


  it("abre la vista de servicios mediante la ruta", () => {
    window.history.pushState({}, "", "/servicios");
    render(<App />);
    expect(screen.getByText("Conoce las opciones de atención nutricional que ofrecemos.")).toBeInTheDocument();
  });

  // Sin nada guardado todavía, el catálogo parte del listado que trae la aplicación.


  it("abre la tienda con los datos del catálogo original", () => {
    window.history.pushState({}, "", "/productos");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Tienda NutriVida" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
  });

  // Una dirección que no existe no puede dejar la pantalla en blanco: tiene que avisar.


  it("muestra una página 404 para una ruta desconocida", () => {
    window.history.pushState({}, "", "/ruta-inexistente");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
  });

  // La navegación usa enlaces de verdad, para que funcione el botón atrás del navegador.


  it("muestra enlaces de navegación internos", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Servicios" })).toHaveAttribute("href", "/servicios");
    expect(screen.getByRole("link", { name: "Tienda" })).toHaveAttribute("href", "/productos");
  });

  // El pie se monta una sola vez en App, así que basta comprobarlo aquí.


  it("muestra el pie de página de NutriVida", () => {
    render(<App />);
    expect(screen.getByText(/Tu bienestar comienza con buenos hábitos/)).toBeInTheDocument();
  });

  // Recorrido completo: desde el catálogo al detalle y del detalle al carrito.


  it("abre el detalle y permite agregar el servicio al carrito", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/productos/EV002");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar al carrito" }));
    await user.click(screen.getByRole("link", { name: /Carrito, 1 unidades/i }));
    expect(screen.getByRole("row", { name: /Bioimpedanciometría/ })).toBeInTheDocument();
  });
  it.each([
    ["/carrito", "Tu carrito"],
    ["/reserva", "Agendar una cita"],
    ["/contacto", "Contacto"],
    ["/login", "Iniciar sesión"],
    ["/registro", "Crear cuenta"],
  ])("renderiza la ruta %s", (ruta, encabezado) => {
    window.history.pushState({}, "", ruta);
    render(<App />);
    expect(screen.getByRole("heading", { name: encabezado })).toBeInTheDocument();
  });

  // Sin sesión, la ruta protegida manda al acceso en vez de mostrar el panel.


  it("envía al login cuando se entra a administración sin sesión", async () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  // Con el perfil correcto sí entra. Es el contrapeso de la prueba anterior.


  it("muestra administración cuando la sesión es de perfil administrador", async () => {
    simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN } });
    dejarSesionAbierta("ADMIN");
    window.history.pushState({}, "", "/admin");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Administración de productos" }),
    ).toBeInTheDocument();
  });

  // Con sesión válida pero rol equivocado, el frontend muestra permiso insuficiente.


  it("niega el panel de administración a un perfil paciente", async () => {
    simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.PACIENTE } });
    dejarSesionAbierta("PACIENTE");
    window.history.pushState({}, "", "/admin");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Sin permiso" })).toBeInTheDocument();
  });

  // Si lo guardado está corrupto, vuelvo al catálogo de la aplicación en vez de caerme.


  it("usa el catálogo original si la persistencia de productos no contiene una lista", () => {
    localStorage.setItem("nutrivida-productos", JSON.stringify({ datos: [] }));
    window.history.pushState({}, "", "/productos");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Bioimpedanciometría" })).toBeInTheDocument();
  });

  // Lo mismo con el carrito: un dato inválido lo deja vacío, no rompe la página.


  it("muestra el carrito vacío ante datos persistidos que no son una lista", () => {
    localStorage.setItem("carrito", JSON.stringify({ producto: "inválido" }));
    window.history.pushState({}, "", "/carrito");
    render(<App />);
    expect(screen.getByText("El carrito está vacío.")).toBeInTheDocument();
  });

  // Limpio lo que recupero: descarto las líneas sin sentido y arreglo las cantidades raras.


  it("descarta filas malformadas y normaliza cantidades al recuperar el carrito", () => {
    localStorage.setItem("carrito", JSON.stringify([
      null,
      { id: "MAL", nombre: "Fila inválida", precio: "sin precio", cantidad: 3 },
      { id: "OK", nombre: "Fila válida", precio: 10000, cantidad: 0 },
    ]));
    window.history.pushState({}, "", "/carrito");
    render(<App />);
    expect(screen.getByRole("row", { name: /Fila válida/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Fila válida/ })).toHaveTextContent("1");
    expect(screen.queryByText("Fila inválida")).not.toBeInTheDocument();
  });

  // Un código inventado en la dirección tiene que dar un aviso, no un error de la aplicación.


  it("muestra una alternativa para un código de producto inexistente", () => {
    window.history.pushState({}, "", "/productos/NO-EXISTE");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Servicio no encontrado" })).toBeInTheDocument();
  });

  // No todos los servicios traen foto, y la ficha tiene que abrirse igual.


  it("permite abrir el detalle de un servicio que no tiene imagen", () => {
    localStorage.setItem("nutrivida-productos", JSON.stringify([
      { id: "CUSTOM-1", nombre: "Servicio sin fotografía", categoria: "Consulta", descripcion: "Servicio de prueba.", precio: 5000, imagen: null },
    ]));
    window.history.pushState({}, "", "/productos/CUSTOM-1");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Servicio sin fotografía" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Imagen de Servicio sin fotografía" })).not.toBeInTheDocument();
  });

  // El panel crea y elimina en el catálogo local, y la lista se actualiza al tiro.


  it("integra el alta y la eliminación local desde administración", async () => {
    const user = userEvent.setup();
    simularApi({ "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN } });
    dejarSesionAbierta("ADMIN");
    window.history.pushState({}, "", "/admin");
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Catálogo local" }));
    await user.type(screen.getByLabelText("Nombre"), "Servicio de prueba integrado");
    await user.selectOptions(screen.getByLabelText("Categoría"), "Taller");
    await user.type(screen.getByLabelText("Precio en pesos chilenos"), "17000");
    await user.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(screen.getByRole("row", { name: /Servicio de prueba integrado/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar Servicio de prueba integrado" }));
    expect(screen.queryByRole("row", { name: /Servicio de prueba integrado/ })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("nutrivida-productos")).some(
      (producto) => producto.nombre === "Servicio de prueba integrado",
    )).toBe(false);
  });

  // Agregar dos veces el mismo servicio suma cantidad, y al llegar a cero la línea desaparece.


  it("incrementa el mismo producto y lo quita cuando la cantidad vuelve a cero", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/productos");
    render(<App />);
    const agregar = screen.getByRole("button", { name: "Agregar Bioimpedanciometría al carrito" });
    await user.click(agregar);
    await user.click(agregar);
    await user.click(screen.getByRole("link", { name: /Carrito, 2 unidades/i }));
    expect(screen.getByText(/Total:.*24\.000/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Bioimpedanciometría" }));
    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Bioimpedanciometría" }));
    expect(screen.getByText("El carrito está vacío.")).toBeInTheDocument();
  });

  // Aquí ya es el backend el que responde: según el rol que devuelve, la aplicación decide adónde ir.


  it("lleva al panel cuando el backend autentica un perfil administrador", async () => {
    const user = userEvent.setup();
    simularApi({
      "/auth/login": {
        estado: 200,
        cuerpo: { token: "token-admin", ...PERFILES.ADMIN },
      },
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.ADMIN },
    });
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "admin@nutrivida.cl");
    await user.type(screen.getByLabelText("Contraseña"), "Cambiar123!");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(
      await screen.findByRole("heading", { name: "Administración de productos" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("nutrivida_token")).toBe("token-admin");
  });

  // El mismo inicio de sesión con otro rol lleva a otra pantalla. Eso es la autorización en acción.


  it("lleva a la agenda cuando el backend autentica un perfil nutricionista", async () => {
    const user = userEvent.setup();
    simularApi({
      "/auth/login": {
        estado: 200,
        cuerpo: { token: "token-nutri", ...PERFILES.NUTRICIONISTA },
      },
      "/auth/perfil": { estado: 200, cuerpo: PERFILES.NUTRICIONISTA },
      "/citas/mias": { estado: 200, cuerpo: [] },
    });
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "carolina.fuentes@nutrivida.cl");
    await user.type(screen.getByLabelText("Contraseña"), "Cambiar123!");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(await screen.findByRole("heading", { name: "Agenda" })).toBeInTheDocument();
  });

  // Con dos servicios distintos, tocar uno no puede alterar al otro.


  it("conserva otro producto al incrementar uno y permite eliminar y vaciar el carrito", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nutrivida-productos", JSON.stringify([
      { id: "A", nombre: "Servicio A", categoria: "Consulta", descripcion: "Primero", precio: 5000, imagen: null },
      { id: "B", nombre: "Servicio B", categoria: "Consulta", descripcion: "Segundo", precio: 7000, imagen: null },
    ]));
    window.history.pushState({}, "", "/productos");
    render(<App />);

    const agregarA = screen.getByRole("button", { name: "Agregar Servicio A al carrito" });
    await user.click(agregarA);
    await user.click(screen.getByRole("button", { name: "Agregar Servicio B al carrito" }));
    await user.click(agregarA);
    await user.click(screen.getByRole("link", { name: /Carrito, 3 unidades/i }));

    expect(screen.getByRole("row", { name: /Servicio A/ })).toHaveTextContent("2");
    expect(screen.getByRole("row", { name: /Servicio B/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Agregar una unidad de Servicio A" }));
    expect(screen.getByRole("row", { name: /Servicio A/ })).toHaveTextContent("3");
    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Servicio A" }));
    expect(screen.getByRole("row", { name: /Servicio A/ })).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "Eliminar Servicio A" }));
    expect(screen.queryByRole("row", { name: /Servicio A/ })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Servicio B/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(screen.getByText("El carrito está vacío.")).toBeInTheDocument();
  });

  // Aunque lo guardado venga sucio, la portada carga limpia.


  it("recupera la portada sin servicios guardados malformados", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nutrivida-guardados", JSON.stringify({ servicio: "Consulta nutricional" }));
    render(<App />);
    expect(screen.getAllByRole("button", { name: "Guardar servicio" })).toHaveLength(3);
    await user.click(screen.getAllByRole("button", { name: "Guardar servicio" })[0]);
    expect(JSON.parse(localStorage.getItem("nutrivida-guardados"))).toEqual(["Consulta nutricional"]);
  });

  it.each([
    ["/reserva", ""],
    ["/reserva?servicio=CODIGO-INEXISTENTE", ""],
  ])("deja sin seleccionar un servicio si el parámetro no existe: %s", (ruta, valorEsperado) => {
    window.history.pushState({}, "", ruta);
    render(<App />);
    expect(screen.getByLabelText("Servicio")).toHaveValue(valorEsperado);
  });

  // La validación del formulario actúa antes de molestar al backend.


  it("muestra errores si la contraseña del acceso queda fuera del rango permitido", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "admin@duoc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "12");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(screen.getByText("La contraseña debe tener al menos 4 caracteres.")).toBeInTheDocument();
    expect(screen.queryByText(/Perfil detectado/)).not.toBeInTheDocument();
  });

  // Cuando el backend rechaza, muestro su mensaje tal cual y no uno inventado por el frontend.


  it("muestra el mensaje del backend cuando las credenciales no son válidas", async () => {
    const user = userEvent.setup();
    simularApi({
      "/auth/login": { estado: 401, cuerpo: { error: "Credenciales inválidas." } },
    });
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "admin@nutrivida.cl");
    await user.type(screen.getByLabelText("Contraseña"), "clave-incorrecta");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(await screen.findByText("Credenciales inválidas.")).toBeInTheDocument();
    expect(sessionStorage.getItem("nutrivida_token")).toBeNull();
  });

  // El formulario solo acepta los dominios acordados, y lo revisa antes de enviar.


  it("rechaza un correo no permitido en el acceso", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "1234");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(screen.getByText("Usa @duoc.cl, @profesor.duoc.cl, @gmail.com o @nutrivida.cl.")).toBeInTheDocument();
    expect(screen.queryByText(/Perfil detectado/)).not.toBeInTheDocument();
  });

  // El largo mínimo se comprueba en el navegador para avisar de inmediato.


  it("rechaza una contraseña demasiado corta durante el acceso", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");
    render(<App />);
    await user.type(screen.getByLabelText("Correo electrónico"), "admin@duoc.cl");
    await user.type(screen.getByLabelText("Contraseña"), "12");
    await user.click(screen.getByRole("button", { name: "Validar acceso" }));
    expect(screen.getByText("La contraseña debe tener al menos 4 caracteres.")).toBeInTheDocument();
  });

  // La misma regla al registrarse: lo que vale para entrar vale para crear la cuenta.


  it("rechaza una contraseña demasiado corta durante el registro", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/registro");
    render(<App />);
    await user.type(screen.getByLabelText("Nombre completo"), "Ana María");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@gmail.com");
    await user.type(screen.getByLabelText("Contraseña"), "12");
    await user.click(screen.getByRole("button", { name: "Validar registro" }));
    expect(screen.getByText("La contraseña debe tener al menos 4 caracteres.")).toBeInTheDocument();
  });

});
