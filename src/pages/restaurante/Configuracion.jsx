import { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  Shield,
  Table2,
  User,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../api";
import { actualizarRestaurante, obtenerRestaurante } from "../../services/restauranteService";
import { obtenerMesas } from "../../services/mesasService";
import { obtenerProductos } from "../../services/productosService";
import { obtenerPedidos } from "../../services/pedidosService";

const VALORES_INICIALES = {
  nombre: "",
  sucursal: "",
  direccion: "",
  correo: "",
  telefono: "",
  responsable: "",
  hora_apertura: "",
  hora_cierre: "",
  estado: "Abierto",
};

// El input type="time" necesita "HH:MM"; Postgres puede devolver "HH:MM:SS".
function aFormatoHora(valor) {
  return valor ? valor.slice(0, 5) : "";
}

// Para mostrar la hora en formato 12h en modo lectura (09:00 -> 09:00 AM).
function formatearHora12(horaHHMM) {
  if (!horaHHMM) return "—";
  const [h, m] = horaHHMM.split(":").map(Number);
  const periodo = h >= 12 ? "PM" : "AM";
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hora12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${periodo}`;
}

function esDeHoy(fechaIso) {
  if (!fechaIso) return false;
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

// MG-63: campo en modo lectura — icono + etiqueta + valor.
function CampoLectura({ icono: Icono, color, etiqueta, valor }) {
  return (
    <div className="config-campo">
      <div className={`config-campo-icono ${color}`}>
        <Icono size={18} />
      </div>
      <div className="config-campo-texto">
        <span>{etiqueta}</span>
        <strong>{valor || "Sin definir"}</strong>
      </div>
    </div>
  );
}

// MG-63: mismo campo pero editable (con la etiqueta arriba, como formulario).
function CampoEdicion({ icono: Icono, color, etiqueta, children }) {
  return (
    <label className="config-campo config-campo-editable">
      <div className={`config-campo-icono ${color}`}>
        <Icono size={18} />
      </div>
      <div className="config-campo-texto">
        <span>{etiqueta}</span>
        {children}
      </div>
    </label>
  );
}

function Configuracion() {
  const [datos, setDatos] = useState(VALORES_INICIALES);
  const [original, setOriginal] = useState(VALORES_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [resumen, setResumen] = useState(null);

  const cargar = async () => {
    try {
      const restaurante = await obtenerRestaurante();
      const valores = {
        nombre: restaurante.nombre || "",
        sucursal: restaurante.sucursal || "",
        direccion: restaurante.direccion || "",
        correo: restaurante.correo || "",
        telefono: restaurante.telefono || "",
        responsable: restaurante.responsable || "",
        hora_apertura: aFormatoHora(restaurante.hora_apertura),
        hora_cierre: aFormatoHora(restaurante.hora_cierre),
        estado: restaurante.estado || "Abierto",
      };
      setDatos(valores);
      setOriginal(valores);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar la información del restaurante.");
    } finally {
      setCargando(false);
    }
  };

  // MG-63: en vez de un "estado del sistema" ficticio, un resumen real
  // del restaurante — datos que ya existen en la BD, sin tocar el esquema.
  const cargarResumen = async () => {
    try {
      const [mesas, productos, personalRes, pedidos] = await Promise.all([
        obtenerMesas(),
        obtenerProductos(),
        apiFetch("/api/personal").then((r) => r.json()),
        obtenerPedidos(),
      ]);

      const personal = Array.isArray(personalRes) ? personalRes : [];

      setResumen({
        mesas: mesas.length,
        productos: productos.length,
        personalActivo: personal.filter((e) => e.estado === "ACTIVO").length,
        pedidosHoy: pedidos.filter((p) => esDeHoy(p.creado_en)).length,
      });
    } catch {
      // El resumen es informativo; si falla no bloqueamos el resto de la página.
      setResumen(null);
    }
  };

  useEffect(() => {
    cargar();
    cargarResumen();
  }, []);

  const actualizarCampo = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const iniciarEdicion = () => setEditando(true);

  const cancelarEdicion = () => {
    setDatos(original);
    setEditando(false);
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await actualizarRestaurante(datos);
      toast.success("Los datos del restaurante se guardaron correctamente");
      setEditando(false);
      await cargar();
    } catch (err) {
      toast.error(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p className="estado-carga">Cargando configuración...</p>;
  }

  if (error) {
    return <p className="estado-error">{error}</p>;
  }

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Configuración del Restaurante</h1>
          <p>
            {editando
              ? "Edita la información general, horarios y preferencias básicas del sistema."
              : "Información general, horarios y preferencias básicas del sistema."}
          </p>
        </div>

        {editando ? (
          <div className="config-toolbar-editar">
            <button className="btn-secundario" onClick={cancelarEdicion} disabled={guardando}>
              <X size={18} />
              Cancelar
            </button>
            <button className="btn-accion-principal btn-header" onClick={guardarCambios} disabled={guardando}>
              <Save size={18} />
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <button className="btn-accion-principal btn-header" onClick={iniciarEdicion}>
            <Pencil size={18} />
            Editar información del local
          </button>
        )}
      </div>

      <section className="config-grid">
        <article className="config-card">
          <div className="config-card-header">
            <Building2 size={24} />
            <div>
              <h3>Datos del restaurante</h3>
              <p>
                {editando
                  ? "Información principal visible para el administrador."
                  : "Información principal del establecimiento."}
              </p>
            </div>
          </div>

          {editando ? (
            <div className="config-form">
              <CampoEdicion icono={Building2} color="azul" etiqueta="Nombre del restaurante">
                <input type="text" value={datos.nombre} onChange={actualizarCampo("nombre")} />
              </CampoEdicion>
              <CampoEdicion icono={Building2} color="azul" etiqueta="Sucursal">
                <input type="text" value={datos.sucursal} onChange={actualizarCampo("sucursal")} />
              </CampoEdicion>
              <CampoEdicion icono={MapPin} color="azul" etiqueta="Dirección">
                <input type="text" value={datos.direccion} onChange={actualizarCampo("direccion")} />
              </CampoEdicion>
            </div>
          ) : (
            <div className="config-form">
              <CampoLectura icono={Building2} color="azul" etiqueta="Nombre del restaurante" valor={datos.nombre} />
              <CampoLectura icono={Building2} color="azul" etiqueta="Sucursal" valor={datos.sucursal} />
              <CampoLectura icono={MapPin} color="azul" etiqueta="Dirección" valor={datos.direccion || "Dirección pendiente"} />
            </div>
          )}
        </article>

        <article className="config-card">
          <div className="config-card-header">
            <Clock size={24} />
            <div>
              <h3>Horario de atención</h3>
              <p>Horario operativo del restaurante.</p>
            </div>
          </div>

          {editando ? (
            <div className="config-form">
              <CampoEdicion icono={Clock} color="azul" etiqueta="Hora de apertura">
                <input type="time" value={datos.hora_apertura} onChange={actualizarCampo("hora_apertura")} />
              </CampoEdicion>
              <CampoEdicion icono={Clock} color="azul" etiqueta="Hora de cierre">
                <input type="time" value={datos.hora_cierre} onChange={actualizarCampo("hora_cierre")} />
              </CampoEdicion>
              <CampoEdicion icono={Shield} color="azul" etiqueta="Estado del local">
                <select value={datos.estado} onChange={actualizarCampo("estado")}>
                  <option>Abierto</option>
                  <option>Cerrado</option>
                  <option>En mantenimiento</option>
                </select>
              </CampoEdicion>
            </div>
          ) : (
            <div className="config-form">
              <CampoLectura icono={Clock} color="azul" etiqueta="Hora de apertura" valor={formatearHora12(datos.hora_apertura)} />
              <CampoLectura icono={Clock} color="azul" etiqueta="Hora de cierre" valor={formatearHora12(datos.hora_cierre)} />
              <div className="config-campo">
                <div className="config-campo-icono azul">
                  <Shield size={18} />
                </div>
                <div className="config-campo-texto">
                  <span>Estado del local</span>
                  <span className={`estado-pill ${datos.estado === "Abierto" ? "nuevo" : "pendiente"}`}>
                    {datos.estado}
                  </span>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="config-card">
          <div className="config-card-header">
            <Mail size={24} />
            <div>
              <h3>Contacto</h3>
              <p>Datos de comunicación del restaurante.</p>
            </div>
          </div>

          {editando ? (
            <div className="config-form">
              <CampoEdicion icono={Mail} color="morado" etiqueta="Correo electrónico">
                <input type="email" value={datos.correo} onChange={actualizarCampo("correo")} />
              </CampoEdicion>
              <CampoEdicion icono={Phone} color="morado" etiqueta="Teléfono">
                <input type="text" value={datos.telefono} onChange={actualizarCampo("telefono")} />
              </CampoEdicion>
              <CampoEdicion icono={User} color="morado" etiqueta="Responsable">
                <input type="text" value={datos.responsable} onChange={actualizarCampo("responsable")} />
              </CampoEdicion>
            </div>
          ) : (
            <div className="config-form">
              <CampoLectura icono={Mail} color="morado" etiqueta="Correo electrónico" valor={datos.correo} />
              <CampoLectura icono={Phone} color="morado" etiqueta="Teléfono" valor={datos.telefono} />
              <CampoLectura icono={User} color="morado" etiqueta="Responsable" valor={datos.responsable} />
            </div>
          )}
        </article>

        <article className="config-card">
          <div className="config-card-header">
            <ClipboardList size={24} />
            <div>
              <h3>Resumen del restaurante</h3>
              <p>Un vistazo rápido a lo que tienes registrado hoy.</p>
            </div>
          </div>

          {resumen ? (
            <div className="config-resumen-grid">
              <div className="config-resumen-item">
                <Table2 size={20} />
                <strong>{resumen.mesas}</strong>
                <span>Mesas</span>
              </div>
              <div className="config-resumen-item">
                <Package size={20} />
                <strong>{resumen.productos}</strong>
                <span>Productos</span>
              </div>
              <div className="config-resumen-item">
                <Users size={20} />
                <strong>{resumen.personalActivo}</strong>
                <span>Personal activo</span>
              </div>
              <div className="config-resumen-item">
                <ClipboardList size={20} />
                <strong>{resumen.pedidosHoy}</strong>
                <span>Pedidos hoy</span>
              </div>
            </div>
          ) : (
            <p className="estado-vacio">No se pudo cargar el resumen.</p>
          )}
        </article>
      </section>
    </section>
  );
}

export default Configuracion;