import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const valoresIniciales = {
  nombre: "",
  descripcion: "",
  categoria: "Entradas",
  precio: "",
  disponible: true,
};

function ProductoForm({ productoEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (productoEditar) {
      setFormulario({
        nombre: productoEditar.nombre ?? "",
        descripcion: productoEditar.descripcion ?? "",
        categoria: productoEditar.categoria ?? "Entradas",
        precio: productoEditar.precio ?? "",
        disponible: productoEditar.disponible ?? true,
      });
    } else {
      setFormulario(valoresIniciales);
    }
  }, [productoEditar]);

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
      toast.error("El nombre del producto es obligatorio");
      return;
    }

    if (!formulario.categoria.trim()) {
      toast.error("Selecciona una categoría");
      return;
    }

    if (!formulario.precio || Number(formulario.precio) <= 0) {
      toast.error("El precio debe ser mayor a cero");
      return;
    }

    try {
      setGuardando(true);

      await onGuardar({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        categoria: formulario.categoria,
        precio: Number(formulario.precio),
        disponible: formulario.disponible,
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
          placeholder="Nombre del producto"
        />
      </label>

      <label>
        Descripción
        <textarea
          name="descripcion"
          value={formulario.descripcion}
          onChange={manejarCambio}
          placeholder="Descripción del producto"
          rows="3"
        />
      </label>

      <label>
        Categoría
        <select
          name="categoria"
          value={formulario.categoria}
          onChange={manejarCambio}
        >
          <option value="Entradas">Entradas</option>
          <option value="Platos fuertes">Platos fuertes</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Postres">Postres</option>
        </select>
      </label>

      <label>
        Precio
        <input
          type="number"
          name="precio"
          min="0.01"
          step="0.01"
          value={formulario.precio}
          onChange={manejarCambio}
          placeholder="0.00"
        />
      </label>

      <label className="campo-checkbox">
        <input
          type="checkbox"
          name="disponible"
          checked={formulario.disponible}
          onChange={manejarCambio}
        />
        Producto disponible
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
          {guardando ? "Guardando..." : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}

export default ProductoForm;