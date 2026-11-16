# Clínica NutriVida · Evaluación Parcial 2

Frontend de Clínica NutriVida para DSY1104 Desarrollo FullStack II. La EP2 amplía el proyecto existente con React/Vite, conservando la identidad, los recursos y el catálogo del trabajo anterior.

## Cómo ejecutar

Requisitos: Node.js compatible con Vite 7 (se recomienda Node 22), npm y Git.

```bash
git clone https://github.com/mrg722/ClinicaNutriVidaEP2.git
cd ClinicaNutriVidaEP2
npm ci
npm run dev
```

Abre la dirección local que indique Vite. Para probar la aplicación React no uses Live Server: el punto de entrada es `index.html` + `src/main.jsx`. Las páginas HTML de EP1 permanecen en el repositorio.

## Conexión con los microservicios

Esta versión consume los dos microservicios Spring Boot del proyecto:
`nutrivida-auth` en el puerto 8081 y `nutrivida-citas` en el 8082. Las
direcciones se configuran con variables de entorno de Vite y ya vienen
preparadas en `.env.development`; `.env.example` sirve de plantilla y
`.env.production` usa rutas relativas para el proxy inverso de Nginx.

```bash
VITE_AUTH_API_URL=http://localhost:8081/api/v1
VITE_CITAS_API_URL=http://localhost:8082/api/v1
```

Sin los servicios en marcha el sitio público sigue funcionando con el catálogo
local, pero el acceso, la agenda y el panel muestran el error de conexión.
El detalle de la integración está en
[documentacion/INTEGRACION_EP3.md](documentacion/INTEGRACION_EP3.md).

## Comandos de comprobación

```bash
npm run test:run
npm run test:integrante-1
npm run test:integrante-2
npm run test:integrante-3
npm run coverage
npm run build
npm run preview
```

- `test:integrante-1`: catálogo, props, precios y filtros.
- `test:integrante-2`: carrito, cantidades, subtotal/total y callbacks.
- `test:integrante-3`: reserva, contacto, registro y administración.
- `src/tests/integracion.sesion.spec.jsx`: cliente HTTP, sesión persistente y
  restricción de rutas por rol.
- `src/tests/integracion.vistas.spec.jsx`: vistas conectadas a los
  microservicios de citas y mediciones.
- `coverage`: crea el reporte en `coverage/index.html`.
- `build` y `preview`: permiten revisar localmente el resultado de producción. Preview no es un despliegue público.

## Verificación automatizada más reciente

La [ejecución de GitHub Actions #38815259946](https://github.com/mrg722/ClinicaNutriVidaEP2/actions/runs/38815259946), sobre el commit de código `7e94488fc84861e83d7f84f3573a6d3a572a75f9`, terminó correctamente:
- 7/7 archivos de prueba aprobados.
- 81/81 casos aprobados.
- Cobertura V8: Statements 100 %, Branches 100 %, Functions 100 % y Lines 100 % en el alcance configurado.
- Build de producción exitoso.

La cobertura corresponde al código incluido en la configuración V8; no sustituye la revisión visual/manual ni la presentación individual.

### Medición local tras la integración con el backend

Con la conexión a los microservicios la suite pasa a 8 archivos y 102 casos,
todos aprobados, y `npm run build` termina sin errores. La cobertura V8 baja a
80,36 % de sentencias y 81,20 % de ramas porque las vistas nuevas (agenda,
ficha clínica y panel de administración) suman mucho código de interfaz que las
pruebas recorren solo en parte. Las pruebas de integración cubren el cliente
HTTP, la revalidación de la sesión, la restricción por rol y las llamadas
principales a cada microservicio.

## Funcionalidades React

- Inicio y servicios de NutriVida.
- Catálogo desde los seis códigos/precios que ya constaban en `assets/js/detalle-producto.js`.
- Búsqueda, filtro y detalle por código.
- Carrito con cantidades, total y persistencia local.
- Formularios controlados de reserva y contacto.
- Acceso y registro reales contra el microservicio de autenticación, con token
  JWT en `sessionStorage` y revalidación del perfil al recargar la página.
- Rutas restringidas por rol: citas y progreso del paciente, agenda y ficha
  clínica del profesional, y panel de administración con usuarios, catálogo de
  servicios y estadísticas.
- Mapa interactivo de la consulta de Temuco con Leaflet en la página de contacto.
- Ruta 404 y navegación interna con React Router.

## Estructura principal

- `src/components/`: navegación, tarjeta de producto y pie de página.
- `src/pages/`: vistas.
- `src/data/productos.js`: productos originales convertidos a objetos.
- `src/utils/`: precio, persistencia y validaciones.
- `src/tests/`: diez pruebas individuales por integrante.
- `documentacion/guias/`: adaptaciones punto por punto de las Guías 9–14.
- `documentacion/RUBRICA_EP2_TRAZABILIDAD.md`: rúbrica oficial y evidencia de cada indicador.
- `documentacion/ERS_EP2_NutriVida.md`: especificación de esta versión.
- `documentacion/Informe_Cobertura_Testing_EP2.md`: alcance y resultados de pruebas.
- `deploy/nginx-nutrivida.conf`: configuración base Nginx para la SPA.

## Alcance real y límites

El carrito, los servicios guardados y el catálogo local del panel se guardan en
el navegador; no hay procesamiento de pagos. El formulario de contacto valida
datos en pantalla y no envía información a un servidor. La reserva, las citas,
las mediciones y la administración sí trabajan contra los microservicios. La
restricción de rutas por rol en el frontend mejora la navegación: la seguridad
real la aplica el backend en cada endpoint. No uses contraseñas ni datos
médicos reales.

La configuración Nginx no significa que la web ya esté publicada en EC2. Se necesita una instancia y acceso reales, además de verificar la URL pública y la recarga de las rutas.

## Guías, rúbrica y entrega

Empieza por [el índice de Guías 9–14 y rúbrica](documentacion/GUIAS_9_14_Y_RUBRICA.md). La [matriz de rúbrica](documentacion/RUBRICA_EP2_TRAZABILIDAD.md) separa el trabajo implementado de las comprobaciones que exigen evidencia manual.

La Guía 13 del curso declara que fue autorizado reemplazar Jasmine/Karma por Vitest; el PDF de la rúbrica aún nombra Jasmine/Karma. Conviene confirmar esa equivalencia con el docente antes de la presentación.

Los documentos Markdown quedan como referencia actualizada del código y contienen la última medición de CI. Los DOCX requeridos por la pauta existen en el repositorio, pero todavía deben regenerarse/revisarse con estos resultados antes de entregar. Para generar el ZIP desde un commit confirmado en Git:

```powershell
git archive --format=zip --output=NutriVida-EP2.zip HEAD
```

Abre el ZIP y comprueba su contenido antes de entregarlo.

## Integrantes registrados en el trabajo de EP1

Martin Reyes · Martin Lara · Diego Adan
