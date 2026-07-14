import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  numero: "",
  zona: "Salón principal",
  capacidad: "",
  estado: "DISPONIBLE",
};

function MesaForm({ mesaEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (mesaEditar) {
      setFormulario({
        numero: mesaEditar.numero ?? "",
        zona: mesaEditar.zona ?? "Salón principal",
        capacidad: mesaEditar.capacidad ?? "",
        estado: mesaEditar.estado ?? "DISPONIBLE",
      });
    } else {
      setFormulario(valoresIniciales);
    }
  }, [mesaEditar]);

  const manejarCambio = (event) => {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!formulario.numero || Number(formulario.numero) <= 0) {
      toast.error("Ingresa un número de mesa válido");
      return;
    }

    if (!formulario.zona.trim()) {
      toast.error("La zona es obligatoria");
      return;
    }

    if (!formulario.capacidad || Number(formulario.capacidad) <= 0) {
      toast.error("La capacidad debe ser mayor a cero");
      return;
    }

    try {
      setGuardando(true);

      await onGuardar({
        numero: Number(formulario.numero),
        zona: formulario.zona.trim(),
        capacidad: Number(formulario.capacidad),
        estado: formulario.estado,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario-modal" onSubmit={manejarEnvio}>
      <label>
        Número de mesa
        <input
          type="number"
          name="numero"
          min="1"
          value={formulario.numero}
          onChange={manejarCambio}
          placeholder="Ejemplo: 7"
        />
      </label>

      <label>
        Zona
        <input
          type="text"
          name="zona"
          value={formulario.zona}
          onChange={manejarCambio}
          placeholder="Salón principal"
        />
      </label>

      <label>
        Capacidad
        <input
          type="number"
          name="capacidad"
          min="1"
          value={formulario.capacidad}
          onChange={manejarCambio}
          placeholder="Número de personas"
        />
      </label>

      <label>
        Estado
        <select
          name="estado"
          value={formulario.estado}
          onChange={manejarCambio}
        >
          <option value="DISPONIBLE">Disponible</option>
          <option value="OCUPADA">Ocupada</option>
          <option value="RESERVADA">Reservada</option>
        </select>
      </label>

      <div className="acciones-formulario">
        <button
          type="button"
          className="btn-cancelar"
          onClick={onCancelar}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn-accion-principal"
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar mesa"}
        </button>
      </div>
    </form>
  );
}

export default MesaForm;