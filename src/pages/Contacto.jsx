import { useState } from "react";
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap";
import MapaClinica from "../components/MapaClinica";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import { validarCorreo, validarNombre, validarMotivoConsulta, validarTelefono } from "../utils/validaciones";

export default function Contacto() {
  const [datos, setDatos] = useState({ nombre: "", correo: "", telefono: "", asunto: "", mensaje: "" });
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "" }));
    setEnviado(false);
  }

  function enviar(evento) {
    evento.preventDefault();
    const nuevos = {};
    if (!validarNombre(datos.nombre)) nuevos.nombre = "Ingresa un nombre válido.";
    if (!validarCorreo(datos.correo)) nuevos.correo = "Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    if (!validarTelefono(datos.telefono)) nuevos.telefono = "Ingresa un teléfono válido.";
    if (datos.asunto.trim().length < 3) nuevos.asunto = "El asunto debe tener al menos 3 caracteres.";
    if (!validarMotivoConsulta(datos.mensaje)) nuevos.mensaje = "Escribe un mensaje de al menos 10 caracteres.";
    setErrores(nuevos);
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
      {enviado ? <Alert variant="success" role="status">Formulario validado. En esta versión no se envían mensajes a un servidor.</Alert> : null}
      <Row className="g-4">
      <Col lg={7}>
      <Form onSubmit={enviar} noValidate className="nv-form" aria-label="Formulario de contacto">
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
