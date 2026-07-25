import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { obtenerCategorias } from "../services/categoriasService";

const valoresIniciales = {
  nombre: "",
  descripcion: "",
  categoria_id: "",
  precio: "",
  disponible: true,
};

function ProductoForm({ productoEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  // Categorías reales del restaurante (obtenerCategorias ya filtra por
  // restaurante_id según el token, en el backend). Solo mostramos las
  // "activa" — igual que el criterio que ya usa el menú digital para
  // no ofrecer categorías desactivadas.
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await obtenerCategorias();
        setCategorias(data.filter((c) => c.estado === "activa"));
      } catch (err) {
        toast.error(err.message || "No se pudieron cargar las categorías");
      } finally {
        setCargandoCategorias(false);
      }
    };

    cargarCategorias();
  }, []);

  useEffect(() => {
    if (productoEditar) {
      setFormulario({
        nombre: productoEditar.nombre ?? "",
        descripcion: productoEditar.descripcion ?? "",
        categoria_id: productoEditar.categoria_id ?? "",
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

    if (!formulario.categoria_id) {
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
        categoria_id: Number(formulario.categoria_id),
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
          style={{ resize: "none" }}
        />
      </label>

      <label>
        Categoría
        <select
          name="categoria_id"
          value={formulario.categoria_id}
          onChange={manejarCambio}
          disabled={cargandoCategorias}
        >
          <option value="" disabled>
            {cargandoCategorias ? "Cargando categorías..." : "Selecciona una categoría"}
          </option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
        {!cargandoCategorias && categorias.length === 0 && (
          <span className="campo-ayuda">
            No tienes categorías activas. Crea una primero en "Categorías".
          </span>
        )}
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