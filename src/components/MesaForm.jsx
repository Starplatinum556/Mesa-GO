import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CircleCheck, CircleX, ImagePlus } from "lucide-react";
import { urlImagen } from "../api";

const valoresIniciales = {
  numero: "",
  zona_id: "",
  capacidad: "",
  estado: "DISPONIBLE",
  qr_codigo: "",
};

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

// MG-66: "zonas" es la lista de zonas activas del restaurante,
// obtenida desde la BD (ya no es texto libre). Viene como prop desde
// Mesas.jsx, que la carga con zonasService.obtenerZonas().
function MesaForm({ mesaEditar, zonas = [], onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  // Igual que en ProductoForm: archivoImagen es lo que se sube al
  // backend (null si no se tocó la foto). previewUrl es solo visual.
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (mesaEditar) {
      setFormulario({
        numero: mesaEditar.numero ?? "",
        zona_id: mesaEditar.zona_id ?? "",
        capacidad: mesaEditar.capacidad ?? "",
        estado: mesaEditar.estado ?? "DISPONIBLE",
        qr_codigo: mesaEditar.qr_codigo ?? "",
      });
      setPreviewUrl(mesaEditar.imagen ? urlImagen(mesaEditar.imagen) : null);
    } else {
      setFormulario(valoresIniciales);
      setPreviewUrl(null);
    }
    setArchivoImagen(null);
  }, [mesaEditar]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  const manejarSeleccionImagen = (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
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
      // Segundo argumento nuevo (archivoImagen) — igual que en
      // ProductoForm, Mesas.jsx lo usa para subir la foto DESPUÉS de
      // crear/actualizar la mesa (necesita el id que devuelve el
      // backend). Viaja como null si no se tocó la foto.
      await onGuardar(
        {
          numero: Number(formulario.numero),
          zona_id: Number(formulario.zona_id),
          capacidad: Number(formulario.capacidad),
          estado: formulario.estado,
          qr_codigo: formulario.qr_codigo || null,
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
        Foto de la mesa
        <label className="pf-imagen-preview" htmlFor="pf-imagen-input-mesa">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa de la mesa" />
          ) : (
            <span className="pf-imagen-placeholder">
              <ImagePlus size={26} />
              Subir foto
            </span>
          )}
        </label>
        <input
          id="pf-imagen-input-mesa"
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