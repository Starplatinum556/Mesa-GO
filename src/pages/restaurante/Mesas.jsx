import { apiFetch, urlImagen } from "../../api";
import { useEffect, useState } from "react";
import { Calendar, Edit, ImageOff, MapPin, Plus, QrCode, Table2, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerMesas,
  crearMesa,
  actualizarMesa,
  eliminarMesa,
  subirImagenMesa,
} from "../../services/mesasService";
import { obtenerZonas } from "../../services/zonasService";
import Modal from "../../components/Modal";
import MesaForm from "../../components/MesaForm";

const INTERVALO_POLLING_MS = 15000; // recarga automática de mesas

function Mesas() {
  const [qrData, setQrData] = useState(null);
  const [qrModalAbierto, setQrModalAbierto] = useState(false);
  const [mesas, setMesas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mesaEditar, setMesaEditar] = useState(null);

  const cargarMesas = async ({ mostrarCargando = false } = {}) => {
    if (mostrarCargando) setCargando(true);
    try {
      const datos = await obtenerMesas();
      setMesas(datos);
    } catch (err) {
      toast.error(err.message || "No se pudo conectar con el servidor.");
    } finally {
      if (mostrarCargando) setCargando(false);
    }
  };

  // MG-66: las zonas ya no son texto libre, se administran en su
  // propio módulo y se seleccionan aquí desde una lista real. Solo
  // se ofrecen las zonas activas para que no se pueda asignar una
  // mesa a una zona que el admin desactivó.
  const cargarZonas = async () => {
    try {
      const datos = await obtenerZonas();
      setZonas(datos.filter((z) => z.estado === "activa"));
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar las zonas.");
    }
  };

  useEffect(() => {
    cargarMesas({ mostrarCargando: true });
    cargarZonas();
    const idPolling = setInterval(() => cargarMesas(), INTERVALO_POLLING_MS);
    return () => clearInterval(idPolling);
  }, []);

  const abrirModalNueva = () => {
    setMesaEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (mesa) => {
    setMesaEditar({
      ...mesa,
      estado: mesa.disponible ? "DISPONIBLE" : "OCUPADA",
      qr_codigo: mesa.qr_codigo || "",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setMesaEditar(null);
  };

  const manejarGuardar = async (datos, archivoImagen) => {
    try {
      const payload = {
        ...datos,
        disponible: datos.estado === "DISPONIBLE",
      };

      const mesa = mesaEditar
        ? await actualizarMesa(mesaEditar.id, payload)
        : await crearMesa(payload);

      // El backend devuelve la mesa completa (con su id) tanto en
      // crear como en actualizar — igual que con productos, así que
      // recién aquí, con el id confirmado, subimos la foto.
      if (archivoImagen && mesa?.id) {
        try {
          await subirImagenMesa(mesa.id, archivoImagen);
        } catch (errImagen) {
          toast.error(errImagen.message || "La mesa se guardó, pero la imagen no se pudo subir.");
        }
      }

      toast.success(mesaEditar ? "Mesa actualizada correctamente." : "Mesa creada correctamente.");
      cerrarModal();
      cargarMesas();
    } catch (err) {
      toast.error(err.message || "Error al guardar la mesa.");
    }
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta mesa?")) return;
    try {
      await eliminarMesa(id);
      toast.success("Mesa eliminada correctamente.");
      cargarMesas();
    } catch (err) {
      toast.error(err.message || "Error al eliminar la mesa.");
    }
  };

  const manejarVerQr = async (mesa) => {
    try {
      const res = await apiFetch(`/api/mesas/${mesa.id}/qr`);
      const datos = await res.json();
      if (!res.ok) {
        toast.error(datos.error || "Error al obtener QR.");
        return;
      }
      setQrData({ ...datos, mesa: { ...mesa, qr_codigo: datos.token } });
      setQrModalAbierto(true);
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const manejarGenerarQr = async (mesa) => {
    try {
      const res = await apiFetch(`/api/mesas/${mesa.id}/qr`, { method: "POST" });
      const datos = await res.json();
      if (!res.ok) {
        toast.error(datos.error || "Error al generar QR.");
        return;
      }
      setQrData({ ...datos, mesa: { ...mesa, qr_codigo: datos.token } });
      setQrModalAbierto(true);
      toast.success("QR generado correctamente.");
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const cerrarModalQr = () => {
    setQrModalAbierto(false);
    setQrData(null);
    cargarMesas();
  };

  const totalMesas = mesas.length;
  const disponibles = mesas.filter((m) => m.disponible).length;
  const qrActivos = mesas.filter((m) => m.qr_codigo).length;
  const capacidadTotal = mesas.reduce((suma, m) => suma + (Number(m.capacidad) || 0), 0);

  return (
    <section className="ms-modulo">
      <div className="ms-header">
        <div>
          <h1 className="ms-titulo">Gestión de Mesas</h1>
          <p className="ms-subtitulo">
            Administra mesas, códigos QR, capacidad y disponibilidad del local.
          </p>
        </div>

        <button className="ms-btn-nueva" onClick={abrirModalNueva}>
          <Plus size={18} />
          Agregar mesa
        </button>
      </div>

      {cargando && <p className="ms-cargando">Cargando mesas...</p>}

      {!cargando && mesas.length === 0 && (
        <div className="ms-vacio">
          <Table2 size={44} />
          <p className="ms-vacio-titulo">No tienes mesas registradas</p>
          <p className="ms-vacio-texto">Haz clic en "Agregar mesa" para comenzar</p>
        </div>
      )}

      {!cargando && mesas.length > 0 && (
        <>
          <div className="ms-stats">
            <div className="ms-stat-card">
              <div className="ms-stat-icono ms-stat-icono--azul">
                <Table2 size={22} />
              </div>
              <div>
                <p className="ms-stat-label">Total de mesas</p>
                <p className="ms-stat-valor">{totalMesas}</p>
                <p className="ms-stat-nota">Registradas en el local</p>
              </div>
            </div>

            <div className="ms-stat-card">
              <div className="ms-stat-icono ms-stat-icono--verde">
                <Users size={22} />
              </div>
              <div>
                <p className="ms-stat-label">Disponibles</p>
                <p className="ms-stat-valor">{disponibles}</p>
                <p className="ms-stat-nota">Listas para uso</p>
              </div>
            </div>

            <div className="ms-stat-card">
              <div className="ms-stat-icono ms-stat-icono--naranja">
                <QrCode size={22} />
              </div>
              <div>
                <p className="ms-stat-label">QR activos</p>
                <p className="ms-stat-valor">{qrActivos}</p>
                <p className="ms-stat-nota">Códigos generados</p>
              </div>
            </div>

            <div className="ms-stat-card">
              <div className="ms-stat-icono ms-stat-icono--morado">
                <Calendar size={22} />
              </div>
              <div>
                <p className="ms-stat-label">Capacidad total</p>
                <p className="ms-stat-valor">{capacidadTotal}</p>
                <p className="ms-stat-nota">Personas</p>
              </div>
            </div>
          </div>

          <div className="ms-grid">
            {mesas.map((mesa) => {
              const disponible = mesa.disponible;

              return (
                <article className="ms-card" key={mesa.id}>
                  <div
                    className="ms-card-foto"
                    style={
                      mesa.imagen
                        ? { backgroundImage: `url(${urlImagen(mesa.imagen)})` }
                        : undefined
                    }
                  >
                    {!mesa.imagen && (
                      <div className="ms-card-foto-vacia">
                        <ImageOff size={26} />
                      </div>
                    )}

                    <span
                      className={`ms-badge-estado ${
                        disponible ? "ms-badge-estado--disponible" : "ms-badge-estado--ocupada"
                      }`}
                    >
                      {disponible ? "Disponible" : "Ocupada"}
                    </span>
                  </div>

                  <div className="ms-card-body">
                    <div className="ms-card-header">
                      <div
                        className={`ms-icon ${
                          disponible ? "ms-icon--disponible" : "ms-icon--ocupada"
                        }`}
                      >
                        <Table2 size={20} />
                      </div>
                      <div className="ms-card-titulo">
                        <h3>Mesa {mesa.numero}</h3>
                        <p className="ms-qr-texto">Código QR: {mesa.qr_codigo || "Sin QR"}</p>
                      </div>
                    </div>

                    <div className="ms-detalles">
                      <span>
                        <Users size={15} />
                        Capacidad: {mesa.capacidad} personas
                      </span>
                      <span>
                        <MapPin size={15} />
                        {/* MG-66: zona_nombre viene del JOIN con la tabla
                            zonas (vía zona_id) en el backend. Si la mesa
                            no tiene zona asignada, se muestra un texto
                            neutro en vez de asumir "Salón principal". */}
                        {mesa.zona_nombre || "Sin zona asignada"}
                      </span>
                    </div>

                    <div className="ms-acciones">
                      <button
                        className="ms-accion ms-accion--qr"
                        onClick={() => (mesa.qr_codigo ? manejarVerQr(mesa) : manejarGenerarQr(mesa))}
                        title={mesa.qr_codigo ? "Ver QR actual" : "Generar QR"}
                      >
                        <QrCode size={14} />
                        {mesa.qr_codigo ? "Ver QR" : "Generar QR"}
                      </button>

                      <button className="ms-accion ms-accion--editar" onClick={() => abrirModalEditar(mesa)}>
                        <Edit size={14} />
                        Editar
                      </button>

                      <button
                        className="ms-accion ms-accion--eliminar"
                        onClick={() => manejarEliminar(mesa.id)}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {qrModalAbierto && qrData && (
        <Modal titulo={`QR — Mesa ${qrData.mesa.numero}`} onClose={cerrarModalQr}>
          <div className="ms-qr-modal">
            <img src={qrData.qr} alt="Código QR" className="ms-qr-imagen" />
            <p className="ms-qr-instruccion">
              Escanea este QR desde tu celular para acceder al menú de la mesa {qrData.mesa.numero}
            </p>
            <div className="ms-qr-acciones">
              <a
                href={qrData.qr}
                download={`QR-Mesa-${qrData.mesa.numero}.png`}
                className="ms-qr-btn-descargar"
              >
                Descargar QR
              </a>
              <button className="ms-qr-btn-regenerar" onClick={() => manejarGenerarQr(qrData.mesa)}>
                Regenerar QR
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalAbierto && (
        <Modal titulo={mesaEditar ? "Editar mesa" : "Nueva mesa"} onClose={cerrarModal}>
          <MesaForm
            mesaEditar={mesaEditar}
            zonas={zonas}
            onGuardar={manejarGuardar}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Mesas;