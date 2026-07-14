import { useEffect, useState } from "react";
import {
  Edit,
  Plus,
  QrCode,
  Table2,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../../components/Modal";
import MesaForm from "../../components/MesaForm";

import {
  actualizarMesa,
  crearMesa,
  eliminarMesa,
  obtenerMesas,
} from "../../services/mesasService";

function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mesaEditar, setMesaEditar] = useState(null);

  const cargarMesas = async () => {
    try {
      setCargando(true);
      const datos = await obtenerMesas();
      setMesas(datos);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMesas();
  }, []);

  const abrirCrear = () => {
    setMesaEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (mesa) => {
    setMesaEditar(mesa);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setMesaEditar(null);
    setModalAbierto(false);
  };

  const guardarMesa = async (datos) => {
    try {
      if (mesaEditar) {
        await actualizarMesa(mesaEditar.id, datos);
        toast.success("Mesa actualizada correctamente");
      } else {
        await crearMesa(datos);
        toast.success("Mesa creada correctamente");
      }

      cerrarModal();
      await cargarMesas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const manejarEliminar = async (mesa) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la Mesa ${mesa.numero}?`
    );

    if (!confirmar) return;

    try {
      await eliminarMesa(mesa.id);
      toast.success("Mesa eliminada correctamente");
      await cargarMesas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const claseEstado = (estado) => {
    const estadoNormalizado = estado?.toLowerCase();

    if (estadoNormalizado === "ocupada") return "ocupada";
    if (estadoNormalizado === "reservada") return "reservada";

    return "disponible";
  };

  const disponibles = mesas.filter(
    (mesa) => mesa.estado === "DISPONIBLE" || mesa.disponible
  ).length;

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Mesas</h1>
          <p>
            Administra las mesas, capacidad, ubicación y estado del local.
          </p>
        </div>

        <button
          className="btn-accion-principal btn-header"
          onClick={abrirCrear}
        >
          <Plus size={18} />
          Agregar mesa
        </button>
      </div>

      <section className="metricas-grid tres-columnas">
        <article className="metrica-card">
          <div className="metrica-icon azul">
            <Table2 size={28} />
          </div>

          <div>
            <p>Total de mesas</p>
            <h2>{mesas.length}</h2>
            <span>Registradas en el sistema</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <Users size={28} />
          </div>

          <div>
            <p>Disponibles</p>
            <h2>{disponibles}</h2>
            <span>Mesas listas para uso</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <QrCode size={28} />
          </div>

          <div>
            <p>Códigos QR</p>
            <h2>{mesas.filter((mesa) => mesa.qr_codigo).length}</h2>
            <span>Códigos asignados</span>
          </div>
        </article>
      </section>

      {cargando ? (
        <p className="estado-carga">Cargando mesas...</p>
      ) : mesas.length === 0 ? (
        <p className="estado-vacio">No existen mesas registradas.</p>
      ) : (
        <section className="grid-mesas">
          {mesas.map((mesa) => {
            const color = claseEstado(mesa.estado);

            return (
              <article className="mesa-card" key={mesa.id}>
                <div className="mesa-card-header">
                  <div className={`mesa-card-icon ${color}`}>
                    <Table2 size={24} />
                  </div>

                  <span className={`badge ${color}`}>
                    {mesa.estado}
                  </span>
                </div>

                <h3>Mesa {mesa.numero}</h3>
                <p>{mesa.zona}</p>

                <div className="mesa-detalles">
                  <span>
                    <Users size={16} />
                    Capacidad: {mesa.capacidad}
                  </span>

                  <span>
                    <QrCode size={16} />
                    {mesa.qr_codigo || "Sin código QR"}
                  </span>
                </div>

                <div className="acciones-mesa">
                  <button
                    className="btn-ver"
                    onClick={() => abrirEditar(mesa)}
                  >
                    <Edit size={16} />
                    Editar
                  </button>

                  <button
                    className="btn-eliminar"
                    onClick={() => manejarEliminar(mesa)}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalAbierto && (
        <Modal
          titulo={mesaEditar ? "Editar mesa" : "Agregar mesa"}
          onClose={cerrarModal}
        >
          <MesaForm
            mesaEditar={mesaEditar}
            onGuardar={guardarMesa}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Mesas;