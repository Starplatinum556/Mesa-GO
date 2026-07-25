import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CircleCheck, CircleX } from "lucide-react";

const valoresIniciales = {
  numero: "",
  zona_id: "",
  capacidad: "",
  estado: "DISPONIBLE",
  qr_codigo: "",
};

// MG-66: "zonas" es la lista de zonas activas del restaurante,
// obtenida desde la BD (ya no es texto libre). Viene como prop desde
// Mesas.jsx, que la carga con zonasService.obtenerZonas().
function MesaForm({ mesaEditar, zonas = [], onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (mesaEditar) {
      setFormulario({
        numero: mesaEditar.numero ?? "",
        zona_id: mesaEditar.zona_id ?? "",
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

  const seleccionarEstado = (valor) => {
    setFormulario((anterior) => ({ ...anterior, estado: valor }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!formulario.numero || Number(formulario.numero) <= 0) {
      toast.error("Ingresa un número de mesa válido");
      return;
    }

    if (!formulario.zona_id) {
      toast.error("Selecciona una zona");
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
        zona_id: Number(formulario.zona_id),
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
        <select name="zona_id" value={formulario.zona_id} onChange={manejarCambio}>
          <option value="">Selecciona una zona</option>
          {zonas.map((zona) => (
            <option key={zona.id} value={zona.id}>
              {zona.nombre}
            </option>
          ))}
        </select>
        {zonas.length === 0 && (
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            No tienes zonas activas registradas. Crea una desde el módulo Zonas.
          </span>
        )}
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
        <div className="toggle-estado-mesa">
          <button
            type="button"
            className={`toggle-opcion-mesa disponible ${formulario.estado === "DISPONIBLE" ? "activo" : ""}`}
            onClick={() => seleccionarEstado("DISPONIBLE")}
          >
            <CircleCheck size={16} />
            Disponible
          </button>
          <button
            type="button"
            className={`toggle-opcion-mesa ocupada ${formulario.estado === "OCUPADA" ? "activo" : ""}`}
            onClick={() => seleccionarEstado("OCUPADA")}
          >
            <CircleX size={16} />
            Ocupada
          </button>
        </div>
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