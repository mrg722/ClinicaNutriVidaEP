import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Container, Form, Nav, Row, Table } from "react-bootstrap";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import DialogoConfirmacion from "../components/ui/DialogoConfirmacion";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import EstadoVacio from "../components/ui/EstadoVacio";
import TarjetaIndicador from "../components/ui/TarjetaIndicador";
import { useSesion } from "../context/SesionContext";
import * as usuarioService from "../services/usuarioService";
import * as servicioService from "../services/servicioService";
import { obtener as obtenerEstadisticas } from "../services/estadisticaService";
import { etiquetaEstado } from "../utils/citas";
import { formatearPrecio } from "../utils/precio";

const ROLES = ["ADMIN", "NUTRICIONISTA", "PACIENTE"];
const TIPOS_SERVICIO = ["Consulta", "Plan especializado", "Evaluación", "Taller grupal"];

const USUARIO_VACIO = { nombre: "", correo: "", password: "", rol: "PACIENTE", activo: true };
const SERVICIO_VACIO = {
  codigo: "",
  tipo: "Consulta",
  nombre: "",
  duracionMinutos: "",
  modalidad: "Presencial",
  precio: "",
  descripcion: "",
  activo: true,
};
const PRODUCTO_LOCAL_VACIO = { nombre: "", categoria: "", descripcion: "", precio: "" };

