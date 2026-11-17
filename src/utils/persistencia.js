// Concentro aquí todo el acceso a localStorage para que ninguna vista hable directo con el
// navegador. La razón es que localStorage falla de varias maneras: puede estar deshabilitado, en
// modo privado, lleno, o contener texto que ya no es JSON válido. Si cada componente lo leyera
// por su cuenta tendría que repetir el try en todas partes, y bastaría con olvidarlo una vez
// para dejar la aplicación caída por un dato guardado viejo.

// Devuelvo la alternativa tanto si la clave no existe como si lo guardado está corrupto: para
// quien llama, los dos casos significan lo mismo, que no hay dato utilizable.
export function leerJSON(clave, alternativa) {
  try {
    const valorGuardado = localStorage.getItem(clave);
    // Comparo con null explícitamente, porque un false o un 0 guardados son datos válidos y con
    // una comprobación suelta de "si no hay valor" los descartaría por error.
    return valorGuardado === null ? alternativa : JSON.parse(valorGuardado);
  } catch {
    return alternativa;
  }
}

// Devuelvo true o false en vez de lanzar: así quien guarda puede avisar que no se pudo, y no se
// cae la vista completa por una escritura que el navegador rechazó por falta de espacio.
export function guardarJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
