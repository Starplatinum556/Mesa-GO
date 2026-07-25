import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  nombre: "",
  descripcion: "",
  estado: "activa",
};

function ZonaForm({ zonaEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (zonaEditar) {
      setFormulario({
        nombre: zonaEditar.nombre ?? "",
        descripcion: zonaEditar.descripcion ?? "",
        estado: zonaEditar.estado ?? "activa",
      });
    } else {
      setFormulario(valoresIniciales);
    }
  }, [zonaEditar]);

  const manejarCambio = (event) => {
    const { name, value } = event.target;
    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!formulario.nombre.trim()) {
      toast.error("El nombre de la zona es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      await onGuardar({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || null,
        estado: formulario.estado,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario-modal" onSubmit={manejarEnvio}>
      <label>
        Nombre de la zona
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={manejarCambio}
          placeholder="Ejemplo: Terraza"
        />
      </label>

      <label>
        Descripción
        <textarea
          name="descripcion"
          value={formulario.descripcion}
          onChange={manejarCambio}
          placeholder="Describe brevemente esta zona (opcional)"
          rows={3}
          // Tamaño fijo: sin esto el navegador muestra el "handle" en
          // la esquina inferior derecha y el usuario puede arrastrar
          // para agrandar/achicar el campo libremente.
          style={{ resize: "none" }}
        />
      </label>

      <label>
        Estado
        <select name="estado" value={formulario.estado} onChange={manejarCambio}>
          <option value="activa">Activa</option>
          <option value="inactiva">Inactiva</option>
        </select>
      </label>

      <div className="acciones-formulario">
        <button type="button" className="btn-cancelar" onClick={onCancelar}>
          Cancelar
        </button>

        <button type="submit" className="btn-accion-principal" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar zona"}
        </button>
      </div>
    </form>
  );
}

export default ZonaForm;