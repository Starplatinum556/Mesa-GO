import { useEffect, useState } from "react";
import { Plus, QrCode, Table2, Trash2, Edit, Users } from "lucide-react";
import toast from "react-hot-toast";
import { obtenerMesas, crearMesa, actualizarMesa, eliminarMesa } from "../../services/mesasService";
import Modal from "../../components/Modal";
import MesaForm from "../../components/MesaForm";

function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mesaEditar, setMesaEditar] = useState(null);

  const cargarMesas = async () => {
    try {
      const datos = await obtenerMesas();
      setMesas(datos);
    } catch (err) {
      toast.error(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMesas();
  }, []);

  const abrirModalNueva = () => {
    setMesaEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (mesa) => {
    setMesaEditar({
      ...mesa,
      estado: mesa.disponible ? "DISPONIBLE" : "OCUPADA",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setMesaEditar(null);
  };

  const manejarGuardar = async (datos) => {
    try {
      // Convertir estado texto a boolean para el backend
      const payload = {
        ...datos,
        disponible: datos.estado === "DISPONIBLE",
      };

      if (mesaEditar) {
        await actualizarMesa(mesaEditar.id, payload);
        toast.success("Mesa actualizada correctamente.");
      } else {
        await crearMesa(datos);
        toast.success("Mesa creada correctamente.");
      }
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

  const totalMesas = mesas.length;
  const disponibles = mesas.filter((m) => m.disponible).length;

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Mesas</h1>
          <p>Administra mesas, códigos QR, capacidad y disponibilidad del local.</p>
        </div>

        <button className="btn-accion-principal btn-header" onClick={abrirModalNueva}>
          <Plus size={18} />
          Agregar mesa
        </button>
      </div>

      {cargando && <p>Cargando mesas...</p>}

      {!cargando && (
        <>
          <section className="metricas-grid tres-columnas">
            <article className="metrica-card">
              <div className="metrica-icon azul">
                <Table2 size={28} />
              </div>
              <div>
                <p>Total de mesas</p>
                <h2>{totalMesas}</h2>
                <span>Registradas en el local</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon verde">
                <Users size={28} />
              </div>
              <div>
                <p>Disponibles</p>
                <h2>{disponibles}</h2>
                <span>Listas para uso</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon naranja">
                <QrCode size={28} />
              </div>
              <div>
                <p>QR activos</p>
                <h2>{totalMesas}</h2>
                <span>Códigos generados</span>
              </div>
            </article>
          </section>

          <section className="grid-mesas">
            {mesas.map((mesa) => {
              const color = mesa.disponible ? "disponible" : "ocupada";
              const estado = mesa.disponible ? "Disponible" : "Ocupada";

              return (
                <article className="mesa-card" key={mesa.id}>
                  <div className="mesa-card-header">
                    <div className={`mesa-card-icon ${color}`}>
                      <Table2 size={24} />
                    </div>
                    <span className={`badge ${color}`}>{estado}</span>
                  </div>

                  <h3>Mesa {mesa.numero}</h3>
                  <p>Código QR: {mesa.qr_codigo || "Sin QR"}</p>

                  <div className="mesa-detalles">
                    <span>
                      <Users size={16} />
                      Capacidad: {mesa.capacidad}
                    </span>
                    <span>
                      <QrCode size={16} />
                      {mesa.qr_codigo ? "QR asignado" : "Sin QR"}
                    </span>
                  </div>

                  <div className="acciones-mesa">
                    <button
                      className="btn-ver"
                      onClick={() => abrirModalEditar(mesa)}
                    >
                      <Edit size={15} />
                      Editar
                    </button>

                    <button
                      className="btn-eliminar"
                      onClick={() => manejarEliminar(mesa.id)}
                    >
                      <Trash2 size={15} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {modalAbierto && (
        <Modal
          titulo={mesaEditar ? "Editar mesa" : "Nueva mesa"}
          onClose={cerrarModal}
        >
          <MesaForm
            mesaEditar={mesaEditar}
            onGuardar={manejarGuardar}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Mesas;