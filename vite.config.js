import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En la raíz del proyecto todavía están las páginas HTML de EP1 (login.html,
// contacto.html y las demás). En desarrollo Vite las serviría al pedir /login o
// /contacto y taparía las rutas de React Router, así que redirijo al index las
// direcciones que no apuntan a un archivo concreto. Las páginas antiguas siguen
// accesibles por su nombre completo, por ejemplo /login.html.
function rutasDeLaAplicacion() {
  return {
    name: "nutrivida-rutas-spa",
    configureServer(servidor) {
      servidor.middlewares.use((peticion, _respuesta, continuar) => {
        const ruta = (peticion.url ?? "/").split("?")[0];
        const esArchivo = ruta.includes(".");
        const esInterna = ruta.startsWith("/@") || ruta.startsWith("/src") || ruta.startsWith("/node_modules");
        if (!esArchivo && !esInterna) peticion.url = "/";
        continuar();
      });
    },
  };
}

// El navegador agrega el encabezado Origin con la dirección desde la que se abrió la página.
// Cuando esa dirección es la de un túnel, Spring Security la ve como un origen que no tiene
// autorizado y rechaza la petición con 403, aunque para la persona sea la misma página.
//
// Lo correcto no es abrir el CORS del backend a cualquier dominio, sino quitar ese encabezado
// aquí: una vez que el proxy reenvía la petición ya no es el navegador hablando con otro
// origen, es este servidor hablando con el microservicio, y eso no es una petición CORS.
// Así el backend conserva su política estricta y la demostración funciona igual.
function quitarEncabezadoOrigen(proxy) {
  proxy.on("proxyReq", (peticion) => {
    peticion.removeHeader("origin");
  });
}

export default defineConfig({
  plugins: [react(), rutasDeLaAplicacion()],

  // Configuración del servidor de vista previa, que es el que uso para demostrar el sistema
  // ya compilado. Cumple el mismo papel que Nginx en el servidor: una sola dirección entrega
  // la aplicación React y reparte las llamadas a cada microservicio según el prefijo.
  //
  // Lo necesito porque al exponer el sistema por un túnel solo queda abierta una puerta. Si
  // publicara únicamente React, sus llamadas a localhost:8081 apuntarían al computador de
  // quien abre la página, no al mío, y no encontrarían ningún backend.
  preview: {
    port: 4173,

    // Escucho en todas las interfaces de red y no solo en localhost. Sin esto, el servidor
    // sería visible únicamente desde este mismo equipo, y necesito que otro computador de la
    // misma red pueda abrir la página escribiendo mi dirección IP.
    host: true,

    // Vite rechaza las peticiones cuyo encabezado Host no reconoce. Al pasar por un túnel el
    // Host es el dominio público que genera el túnel, que no conozco de antemano, así que
    // acepto cualquiera. Es un servidor de demostración temporal en mi equipo, no un servidor
    // público permanente.
    allowedHosts: true,

    proxy: {
      // Estos dos prefijos son los mismos que usa la configuración de Nginx del backend,
      // y los mismos que tiene el archivo .env.production, así que el frontend compilado
      // funciona igual aquí que en un servidor, sin recompilarlo.
      "/api/auth-service": {
        target: "http://localhost:8081",
        changeOrigin: true,
        // Quito el prefijo público y dejo la ruta que el microservicio espera de verdad:
        // /api/auth-service/v1/auth/login llega como /api/v1/auth/login al puerto 8081.
        rewrite: (ruta) => ruta.replace(/^\/api\/auth-service/, "/api"),
        configure: quitarEncabezadoOrigen,
      },
      "/api/citas-service": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api\/citas-service/, "/api"),
        configure: quitarEncabezadoOrigen,
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.test.{js,jsx}",
        "src/**/*.spec.{js,jsx}",
        "src/test/**",
        "src/tests/**",
        "src/main.jsx",
      ],
    },
  },
});
