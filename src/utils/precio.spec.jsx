import { describe, expect, it } from "vitest";
import { formatearPrecio } from "./precio";

// Pruebo la función que convierte un número en el precio que ve la persona. La aíslo porque
// aparece en todo el catálogo: si se equivoca, el error se repite en cada tarjeta.
describe("formatearPrecio", () => {
  // El cero no es un precio, es una atención sin costo, y así tiene que leerse.
  it("representa el precio cero como Gratis", () => {
    expect(formatearPrecio(0)).toBe("Gratis");
  });

  // Compruebo el separador de miles chileno: 15000 se muestra como 15.000, con punto.
  it("formatea un importe positivo en pesos chilenos", () => {
    expect(formatearPrecio(15000)).toContain("15.000");
  });

  // Un precio negativo solo puede venir de un dato mal cargado, así que no lo muestro.
  it("rechaza valores negativos", () => {
    expect(formatearPrecio(-1)).toBe("Precio no disponible");
  });

  // Y si llega texto en vez de número, prefiero avisar antes que mostrar NaN en pantalla.
  it("rechaza textos que no representan números finitos", () => {
    expect(formatearPrecio("sin precio")).toBe("Precio no disponible");
  });
});
