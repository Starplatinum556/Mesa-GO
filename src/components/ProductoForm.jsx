import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import toast from "react-hot-toast";
import { obtenerCategorias } from "../services/categoriasService";
import { urlImagen } from "../api";

const valoresIniciales = {
  nombre: "",
  descripcion: "",
  categoria_id: "",
  precio: "",
  disponible: true,
};

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

function ProductoForm({ productoEditar, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  // Imagen del producto: archivoImagen es lo que se sube al backend
  // (null si el usuario no tocó la foto). previewUrl es solo para
  // mostrarla en pantalla — puede ser la foto que ya tenía el
  // producto (URL del servidor) o la vista previa local del archivo
  // recién elegido (URL.createObjectURL).
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
      setPreviewUrl(productoEditar.imagen ? urlImagen(productoEditar.imagen) : null);
    } else {
      setFormulario(valoresIniciales);
      setPreviewUrl(null);
    }
    setArchivoImagen(null);
  }, [productoEditar]);

  // Libera la URL local (blob:) cuando el componente se desmonta o
  // cuando se reemplaza por otra, para no dejar memoria colgada.
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const manejarCambio = (event) => {
    const { name, value, type, checked } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const manejarSeleccionImagen = (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!archivo) return;

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      toast.error("Formato no permitido. Usa JPG, PNG, WEBP o SVG.");
      return;
    }

    if (archivo.size > 3 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 3 MB.");
      return;
    }

    setArchivoImagen(archivo);
    setPreviewUrl(URL.createObjectURL(archivo));
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

      // El segundo argumento (archivoImagen) es nuevo: Productos.jsx
      // lo usa para subir la foto DESPUÉS de crear/actualizar el
      // producto (necesita el id que devuelve el backend). Si el
      // usuario no tocó la foto, viaja como null y simplemente no
      // se sube nada nuevo.
      await onGuardar(
        {
          nombre: formulario.nombre.trim(),
          descripcion: formulario.descripcion.trim(),
          categoria_id: Number(formulario.categoria_id),
          precio: Number(formulario.precio),
          disponible: formulario.disponible,
        },
        archivoImagen
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="formulario-modal" onSubmit={manejarEnvio}>
      <label className="pf-imagen-campo">
        Foto del producto
        <label className="pf-imagen-preview" htmlFor="pf-imagen-input">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa del producto" />
          ) : (
            <span className="pf-imagen-placeholder">
              <ImagePlus size={26} />
              Subir foto
            </span>
          )}
        </label>
        <input
          id="pf-imagen-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="pf-imagen-input-oculto"
          onChange={manejarSeleccionImagen}
        />
        <span className="campo-ayuda">
          {previewUrl ? "Haz clic en la foto para cambiarla." : "JPG, PNG, WEBP o SVG — máx. 3 MB."}
        </span>
      </label>

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