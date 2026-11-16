import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Row, Table } from "react-bootstrap";
import { useSesion } from "../context/SesionContext";
import { listarMias } from "../services/medicionService";
import BloqueError from "../components/ui/BloqueError";
import CargaEsqueleto from "../components/ui/CargaEsqueleto";
import EncabezadoSeccion from "../components/ui/EncabezadoSeccion";
import EstadoVacio from "../components/ui/EstadoVacio";
import TarjetaIndicador from "../components/ui/TarjetaIndicador";
import { formatearFecha } from "../utils/citas";

// Muestro el IMC tal como lo calculó el backend; aquí solo lo redondeo para
// leerlo mejor y le pongo la categoría de referencia.
function categoriaImc(imc) {
  if (!Number.isFinite(Number(imc))) return "";
  const valor = Number(imc);
  if (valor < 18.5) return "Bajo peso";
  if (valor < 25) return "Normal";
  if (valor < 30) return "Sobrepeso";
  return "Obesidad";
}

export default function MiProgreso() {
  const { token } = useSesion();
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    listarMias(token)
      .then((lista) => setMediciones(Array.isArray(lista) ? lista : []))
      .catch((problema) => setError(problema.message))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  // Ordeno de la medición más reciente a la más antigua y calculo la variación
  // de peso entre la primera y la última control.
  const historial = useMemo(
    () => [...mediciones].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))),
    [mediciones],
  );

  const ultima = historial[0];
  const primera = historial[historial.length - 1];
  const variacion =
    historial.length > 1 && ultima && primera
      ? Number(ultima.pesoKg) - Number(primera.pesoKg)
      : null;

  return (
    <Container as="main" className="nv-section">
      <EncabezadoSeccion
        contexto="SEGUIMIENTO NUTRICIONAL"
        titulo="Mi progreso"
        descripcion="Historial de tus controles con el IMC y el plan alimenticio indicado por tu profesional."
        acciones={
          <Button variant="outline-success" onClick={cargar} disabled={cargando}>
            Actualizar
          </Button>
        }
      />

      <BloqueError mensaje={error} onReintentar={cargar} />

      {cargando ? (
        <CargaEsqueleto filas={4} etiqueta="Cargando tu historial…" />
      ) : historial.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tienes mediciones registradas."
          mensaje="Tu nutricionista registrará tus medidas durante la consulta."
        />
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col xs={12} md={4}>
              <TarjetaIndicador
                titulo="Último peso registrado"
                valor={`${ultima.pesoKg} kg`}
                nota={`Control del ${formatearFecha(ultima.fecha)}`}
              />
            </Col>
            <Col xs={12} md={4}>
              <TarjetaIndicador
                titulo="IMC actual"
                valor={Number(ultima.imc).toFixed(1)}
                nota={categoriaImc(ultima.imc)}
                tono="acento"
              />
            </Col>
            <Col xs={12} md={4}>
              <TarjetaIndicador
                titulo="Variación de peso"
                valor={
                  variacion === null
                    ? "—"
                    : `${variacion > 0 ? "+" : ""}${variacion.toFixed(1)} kg`
                }
                nota={
                  variacion === null
                    ? "Necesitas al menos dos controles"
                    : "Desde tu primer control"
                }
                tono="claro"
              />
            </Col>
          </Row>

          <div className="table-responsive nv-tabla">
            <Table hover>
              <caption>Historial de mediciones y planes indicados</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Peso</th>
                  <th scope="col">Talla</th>
                  <th scope="col">Cintura</th>
                  <th scope="col">IMC</th>
                  <th scope="col">Observaciones</th>
                  <th scope="col">Plan alimenticio</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((medicion) => (
                  <tr key={medicion.id}>
                    <th scope="row">{formatearFecha(medicion.fecha)}</th>
                    <td>{medicion.pesoKg} kg</td>
                    <td>{medicion.tallaCm} cm</td>
                    <td>{medicion.cinturaCm ? `${medicion.cinturaCm} cm` : "—"}</td>
                    <td>
                      {Number(medicion.imc).toFixed(1)}{" "}
                      <span className="text-secondary small">{categoriaImc(medicion.imc)}</span>
                    </td>
                    <td className="nv-celda-motivo">{medicion.observaciones || "—"}</td>
                    <td className="nv-celda-motivo">{medicion.planAlimenticio || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </Container>
  );
}