// Panel del administrador con tres secciones: cuentas de usuario, catálogo de
// servicios y estadísticas de la clínica. Mantengo además el catálogo local de
// la tienda, que ya existía en la versión anterior del proyecto.
export default function Administracion({ productos, onCrearProducto, onEliminarProducto }) {
  const { token } = useSesion();
  const [seccion, setSeccion] = useState("usuarios");

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="PANEL DE GESTIÓN"
        titulo="Administración de productos"
        descripcion="Gestiona las cuentas, el catálogo de servicios y revisa los indicadores de la clínica."
      />

      {/* Navegación interna por pestañas para no mezclar todo en una pantalla. Guardo la pestaña
          activa en el estado y monto solo la sección elegida: así cada sección pide sus datos al
          backend recién cuando se abre, en vez de disparar cuatro consultas al entrar al panel. */}
      <Nav variant="tabs" className="nv-pestanas mb-4" activeKey={seccion} onSelect={(clave) => setSeccion(clave ?? "usuarios")}>
        <Nav.Item><Nav.Link eventKey="usuarios">Usuarios</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="servicios">Catálogo de servicios</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="estadisticas">Estadísticas</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="tienda">Catálogo local</Nav.Link></Nav.Item>
      </Nav>

      {seccion === "usuarios" ? <SeccionUsuarios token={token} /> : null}
      {seccion === "servicios" ? <SeccionServicios token={token} /> : null}
      {seccion === "estadisticas" ? <SeccionEstadisticas token={token} /> : null}
      {seccion === "tienda" ? (
        <SeccionTiendaLocal
          productos={productos}
          onCrearProducto={onCrearProducto}
          onEliminarProducto={onEliminarProducto}
        />
      ) : null}
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Usuarios: alta, edición del rol, desactivación y eliminación.
// ---------------------------------------------------------------------------
function SeccionUsuarios({ token }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [formulario, setFormulario] = useState(USUARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    usuarioService
      .listar(token, filtroRol)
      .then((lista) => setUsuarios(Array.isArray(lista) ? lista : []))
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token, filtroRol]);

  useEffect(cargar, [cargar]);

  function cambiar(evento) {
    const { name, value, type, checked } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevos = {};
    if (!formulario.nombre.trim()) nuevos.nombre = "El nombre es obligatorio.";
    if (!formulario.correo.trim()) nuevos.correo = "El correo es obligatorio.";
    // Al crear la contraseña es obligatoria; al editar puede quedar vacía y el
    // backend conserva la anterior.
    if (!editando && formulario.password.length < 4) {
      nuevos.password = "La contraseña debe tener al menos 4 caracteres.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Estas comprobaciones son solo para no gastar una llamada que ya sé que va a fallar. La
    // validación que manda es la del backend: él revisa el correo duplicado y el rol permitido,
    // porque es el único que ve todas las cuentas y el único al que no se le puede dar la vuelta.
    const cuerpo = {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim().toLowerCase(),
      password: formulario.password,
      rol: formulario.rol,
      activo: formulario.activo,
    };

    setEnviando(true);
    try {
      if (editando) {
        await usuarioService.actualizar(token, editando.id, cuerpo);
        setAviso(`Actualizamos la cuenta de ${cuerpo.correo}.`);
      } else {
        await usuarioService.crear(token, cuerpo);
        setAviso(`Creamos la cuenta de ${cuerpo.correo}.`);
      }
      setFormulario(USUARIO_VACIO);
      setEditando(null);
      cargar();
      // Recargo la lista desde el servidor en vez de insertar la fila a mano: así la tabla
      // muestra lo que realmente quedó guardado, incluido el id que asignó la base de datos.
    } catch (problema) {
      // Muestro el mensaje que viene del backend, no uno inventado por mí: él sabe si el correo
      // estaba repetido o si el rol no existe, y ese detalle es lo que le sirve a quien gestiona.
      setErrores({ formulario: problema.message });
    } finally {
      // Libero el botón en finally para que no quede bloqueado si la llamada terminó con error.
      setEnviando(false);
    }
  }

  function editar(usuario) {
    setEditando(usuario);
    setErrores({});
    setAviso("");
    // Dejo la contraseña en blanco al cargar el formulario: el backend nunca devuelve la clave,
    // y enviarla vacía es justamente la señal de que quiero conservar la que ya estaba.
    setFormulario({ ...usuario, password: "" });
  }

  // Desactivar una cuenta es la forma suave de quitarle el acceso: el login
  // responde 401 a las cuentas desactivadas.
  async function alternarActivo(usuario) {
    try {
      await usuarioService.actualizar(token, usuario.id, {
        nombre: usuario.nombre,
        correo: usuario.correo,
        password: "",
        rol: usuario.rol,
        activo: !usuario.activo,
      });
      setAviso(`${usuario.correo} quedó ${usuario.activo ? "desactivada" : "activa"}.`);
      cargar();
    } catch (problema) {
      setError(problema.message);
    }
  }

  async function confirmarEliminacion() {
    const usuario = porEliminar;
    setPorEliminar(null);
    try {
      await usuarioService.eliminar(token, usuario.id);
      setAviso(`Eliminamos la cuenta de ${usuario.correo}.`);
      cargar();
    } catch (problema) {
      setError(problema.message);
    }
  }

  return (
    <section>
      <h2 className="h4">Cuentas de usuario</h2>
      <div aria-live="polite">{aviso ? <Alert variant="success">{aviso}</Alert> : null}</div>
      <BloqueError mensaje={error} onReintentar={cargar} />

      <Form.Group className="mb-3 nv-filtro" controlId="usuarios-filtro">
        <Form.Label>Filtrar por rol</Form.Label>
        <Form.Select value={filtroRol} onChange={(evento) => setFiltroRol(evento.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
        </Form.Select>
      </Form.Group>

      {cargando ? (
        <CargaEsqueleto filas={4} etiqueta="Cargando usuarios…" />
      ) : usuarios.length === 0 ? (
        <EstadoVacio titulo="No hay cuentas con ese filtro." />
      ) : (
        <div className="table-responsive nv-tabla">
          <Table hover>
            <caption>Cuentas registradas en el servicio de autenticación</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <th scope="row">{usuario.nombre}</th>
                  <td>{usuario.correo}</td>
                  <td>{usuario.rol}</td>
                  <td>{usuario.activo ? "Activa" : "Desactivada"}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Button size="sm" variant="outline-success" onClick={() => editar(usuario)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => alternarActivo(usuario)}>
                        {usuario.activo ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setPorEliminar(usuario)}
                        aria-label={`Eliminar cuenta de ${usuario.correo}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <section className="nv-form-panel mt-4">
        <h3 className="h5">{editando ? `Editar ${editando.correo}` : "Crear una cuenta"}</h3>
        <BloqueError mensaje={errores.formulario} />
        <Form onSubmit={enviar} noValidate aria-label="Formulario de usuario">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="usuario-nombre">
                <Form.Label>Nombre de la persona</Form.Label>
                <Form.Control name="nombre" value={formulario.nombre} onChange={cambiar} isInvalid={Boolean(errores.nombre)} />
                <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="usuario-correo">
                <Form.Label>Correo de la cuenta</Form.Label>
                <Form.Control type="email" name="correo" value={formulario.correo} onChange={cambiar} isInvalid={Boolean(errores.correo)} />
                <Form.Control.Feedback type="invalid">{errores.correo}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="usuario-password">
                <Form.Label>
                  {editando ? "Contraseña nueva (opcional)" : "Contraseña"}
                </Form.Label>
                <Form.Control type="password" name="password" value={formulario.password} onChange={cambiar} isInvalid={Boolean(errores.password)} />
                <Form.Control.Feedback type="invalid">{errores.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="usuario-rol">
                <Form.Label>Rol asignado</Form.Label>
                <Form.Select name="rol" value={formulario.rol} onChange={cambiar}>
                  {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Check
            className="my-3"
            type="switch"
            id="usuario-activo"
            name="activo"
            checked={formulario.activo}
            onChange={cambiar}
            label="Cuenta activa"
          />
          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" variant="success" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear cuenta"}
            </Button>
            {editando ? (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setEditando(null);
                  setFormulario(USUARIO_VACIO);
                }}
              >
                Cancelar edición
              </Button>
            ) : null}
          </div>
        </Form>
      </section>

      <DialogoConfirmacion
        visible={Boolean(porEliminar)}
        titulo="Eliminar la cuenta"
        mensaje={porEliminar ? `¿Confirmas eliminar la cuenta de ${porEliminar.correo}? Esta acción no se puede deshacer.` : ""}
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminacion}
        onCerrar={() => setPorEliminar(null)}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Catálogo de servicios real, el mismo que consume la tienda.
// ---------------------------------------------------------------------------
function SeccionServicios({ token }) {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formulario, setFormulario] = useState(SERVICIO_VACIO);
  const [errores, setErrores] = useState({});
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    servicioService
      .listar(token)
      .then((lista) => setServicios(Array.isArray(lista) ? lista : []))
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  function cambiar(evento) {
    const { name, value, type, checked } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value }));
    setErrores((actuales) => ({ ...actuales, [name]: "", formulario: "" }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const nuevos = {};
    if (!formulario.codigo.trim()) nuevos.codigo = "El código es obligatorio.";
    if (!formulario.nombre.trim()) nuevos.nombre = "El nombre es obligatorio.";
    if (formulario.precio === "" || Number(formulario.precio) < 0) {
      nuevos.precio = "Ingresa un precio igual o mayor que cero.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Los planes mensuales no tienen duración, así que ese campo puede ir nulo.
    const cuerpo = {
      codigo: formulario.codigo.trim().toUpperCase(),
      tipo: formulario.tipo,
      nombre: formulario.nombre.trim(),
      duracionMinutos: formulario.duracionMinutos === "" ? null : Number(formulario.duracionMinutos),
      modalidad: formulario.modalidad,
      precio: Number(formulario.precio),
      descripcion: formulario.descripcion.trim(),
      activo: formulario.activo,
    };

    setEnviando(true);
    try {
      if (editando) {
        await servicioService.actualizar(token, editando.id, cuerpo);
        setAviso(`Actualizamos el servicio ${cuerpo.codigo}.`);
      } else {
        await servicioService.crear(token, cuerpo);
        setAviso(`Creamos el servicio ${cuerpo.codigo}.`);
      }
      setFormulario(SERVICIO_VACIO);
      setEditando(null);
      cargar();
    } catch (problema) {
      setErrores({ formulario: problema.message });
    } finally {
      setEnviando(false);
    }
  }

  function editar(servicio) {
    setEditando(servicio);
    setErrores({});
    setAviso("");
    setFormulario({
      codigo: servicio.codigo ?? "",
      tipo: servicio.tipo ?? "Consulta",
      nombre: servicio.nombre ?? "",
      duracionMinutos: servicio.duracionMinutos === null || servicio.duracionMinutos === undefined ? "" : String(servicio.duracionMinutos),
      modalidad: servicio.modalidad ?? "Presencial",
      precio: String(servicio.precio ?? ""),
      descripcion: servicio.descripcion ?? "",
      activo: Boolean(servicio.activo),
    });
  }

  async function confirmarEliminacion() {
    const servicio = porEliminar;
    setPorEliminar(null);
    try {
      await servicioService.eliminar(token, servicio.id);
      setAviso(`Eliminamos el servicio ${servicio.codigo}.`);
      cargar();
    } catch (problema) {
      setError(problema.message);
    }
  }

  return (
    <section>
      <h2 className="h4">Catálogo de servicios</h2>
      <div aria-live="polite">{aviso ? <Alert variant="success">{aviso}</Alert> : null}</div>
      <BloqueError mensaje={error} onReintentar={cargar} />

      {cargando ? (
        <CargaEsqueleto filas={5} etiqueta="Cargando servicios…" />
      ) : servicios.length === 0 ? (
        <EstadoVacio titulo="El catálogo está vacío." mensaje="Crea el primer servicio con el formulario." />
      ) : (
        <div className="table-responsive nv-tabla">
          <Table hover>
            <caption>Servicios publicados en el microservicio de citas</caption>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Servicio</th>
                <th scope="col">Tipo</th>
                <th scope="col">Precio</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id}>
                  <td>{servicio.codigo}</td>
                  <th scope="row">{servicio.nombre}</th>
                  <td>{servicio.tipo}</td>
                  <td>{formatearPrecio(servicio.precio)}</td>
                  <td>{servicio.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Button size="sm" variant="outline-success" onClick={() => editar(servicio)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setPorEliminar(servicio)}
                        aria-label={`Eliminar servicio ${servicio.codigo}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <section className="nv-form-panel mt-4">
        <h3 className="h5">{editando ? `Editar ${editando.codigo}` : "Crear un servicio"}</h3>
        <BloqueError mensaje={errores.formulario} />
        <Form onSubmit={enviar} noValidate aria-label="Formulario de servicio">
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="servicio-codigo">
                <Form.Label>Código del servicio</Form.Label>
                <Form.Control name="codigo" value={formulario.codigo} onChange={cambiar} isInvalid={Boolean(errores.codigo)} />
                <Form.Control.Feedback type="invalid">{errores.codigo}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="servicio-nombre">
                <Form.Label>Nombre del servicio</Form.Label>
                <Form.Control name="nombre" value={formulario.nombre} onChange={cambiar} isInvalid={Boolean(errores.nombre)} />
                <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="servicio-tipo">
                <Form.Label>Tipo de prestación</Form.Label>
                <Form.Select name="tipo" value={formulario.tipo} onChange={cambiar}>
                  {TIPOS_SERVICIO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="servicio-duracion">
                <Form.Label>Duración en minutos (opcional)</Form.Label>
                <Form.Control type="number" min="0" name="duracionMinutos" value={formulario.duracionMinutos} onChange={cambiar} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="servicio-precio">
                <Form.Label>Precio del servicio</Form.Label>
                <Form.Control type="number" min="0" step="1" name="precio" value={formulario.precio} onChange={cambiar} isInvalid={Boolean(errores.precio)} />
                <Form.Control.Feedback type="invalid">{errores.precio}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="servicio-modalidad">
                <Form.Label>Modalidad de atención</Form.Label>
                <Form.Select name="modalidad" value={formulario.modalidad} onChange={cambiar}>
                  <option value="Presencial">Presencial</option>
                  <option value="Telemedicina">Telemedicina</option>
                  <option value="Mixta">Mixta</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="my-3" controlId="servicio-descripcion">
            <Form.Label>Descripción del servicio</Form.Label>
            <Form.Control as="textarea" rows={3} name="descripcion" value={formulario.descripcion} onChange={cambiar} />
          </Form.Group>
          <Form.Check
            className="mb-3"
            type="switch"
            id="servicio-activo"
            name="activo"
            checked={formulario.activo}
            onChange={cambiar}
            label="Servicio activo en el catálogo"
          />
          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" variant="success" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear servicio"}
            </Button>
            {editando ? (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setEditando(null);
                  setFormulario(SERVICIO_VACIO);
                }}
              >
                Cancelar edición
              </Button>
            ) : null}
          </div>
        </Form>
      </section>

      <DialogoConfirmacion
        visible={Boolean(porEliminar)}
        titulo="Eliminar el servicio"
        mensaje={porEliminar ? `¿Confirmas eliminar el servicio ${porEliminar.codigo} del catálogo? Esta acción no se puede deshacer.` : ""}
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminacion}
        onCerrar={() => setPorEliminar(null)}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Estadísticas de gestión: el problema de la inasistencia del caso.
// ---------------------------------------------------------------------------
function SeccionEstadisticas({ token }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Envuelvo la carga en useCallback porque el useEffect de abajo la tiene como dependencia:
  // sin esto la función sería nueva en cada renderizado y el efecto volvería a pedir las
  // estadísticas una y otra vez, en un ciclo sin fin.
  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    // Pido los indicadores calculados al backend en lugar de traer todas las citas y contarlas
    // aquí: él los saca con consultas sobre la base, y así el navegador no descarga el historial
    // completo de la clínica solo para mostrar tres números.
    obtenerEstadisticas(token)
      .then(setDatos)
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  if (cargando) return <CargaEsqueleto filas={4} etiqueta="Cargando estadísticas…" />;
  if (error) return <BloqueError mensaje={error} onReintentar={cargar} />;
  if (!datos) return <EstadoVacio titulo="Sin indicadores disponibles." />;

  // La tasa llega como número; la muestro como porcentaje con un decimal.
  // Acepto las dos formas posibles, proporción (0,2) o porcentaje (20), y multiplico solo cuando
  // viene como proporción: así un cambio de unidad en el backend no se vería como un 0,2 % en
  // pantalla, que es un error difícil de notar porque igual muestra un número creíble.
  const inasistencia = Number(datos.tasaInasistencia ?? 0);
  const porcentaje = inasistencia <= 1 ? inasistencia * 100 : inasistencia;

  return (
    <section>
      <h2 className="h4">Indicadores de la clínica</h2>
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <TarjetaIndicador titulo="Total de citas" valor={datos.totalCitas ?? 0} nota="Registradas en el sistema" />
        </Col>
        <Col xs={12} md={4}>
          <TarjetaIndicador
            titulo="Tasa de inasistencia"
            valor={`${porcentaje.toFixed(1)} %`}
            nota="Citas marcadas como no asistió"
            tono="acento"
          />
        </Col>
        <Col xs={12} md={4}>
          <TarjetaIndicador
            titulo="Citas confirmadas"
            valor={datos.citasPorEstado?.CONFIRMADA ?? 0}
            nota="A la espera de la atención"
            tono="claro"
          />
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs={12} lg={6}>
          <h3 className="h5">Citas por estado</h3>
          <div className="table-responsive nv-tabla">
            <Table hover>
              <caption>Distribución de las citas según su estado</caption>
              <thead><tr><th scope="col">Estado</th><th scope="col">Cantidad</th></tr></thead>
              <tbody>
                {Object.entries(datos.citasPorEstado ?? {}).map(([estado, total]) => (
                  <tr key={estado}>
                    <th scope="row">{etiquetaEstado(estado)}</th>
                    <td>{total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <h3 className="h5">Atenciones por profesional</h3>
          <div className="table-responsive nv-tabla">
            <Table hover>
              <caption>Citas atendidas por cada nutricionista</caption>
              <thead><tr><th scope="col">Profesional</th><th scope="col">Atenciones</th></tr></thead>
              <tbody>
                {(datos.atencionesPorNutricionista ?? []).map((fila) => (
                  <tr key={fila.nutricionistaId}>
                    <th scope="row">{fila.nombre}</th>
                    <td>{fila.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Catálogo local de la tienda: conservo el formulario que ya existía en EP2
// porque sigue alimentando el carrito cuando no hay sesión abierta.
// ---------------------------------------------------------------------------
function SeccionTiendaLocal({ productos, onCrearProducto, onEliminarProducto }) {
  const [datos, setDatos] = useState(PRODUCTO_LOCAL_VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: "" }));
    setMensaje("");
  }

  function enviar(evento) {
    evento.preventDefault();
    const nuevos = {};
    if (!datos.nombre.trim()) nuevos.nombre = "El nombre es obligatorio.";
    if (!datos.categoria) nuevos.categoria = "Selecciona una categoría.";
    if (datos.precio === "" || !Number.isFinite(Number(datos.precio)) || Number(datos.precio) < 0) {
      nuevos.precio = "Ingresa un precio igual o mayor que cero.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    onCrearProducto({
      id: `NV-${Date.now()}`,
      nombre: datos.nombre.trim(),
      categoria: datos.categoria,
      descripcion: datos.descripcion.trim() || "Servicio de Clínica NutriVida.",
      precio: Number(datos.precio),
      imagen: null,
    });
    setDatos(PRODUCTO_LOCAL_VACIO);
    setMensaje("Producto agregado al catálogo local de demostración.");
  }

  return (
    <section>
      <h2 className="h4">Catálogo local de la tienda</h2>
      <Alert variant="info">
        Este catálogo se guarda solo en este navegador y alimenta la tienda cuando no hay sesión abierta.
      </Alert>
      <div aria-live="polite">{mensaje ? <Alert variant="success">{mensaje}</Alert> : null}</div>

      <section className="nv-form-panel mb-4">
        <h3 className="h5">Crear producto o servicio</h3>
        <Form onSubmit={enviar} noValidate aria-label="Formulario para crear producto">
          <Form.Group className="mb-3" controlId="admin-nombre">
            <Form.Label>Nombre</Form.Label>
            <Form.Control name="nombre" value={datos.nombre} onChange={cambiar} isInvalid={Boolean(errores.nombre)} />
            <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="admin-categoria">
            <Form.Label>Categoría</Form.Label>
            <Form.Select name="categoria" value={datos.categoria} onChange={cambiar} isInvalid={Boolean(errores.categoria)}>
              <option value="">Selecciona una categoría</option>
              <option value="Evaluación">Evaluación</option>
              <option value="Taller">Taller</option>
              <option value="Consulta">Consulta</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errores.categoria}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="admin-descripcion">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={3} name="descripcion" value={datos.descripcion} onChange={cambiar} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="admin-precio">
            <Form.Label>Precio en pesos chilenos</Form.Label>
            <Form.Control type="number" min="0" step="1" name="precio" value={datos.precio} onChange={cambiar} isInvalid={Boolean(errores.precio)} />
            <Form.Control.Feedback type="invalid">{errores.precio}</Form.Control.Feedback>
          </Form.Group>
          <Button type="submit" variant="success">Guardar producto</Button>
        </Form>
      </section>

      <h3 className="h5">Catálogo actual ({productos.length})</h3>
      <div className="table-responsive nv-tabla">
        <Table hover>
          <caption>Productos disponibles en el catálogo local</caption>
          <thead><tr><th scope="col">Código</th><th scope="col">Producto</th><th scope="col">Precio</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.id}</td>
                <th scope="row">{producto.nombre}</th>
                <td>{formatearPrecio(producto.precio)}</td>
                <td>
                  <Button variant="outline-danger" size="sm" onClick={() => onEliminarProducto(producto.id)} aria-label={`Eliminar ${producto.nombre}`}>
                    Eliminar {producto.nombre}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
