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

export default defineConfig({
  plugins: [react(), rutasDeLaAplicacion()],
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
