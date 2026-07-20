import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  numero: "",
  zona: "Salón principal",
  capacidad: "",
  estado: "DISPONIBLE",
  qr_codigo: "",
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
        qr_codigo: mesaEditar.qr_codigo ?? "",
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
        qr_codigo: formulario.qr_codigo || null,
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

      {formulario.qr_codigo && (
        <label>
          Código QR actual
          <input
            type="text"
            name="qr_codigo"
            value={formulario.qr_codigo}
            readOnly
            style={{ background: "#f5f5f5", color: "#888", fontSize: "0.8rem" }}
          />
        </label>
      )}

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