import { useState } from "react";
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap";
import MapaClinica from "../components/MapaClinica";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import { validarCorreo, validarNombre, validarMotivoConsulta, validarTelefono } from "../utils/validaciones";

export default function Contacto() {
  // Manejo los cinco campos como un solo objeto de estado en vez de cinco useState sueltos: el
  // atributo name de cada input me dice cuál actualizar, y así agregar un campo no obliga a
  // escribir un estado y un manejador nuevos.
  const [datos, setDatos] = useState({ nombre: "", correo: "", telefono: "", asunto: "", mensaje: "" });
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function cambiar(evento) {
    const { name, value } = evento.target;
    // Uso la forma con función porque el estado nuevo depende del anterior; copiar el objeto con
    // el spread es obligatorio, ya que React solo detecta el cambio si la referencia es distinta.
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    // Borro el error del campo apenas lo tocan: dejarlo en rojo mientras la persona lo corrige
    // da la sensación de que el formulario no responde.
    setErrores((actuales) => ({ ...actuales, [name]: "" }));
    // Y quito la confirmación anterior, porque si se edita después de validar el mensaje de éxito
    // ya no corresponde a lo que está escrito en pantalla.
    setEnviado(false);
  }

  function enviar(evento) {
    // Evito la recarga del navegador: con React la vista se actualiza sola y una recarga perdería
    // el estado del formulario.
    evento.preventDefault();
    // Junto todos los errores en un objeto y recién después los muestro, en vez de cortar en el
    // primero: así la persona ve de una sola vez todo lo que debe corregir.
    const nuevos = {};
    if (!validarNombre(datos.nombre)) nuevos.nombre = "Ingresa un nombre válido.";
    if (!validarCorreo(datos.correo)) nuevos.correo = "Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    if (!validarTelefono(datos.telefono)) nuevos.telefono = "Ingresa un teléfono válido.";
    if (datos.asunto.trim().length < 3) nuevos.asunto = "El asunto debe tener al menos 3 caracteres.";
    if (!validarMotivoConsulta(datos.mensaje)) nuevos.mensaje = "Escribe un mensaje de al menos 10 caracteres.";
    // Reutilizo las funciones de utils/validaciones para que el contacto exija exactamente lo
    // mismo que la reserva y el registro, y no existan dos reglas distintas para un mismo dato.
    setErrores(nuevos);
    // Doy por válido el formulario solo si el objeto de errores quedó vacío.
    setEnviado(Object.keys(nuevos).length === 0);
  }

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="ESTAMOS PARA AYUDARTE"
        titulo="Contacto"
        descripcion="Escríbenos o visítanos en nuestra consulta de Temuco."
      />
      <p className="small text-secondary">Formulario de demostración: no ingreses información sensible; no hay envío a un servidor.</p>
      {/* El aviso lleva role="status" para que el lector de pantalla lo anuncie cuando aparece:
          si no, quien no ve la pantalla no se enteraría de que la validación resultó bien. */}
      {enviado ? <Alert variant="success" role="status">Formulario validado. En esta versión no se envían mensajes a un servidor.</Alert> : null}
      <Row className="g-4">
      <Col lg={7}>
      {/* Pongo noValidate para desactivar los mensajes propios del navegador y mostrar los míos:
          los del navegador salen en su idioma y no puedo redactarlos ni darles estilo. */}
      <Form onSubmit={enviar} noValidate className="nv-form" aria-label="Formulario de contacto">
        {/* El controlId enlaza la etiqueta con el campo, así que al hacer clic en "Nombre" el
            foco va al input. El aria-describedby lo pongo solo cuando hay error, para no apuntar
            a un elemento vacío, y el maxLength corta el largo antes de que haya que validarlo. */}
        <Form.Group className="mb-3" controlId="contacto-nombre">
          <Form.Label>Nombre</Form.Label>
          <Form.Control autoComplete="name" maxLength={50} name="nombre" value={datos.nombre} onChange={cambiar} isInvalid={Boolean(errores.nombre)} aria-describedby={errores.nombre ? "error-contacto-nombre" : undefined} />
          <Form.Control.Feedback id="error-contacto-nombre" type="invalid">{errores.nombre}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="contacto-correo">
          <Form.Label>Correo electrónico</Form.Label>
          <Form.Control autoComplete="email" type="email" maxLength={100} name="correo" value={datos.correo} onChange={cambiar} isInvalid={Boolean(errores.correo)} aria-describedby={errores.correo ? "error-contacto-correo" : undefined} />
          <Form.Control.Feedback id="error-contacto-correo" type="invalid">{errores.correo}</Form.Control.Feedback>
        </Form.Group>
        {/* Uso type="tel" y autoComplete="tel" para que en el celular salga el teclado numérico y
            el navegador pueda ofrecer el dato que ya tiene guardado. */}
        <Form.Group className="mb-3" controlId="contacto-telefono">
          <Form.Label>Teléfono</Form.Label>
          <Form.Control autoComplete="tel" type="tel" maxLength={16} name="telefono" placeholder="+56 9 1234 5678" value={datos.telefono} onChange={cambiar} isInvalid={Boolean(errores.telefono)} aria-describedby={errores.telefono ? "error-contacto-telefono" : undefined} />
          <Form.Control.Feedback id="error-contacto-telefono" type="invalid">{errores.telefono}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="contacto-asunto">
          <Form.Label>Asunto</Form.Label>
          <Form.Control maxLength={100} name="asunto" value={datos.asunto} onChange={cambiar} isInvalid={Boolean(errores.asunto)} aria-describedby={errores.asunto ? "error-contacto-asunto" : undefined} />
          <Form.Control.Feedback id="error-contacto-asunto" type="invalid">{errores.asunto}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3" controlId="contacto-mensaje">
          <Form.Label>Mensaje</Form.Label>
          <Form.Control as="textarea" rows={4} maxLength={1000} minLength={10} name="mensaje" value={datos.mensaje} onChange={cambiar} isInvalid={Boolean(errores.mensaje)} aria-describedby={errores.mensaje ? "error-contacto-mensaje" : undefined} />
          <Form.Control.Feedback id="error-contacto-mensaje" type="invalid">{errores.mensaje}</Form.Control.Feedback>
        </Form.Group>
        <Button type="submit" variant="success">Validar mensaje</Button>
      </Form>
      </Col>
      {/* Mapa interactivo con la ubicación real de la clínica en Temuco. */}
      <Col lg={5}>
        <section className="nv-mapa-panel" aria-label="Ubicación de la clínica">
          <h2 className="h4">Dónde encontrarnos</h2>
          <p className="mb-2">Clínica NutriVida · Temuco, Región de La Araucanía.</p>
          <MapaClinica />
          <p className="small text-secondary mt-2">
            Atención de lunes a sábado según la agenda de cada profesional.
          </p>
        </section>
      </Col>
      </Row>
    </Container>
  );
}
