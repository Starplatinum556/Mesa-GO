import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch, urlImagen } from "../../api";
import Modal from "../../components/Modal";
import PersonalForm from "../../components/PersonalForm";

const ITEMS_POR_PAGINA_DEFAULT = 8;

function formatearFechaIngreso(fechaIso) {
  if (!fechaIso) return "—";
  return new Date(fechaIso).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Personal() {
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(ITEMS_POR_PAGINA_DEFAULT);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);

  const cargarPersonal = async () => {
    try {
      setCargando(true);
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
    setMenuAbiertoId(null);
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
    setMenuAbiertoId(null);
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
    setMenuAbiertoId(null);
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

  // ---- Derivados: filtrado, stats, paginación ----

  const personalFiltrado = useMemo(() => {
    return personal.filter((e) => {
      const textoBusqueda = busqueda.toLowerCase();
      const coincideTexto =
        e.nombre.toLowerCase().includes(textoBusqueda) ||
        (e.correo || "").toLowerCase().includes(textoBusqueda) ||
        (e.telefono || "").toLowerCase().includes(textoBusqueda);

      const coincideRol = filtroRol === "todos" || e.rol === filtroRol;

      const coincideEstado = filtroEstado === "todos" || e.estado === filtroEstado;

      return coincideTexto && coincideRol && coincideEstado;
    });
  }, [personal, busqueda, filtroRol, filtroEstado]);

  const stats = useMemo(() => {
    const total = personal.length;
    const cocineros = personal.filter((e) => e.rol === "COCINERO").length;
    const despachadores = personal.filter((e) => e.rol === "DESPACHADOR").length;
    const activos = personal.filter((e) => e.estado === "ACTIVO").length;
    return { total, cocineros, despachadores, activos };
  }, [personal]);

  const totalPaginas = Math.max(1, Math.ceil(personalFiltrado.length / itemsPorPagina));

  const personalPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return personalFiltrado.slice(inicio, inicio + itemsPorPagina);
  }, [personalFiltrado, paginaActual, itemsPorPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(1);
  }, [totalPaginas, paginaActual]);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
  };

  const numerosDePagina = useMemo(() => {
    if (totalPaginas <= 5) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    if (paginaActual <= 3) return [1, 2, 3, "...", totalPaginas];
    if (paginaActual >= totalPaginas - 2) {
      return [1, "...", totalPaginas - 2, totalPaginas - 1, totalPaginas];
    }
    return [1, "...", paginaActual, "...", totalPaginas];
  }, [totalPaginas, paginaActual]);

  return (
    <section className="pe-modulo">
      <div className="pe-header">
        <div>
          <h1 className="pe-titulo">Gestión de Personal</h1>
          <p className="pe-subtitulo">Administra a los empleados del restaurante y sus funciones.</p>
        </div>

        <button className="pe-btn-nuevo" onClick={abrirModalNuevo}>
          <Plus size={18} />
          Agregar empleado
        </button>
      </div>

      <div className="pe-stats">
        <div className="pe-stat-card">
          <div className="pe-stat-icono pe-stat-icono--azul">
            <Users size={22} />
          </div>
          <div>
            <p className="pe-stat-label">Total de empleados</p>
            <p className="pe-stat-valor">{stats.total}</p>
            <p className="pe-stat-nota">En el restaurante</p>
          </div>
        </div>

        <div className="pe-stat-card">
          <div className="pe-stat-icono pe-stat-icono--verde">
            <ChefHat size={22} />
          </div>
          <div>
            <p className="pe-stat-label">Cocineros</p>
            <p className="pe-stat-valor">{stats.cocineros}</p>
            <p className="pe-stat-nota">En cocina</p>
          </div>
        </div>

        <div className="pe-stat-card">
          <div className="pe-stat-icono pe-stat-icono--naranja">
            <Truck size={22} />
          </div>
          <div>
            <p className="pe-stat-label">Despachadores</p>
            <p className="pe-stat-valor">{stats.despachadores}</p>
            <p className="pe-stat-nota">En atención</p>
          </div>
        </div>

        <div className="pe-stat-card">
          <div className="pe-stat-icono pe-stat-icono--morado">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="pe-stat-label">Activos</p>
            <p className="pe-stat-valor">{stats.activos}</p>
            <p className="pe-stat-nota">Empleados activos</p>
          </div>
        </div>
      </div>

      <div className="pe-controles">
        <div className="pe-buscador">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar empleado por nombre, rol o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="pe-select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="todos">Todos los roles</option>
          <option value="COCINERO">Cocinero</option>
          <option value="DESPACHADOR">Despachador</option>
        </select>

        <select
          className="pe-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>

        <button className="pe-btn-refrescar" onClick={cargarPersonal} title="Refrescar">
          <RefreshCw size={18} />
        </button>
      </div>

      {cargando && <p className="pe-cargando">Cargando personal...</p>}

      {!cargando && personalPagina.length === 0 && (
        <div className="pe-vacio">
          <Users size={40} />
          <p className="pe-vacio-titulo">No se encontraron empleados</p>
          <p className="pe-vacio-texto">
            {personal.length === 0
              ? 'Haz clic en "Agregar empleado" para comenzar.'
              : "Prueba con otros filtros de búsqueda."}
          </p>
        </div>
      )}

      {!cargando && personalPagina.length > 0 && (
        <div className="pe-grid">
          {personalPagina.map((empleado) => {
            const esCocinero = empleado.rol === "COCINERO";
            const activo = empleado.estado === "ACTIVO";

            return (
              <div className="pe-card" key={empleado.id}>
                <div className="pe-card-header">
                  <div className="pe-avatar">
                    {empleado.foto ? (
                      <img src={urlImagen(empleado.foto)} alt={empleado.nombre} />
                    ) : (
                      <User size={22} />
                    )}
                  </div>

                  <div className="pe-header-derecha">
                    <button
                      className={`pe-estado-pill ${activo ? "pe-estado-pill--activo" : "pe-estado-pill--inactivo"}`}
                      onClick={() => manejarToggleEstado(empleado)}
                      title={activo ? "Clic para desactivar" : "Clic para activar"}
                    >
                      <span className="pe-estado-punto" />
                      {activo ? "Activo" : "Inactivo"}
                    </button>

                    <button
                      className="pe-menu-btn"
                      onClick={() =>
                        setMenuAbiertoId(menuAbiertoId === empleado.id ? null : empleado.id)
                      }
                    >
                      <MoreVertical size={18} />
                    </button>

                    {menuAbiertoId === empleado.id && (
                      <div className="pe-menu-dropdown">
                        <button onClick={() => manejarToggleEstado(empleado)}>
                          {activo ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => manejarEliminar(empleado)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="pe-nombre">{empleado.nombre}</h3>
                <span className={`pe-badge-rol ${esCocinero ? "pe-badge-rol--morado" : "pe-badge-rol--naranja"}`}>
                  {esCocinero ? <ChefHat size={13} /> : <Truck size={13} />}
                  {esCocinero ? "Cocinero" : "Despachador"}
                </span>

                <div className="pe-datos">
                  <p>
                    <Phone size={14} />
                    {empleado.telefono || "Sin teléfono"}
                  </p>
                  <p>
                    <Mail size={14} />
                    {empleado.correo}
                  </p>
                  <p>
                    <Calendar size={14} />
                    Ingreso: {formatearFechaIngreso(empleado.fecha_ingreso)}
                  </p>
                </div>

                <div className="pe-acciones">
                  {/* "Ver" abre el mismo modal de edición por ahora — si quieres
                      una vista de solo lectura separada, depende de que
                      PersonalForm soporte un modo "soloLectura". */}
                  <button className="pe-accion pe-accion--ver" onClick={() => abrirModalEditar(empleado)}>
                    <Eye size={14} />
                    Ver
                  </button>

                  <button className="pe-accion pe-accion--editar" onClick={() => abrirModalEditar(empleado)}>
                    <Edit size={14} />
                    Editar
                  </button>

                  <button className="pe-accion pe-accion--eliminar" onClick={() => manejarEliminar(empleado)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!cargando && personalFiltrado.length > 0 && (
        <div className="pe-paginacion">
          <button
            className="pe-pagina-flecha"
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            <ChevronLeft size={18} />
          </button>

          {numerosDePagina.map((n, i) =>
            n === "..." ? (
              <span key={`ellipsis-${i}`} className="pe-pagina-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={n}
                className={`pe-pagina-num ${n === paginaActual ? "pe-pagina-num--activa" : ""}`}
                onClick={() => irAPagina(n)}
              >
                {n}
              </button>
            )
          )}

          <button
            className="pe-pagina-flecha"
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            <ChevronRight size={18} />
          </button>

          <div className="pe-mostrar">
            <span>Mostrar</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
            >
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
            <span>de {personalFiltrado.length} empleados</span>
          </div>
        </div>
      )}

      {modalAbierto && (
        <Modal titulo={empleadoEditar ? "Editar empleado" : "Nuevo empleado"} onClose={cerrarModal}>
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