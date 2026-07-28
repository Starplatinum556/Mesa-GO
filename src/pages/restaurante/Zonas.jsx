import { useEffect, useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Table2,
  Plus,
  Pencil,
  Trash2,
  Armchair,
  Sprout,
  Crown,
  Flower2,
  Building2,
  Umbrella,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerZonas,
  crearZona,
  actualizarZona,
  eliminarZona,
} from "../../services/zonasService";
import Modal from "../../components/Modal";
import ZonaForm from "../../components/ZonaForm";
import "../../styles/administrador/zonas.css";

// MG-66: igual que en categorías, cada zona se pinta con un ícono y
// color propios según palabras clave en el nombre. Si el nombre no
// matchea ninguna palabra clave (zonas nuevas y libres que cree el
// admin), cae en el estilo neutro por defecto.
const ESTILOS_ZONA = [
  { match: /sal[oó]n|principal/i, icon: Armchair, bg: "#E0EAFE", color: "#3B6FE0" },
  { match: /terraza/i, icon: Sprout, bg: "#DFF5E3", color: "#26A65B" },
  { match: /vip/i, icon: Crown, bg: "#EDE7FB", color: "#7C4FE0" },
  { match: /jard[ií]n/i, icon: Flower2, bg: "#FFEAD1", color: "#D97706" },
  { match: /piso|planta/i, icon: Building2, bg: "#DCF3F7", color: "#0EA5B7" },
  { match: /patio/i, icon: Umbrella, bg: "#FCE4EE", color: "#D6437E" },
];
const ESTILO_DEFAULT = { icon: MapPin, bg: "#F3F4F6", color: "#6B7280" };

function estiloDeZona(nombre = "") {
  return ESTILOS_ZONA.find((e) => e.match.test(nombre)) || ESTILO_DEFAULT;
}

function StatCard({ icon: Icono, numero, texto, label }) {
  return (
    <div className="zona-stat-card">
      <div className="zona-stat-icono">
        <Icono size={22} />
      </div>
      <div>
        <p className="zona-stat-label">{label}</p>
        <p className="zona-stat-numero">{numero}</p>
        <p className="zona-stat-texto">{texto}</p>
      </div>
    </div>
  );
}

function ZonaCard({ zona, onEditar, onEliminar }) {
  const { icon: Icono, bg, color } = estiloDeZona(zona.nombre);

  return (
    <div className="zona-card">
      <div className="zona-card-top">
        <div className="zona-card-icono" style={{ backgroundColor: bg, color }}>
          <Icono size={22} />
        </div>
        <h3>{zona.nombre}</h3>
        <p className="zona-card-descripcion">{zona.descripcion || "Sin descripción."}</p>
      </div>

      <div className="zona-card-media">
        <p className="zona-card-mesas">
          Mesas asignadas: <strong>{zona.mesas}</strong>
        </p>
        <p className="zona-card-estado">
          Estado:{" "}
          <span className={`zona-badge ${zona.estado}`}>
            {zona.estado === "activa" ? "Activa" : "Inactiva"}
          </span>
        </p>
      </div>

      <div className="zona-card-acciones">
        <button type="button" className="zona-btn" onClick={() => onEditar(zona)}>
          <Pencil size={16} />
          Editar
        </button>
        <button type="button" className="zona-btn zona-btn-danger" onClick={() => onEliminar(zona)}>
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </div>
  );
}

function Zonas() {
  const [zonas, setZonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [zonaEditar, setZonaEditar] = useState(null);

  const cargarZonas = async () => {
    setCargando(true);
    setError("");
    try {
      const data = await obtenerZonas();
      setZonas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarZonas();
  }, []);

  const abrirModalNueva = () => {
    setZonaEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (zona) => {
    setZonaEditar(zona);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setZonaEditar(null);
  };

  const manejarGuardar = async (datos) => {
    try {
      if (zonaEditar) {
        await actualizarZona(zonaEditar.id, datos);
        toast.success("Zona actualizada correctamente.");
      } else {
        await crearZona(datos);
        toast.success("Zona creada correctamente.");
      }
      cerrarModal();
      cargarZonas();
    } catch (err) {
      toast.error(err.message || "Error al guardar la zona.");
    }
  };

  const handleEliminar = async (zona) => {
    const confirmado = window.confirm(
      `¿Eliminar la zona "${zona.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await eliminarZona(zona.id);
      toast.success("Zona eliminada correctamente.");
      setZonas((prev) => prev.filter((z) => z.id !== zona.id));
    } catch (err) {
      // Este es el caso del criterio de aceptación: el backend
      // rechaza el borrado si la zona tiene mesas asociadas.
      toast.error(err.message || "Error al eliminar la zona.");
    }
  };

  const totalZonas = zonas.length;
  const zonasActivas = zonas.filter((z) => z.estado === "activa").length;
  const mesasAsignadas = zonas.reduce((acc, z) => acc + z.mesas, 0);

  return (
    <div className="zonas-page">
      <div className="zonas-header">
        <div>
          <h1>Gestión de Zonas</h1>
          <p>Administra las diferentes zonas de tu restaurante donde se ubican las mesas.</p>
        </div>
        <button type="button" className="zona-btn-nueva" onClick={abrirModalNueva}>
          <Plus size={18} />
          Nueva zona
        </button>
      </div>

      {error && <div className="zonas-error">{error}</div>}

      <div className="zonas-stats">
        <StatCard icon={MapPin} label="Total de zonas" numero={totalZonas} texto="Todas las zonas registradas" />
        <StatCard icon={CheckCircle2} label="Zonas activas" numero={zonasActivas} texto="Zonas disponibles" />
        <StatCard icon={Table2} label="Mesas asignadas" numero={mesasAsignadas} texto="Mesas distribuidas en zonas" />
      </div>

      {cargando ? (
        <p className="zonas-mensaje">Cargando zonas…</p>
      ) : zonas.length === 0 ? (
        <p className="zonas-mensaje">Aún no tienes zonas. Crea la primera con el botón "Nueva zona".</p>
      ) : (
        <div className="zonas-grid">
          {zonas.map((zona) => (
            <ZonaCard key={zona.id} zona={zona} onEditar={abrirModalEditar} onEliminar={handleEliminar} />
          ))}
        </div>
      )}

      {modalAbierto && (
        <Modal titulo={zonaEditar ? "Editar zona" : "Nueva zona"} onClose={cerrarModal}>
          <ZonaForm zonaEditar={zonaEditar} onGuardar={manejarGuardar} onCancelar={cerrarModal} />
        </Modal>
      )}
    </div>
  );
}

export default Zonas;