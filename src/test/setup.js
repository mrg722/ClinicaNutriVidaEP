import "@testing-library/jest-dom/vitest";

// Node 26 define sus propios globales localStorage y sessionStorage, que quedan
// indefinidos y evitan que jsdom instale los suyos. Para que las pruebas sigan
// usando almacenamiento web, implemento aquí un almacén en memoria sobre
// Storage.prototype, de modo que los espías de vi.spyOn(Storage.prototype, ...)
// sigan interceptando las llamadas igual que en un navegador real.
const almacenes = new WeakMap();

function datos(instancia) {
  if (!almacenes.has(instancia)) almacenes.set(instancia, new Map());
  return almacenes.get(instancia);
}

Object.defineProperties(Storage.prototype, {
  length: { configurable: true, get() { return datos(this).size; } },
  key: { configurable: true, writable: true, value(indice) {
    return [...datos(this).keys()][indice] ?? null;
  } },
  getItem: { configurable: true, writable: true, value(clave) {
    const valor = datos(this).get(String(clave));
    return valor === undefined ? null : valor;
  } },
  setItem: { configurable: true, writable: true, value(clave, valor) {
    datos(this).set(String(clave), String(valor));
  } },
  removeItem: { configurable: true, writable: true, value(clave) {
    datos(this).delete(String(clave));
  } },
  clear: { configurable: true, writable: true, value() { datos(this).clear(); } },
});

// Expongo una instancia por tipo de almacenamiento, tanto en window como en el
// objeto global, porque el código de la aplicación usa ambos nombres.
for (const clave of ["localStorage", "sessionStorage"]) {
  const instancia = Object.create(Storage.prototype);
  const definicion = { configurable: true, get: () => instancia };
  Object.defineProperty(globalThis, clave, definicion);
  if (window !== globalThis) Object.defineProperty(window, clave, definicion);
}
