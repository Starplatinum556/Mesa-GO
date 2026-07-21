import { useEffect, useState } from "react";
import {
  ChefHat,
  Edit,
  Plus,
  Trash2,
  Truck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../api";
import Modal from "../../components/Modal";
import PersonalForm from "../../components/PersonalForm";

function Personal() {
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);

  const cargarPersonal = async () => {
    try {
      const res = await apiFetch("/api/personal");
      const datos = await res.json();
      if (!res.ok) {
        toast.error(datos.error || "Error al cargar personal.");
        return;
      }
      setPersonal(datos);
    } catch (err) {
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPersonal();
  }, []);

  const abrirModalNuevo = () => {
    setEmpleadoEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (empleado) => {
    setEmpleadoEditar(empleado);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEmpleadoEditar(null);
  };

  const manejarGuardar = async (datos) => {
    try {
      const res = empleadoEditar
        ? await apiFetch(`/api/personal/${empleadoEditar.id}`, {
            method: "PUT",
            body: JSON.stringify(datos),
          })
        : await apiFetch("/api/personal", {
            method: "POST",
            body: JSON.stringify(datos),
          });

      const respuesta = await res.json();
      if (!res.ok) {
        toast.error(respuesta.error || "Error al guardar.");
        return;
      }

      toast.success(
        empleadoEditar
          ? "Empleado actualizado correctamente."
          : "Empleado registrado correctamente."
      );
      cerrarModal();
      cargarPersonal();
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const manejarToggleEstado = async (empleado) => {
    const accion = empleado.estado === "ACTIVO" ? "desactivar" : "activar";
    if (!window.confirm(`¿Deseas ${accion} a ${empleado.nombre}?`)) return;
    try {
      const res = await apiFetch(`/api/personal/${empleado.id}/estado`, {
        method: "PATCH",
      });
      const datos = await res.json();
      if (!res.ok) {
        toast.error(datos.error || "Error al cambiar estado.");
        return;
      }
      toast.success(
        datos.estado === "ACTIVO"
          ? `${empleado.nombre} activado correctamente.`
          : `${empleado.nombre} desactivado correctamente.`
      );
      cargarPersonal();
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const manejarEliminar = async (empleado) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a ${empleado.nombre}? Esta acción no se puede deshacer.`
      )
    )
      return;
    try {
      const res = await apiFetch(`/api/personal/${empleado.id}`, {
        method: "DELETE",
      });
      const datos = await res.json();
      if (!res.ok) {
        toast.error(datos.error || "Error al eliminar.");
        return;
      }
      toast.success("Empleado eliminado correctamente.");
      cargarPersonal();
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const cocineros = personal.filter((e) => e.rol === "COCINERO");
  const despachadores = personal.filter((e) => e.rol === "DESPACHADOR");
  const activos = personal.filter((e) => e.estado === "ACTIVO").length;

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Personal</h1>
          <p>
            Administra los cocineros y despachadores de tu restaurante.
          </p>
        </div>

        <button
          className="btn-accion-principal btn-header"
          onClick={abrirModalNuevo}
        >
          <Plus size={18} />
          Agregar empleado
        </button>
      </div>

      {cargando && <p>Cargando personal...</p>}

      {!cargando && (
        <>
          <section className="metricas-grid tres-columnas">
            <article className="metrica-card">
              <div className="metrica-icon azul">
                <Users size={28} />
              </div>
              <div>
                <p>Total empleados</p>
                <h2>{personal.length}</h2>
                <span>Registrados</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon verde">
                <ChefHat size={28} />
              </div>
              <div>
                <p>Cocineros</p>
                <h2>{cocineros.length}</h2>
                <span>En el equipo</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon naranja">
                <Truck size={28} />
              </div>
              <div>
                <p>Despachadores</p>
                <h2>{despachadores.length}</h2>
                <span>En el equipo</span>
              </div>
            </article>
          </section>

          {personal.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}
            >
              <Users
                size={48}
                style={{ marginBottom: "1rem", opacity: 0.4 }}
              />
              <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                No tienes empleados registrados
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                Haz clic en "Agregar empleado" para comenzar
              </p>
            </div>
          ) : (
            <section className="tabla-pedidos-card">
              <table className="tabla-pedidos">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {personal.map((empleado) => (
                    <tr key={empleado.id}>
                      <td>
                        <div className="mesa-info">
                          <div
                            className={`mesa-icon ${
                              empleado.rol === "COCINERO" ? "azul" : "naranja"
                            }`}
                          >
                            {empleado.rol === "COCINERO" ? (
                              <ChefHat size={20} />
                            ) : (
                              <Truck size={20} />
                            )}
                          </div>
                          <div>
                            <strong>{empleado.nombre}</strong>
                          </div>
                        </div>
                      </td>

                      <td>{empleado.correo}</td>

                      <td>
                        <span
                          className={`estado-pill ${
                            empleado.rol === "COCINERO"
                              ? "confirmado"
                              : "nuevo"
                          }`}
                        >
                          {empleado.rol === "COCINERO"
                            ? "Cocinero"
                            : "Despachador"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`estado-pill ${
                            empleado.estado === "ACTIVO"
                              ? "nuevo"
                              : "pendiente"
                          }`}
                        >
                          {empleado.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div className="acciones-tabla">
                          <button
                            className="btn-ver"
                            onClick={() => abrirModalEditar(empleado)}
                          >
                            <Edit size={15} />
                            Editar
                          </button>

                          <button
                            className="btn-ok"
                            onClick={() => manejarToggleEstado(empleado)}
                          >
                            {empleado.estado === "ACTIVO" ? (
                              <UserX size={15} />
                            ) : (
                              <UserCheck size={15} />
                            )}
                            {empleado.estado === "ACTIVO"
                              ? "Desactivar"
                              : "Activar"}
                          </button>

                          <button
                            className="btn-eliminar"
                            onClick={() => manejarEliminar(empleado)}
                          >
                            <Trash2 size={15} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      {modalAbierto && (
        <Modal
          titulo={empleadoEditar ? "Editar empleado" : "Nuevo empleado"}
          onClose={cerrarModal}
        >
          <PersonalForm
            empleadoEditar={empleadoEditar}
            onGuardar={manejarGuardar}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Personal;