import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarJSON, leerJSON } from "./persistencia";

// Limpio el almacenamiento y los dobles después de cada prueba. Si no lo hiciera, lo que
// escribe una se quedaría para la siguiente y las pruebas pasarían o fallarían según el orden
// en que corran, que es lo peor que le puede pasar a un conjunto de pruebas.
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// Estas dos funciones son la puerta por la que el navegador guarda y recupera datos. Las pruebo
// aparte porque lo que me importa no es el caso feliz, sino que no rompan la aplicación cuando
// el almacenamiento viene vacío, corrupto o bloqueado.
describe("leerJSON", () => {
  // Si la clave nunca se guardó, devuelvo el valor que me pasaron como alternativa en vez de
  // null, así quien llama puede recorrer el resultado sin preguntar si existe.
  it("devuelve el valor alternativo si la clave no existe", () => {
    expect(leerJSON("sin-clave", [])).toEqual([]);
  });

  // El caso normal: lo que guardé vuelve convertido en objeto, no en texto.
  it("interpreta JSON guardado", () => {
    localStorage.setItem("productos", JSON.stringify([{ id: "EV002" }]));
    expect(leerJSON("productos", [])).toEqual([{ id: "EV002" }]);
  });

  // Guardo una llave suelta, que es JSON inválido. Puede pasar si algo se interrumpió a medio
  // escribir. La función tiene que devolver la alternativa y no lanzar un error que deje la
  // pantalla en blanco.
  it("usa el valor alternativo ante texto malformado", () => {
    localStorage.setItem("carrito", "{");
    expect(leerJSON("carrito", [])).toEqual([]);
  });
});

describe("guardarJSON", () => {
  // Vigilo la llamada real al almacenamiento para confirmar dos cosas: que escribe con la clave
  // que le di, y que guarda el objeto ya convertido a texto.
  it("escribe la clave y el valor serializado", () => {
    const espia = vi.spyOn(Storage.prototype, "setItem");
    const productos = [{ id: "EV002", nombre: "Bioimpedanciometría" }];
    expect(guardarJSON("carrito", productos)).toBe(true);
    expect(espia).toHaveBeenCalledWith("carrito", JSON.stringify(productos));
  });

  // Simulo un navegador que no deja escribir, que es lo que pasa en modo incógnito o cuando el
  // espacio está lleno. No quiero que la aplicación se caiga: quiero que avise con un false y
  // siga funcionando sin guardar.
  it("devuelve false si el navegador no deja escribir", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Almacenamiento no disponible");
    });
    expect(guardarJSON("carrito", [])).toBe(false);
  });
});
