import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  nombre: "",
  descripcion: "",
  activa: true,
};

function CategoriaForm({ categoriaEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (categoriaEditar) {
      setFormulario({
        nombre: categoriaEditar.nombre ?? "",
        descripcion: categoriaEditar.descripcion ?? "",
        activa: categoriaEditar.estado ? categoriaEditar.estado === "activa" : true,
      });
    } else {
      setFormulario(valoresIniciales);
    }
  }, [categoriaEditar]);

  const manejarCambio = (event) => {
    const { name, value, type, checked } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();

    if (!formulario.nombre.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    try {
      setGuardando(true);

      await onGuardar({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        activa: formulario.activa,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario-modal" onSubmit={manejarEnvio}>
      <label>
        Nombre
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={manejarCambio}
          placeholder="Nombre de la categoría"
        />
      </label>

      <label>
        Descripción
        <textarea
          name="descripcion"
          value={formulario.descripcion}
          onChange={manejarCambio}
          placeholder="Descripción de la categoría"
          rows="3"
          style={{ resize: "none" }}
        />
      </label>

      <label className="campo-checkbox">
        <input
          type="checkbox"
          name="activa"
          checked={formulario.activa}
          onChange={manejarCambio}
        />
        Categoría activa
      </label>

      <div className="acciones-formulario">
        <button type="button" className="btn-cancelar" onClick={onCancelar}>
          Cancelar
        </button>

        <button type="submit" className="btn-accion-principal" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar categoría"}
        </button>
      </div>
    </form>
  );
}

export default CategoriaForm;