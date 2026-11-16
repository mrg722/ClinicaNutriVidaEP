import { colorEstado, etiquetaEstado } from "../../utils/citas";

// Insignia de estado de una cita. Uso una clase propia por estado para que el
// color sea el mismo en la vista del paciente, en la agenda y en el panel.
export default function InsigniaEstado({ estado }) {
  return (
    <span
      className={`nv-insignia nv-insignia--${String(estado ?? "").toLowerCase()}`}
      data-color={colorEstado(estado)}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}
