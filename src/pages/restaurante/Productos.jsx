import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  EyeOff,
  MoreVertical,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  cambiarDisponibilidadProducto,
  subirImagenProducto,
} from "../../services/productosService";
import { urlImagen } from "../../api";
import Modal from "../../components/Modal";
import ProductoForm from "../../components/ProductoForm";
// Los estilos de esta vista (clases pv-*) viven en tu index.css,
// junto con los tokens de mesago-tokens.css. No se importa un .css aparte
// para evitar el error de Vite por archivo no encontrado.

// Colores de badge por categoría. Si aparece una categoría nueva que no está
// aquí, cae en el "default" y no rompe nada.
const BADGES_CATEGORIA = {
  comida: "pv-badge--azul",
  bebidas: "pv-badge--cian",
  postres: "pv-badge--rosa",
  entradas: "pv-badge--ambar",
  default: "pv-badge--morado",
};

const ITEMS_POR_PAGINA_DEFAULT = 10;

function claseBadgeCategoria(categoria) {
  const key = (categoria || "").toLowerCase();
  return BADGES_CATEGORIA[key] || BADGES_CATEGORIA.default;
}

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(ITEMS_POR_PAGINA_DEFAULT);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const datos = await obtenerProductos();
      setProductos(datos);
    } catch (err) {
      toast.error(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const abrirModalNuevo = () => {
    setProductoEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setMenuAbiertoId(null);
    setProductoEditar(producto);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditar(null);
  };

  const manejarGuardar = async (datos, archivoImagen) => {
    try {
      const producto = productoEditar
        ? await actualizarProducto(productoEditar.id, datos)
        : await crearProducto(datos);

      // El backend devuelve el producto completo (con su id) tanto en
      // crear como en actualizar — por eso podemos subir la imagen
      // recién aquí, ya con el id confirmado.
      if (archivoImagen && producto?.id) {
        try {
          await subirImagenProducto(producto.id, archivoImagen);
        } catch (errImagen) {
          // El producto ya se guardó bien; si falla solo la foto,
          // avisamos aparte en vez de tratarlo como error general.
          toast.error(errImagen.message || "El producto se guardó, pero la imagen no se pudo subir.");
        }
      }

      toast.success(
        productoEditar ? "Producto actualizado correctamente." : "Producto creado correctamente."
      );
      cerrarModal();
      cargarProductos();
    } catch (err) {
      toast.error(err.message || "Error al guardar el producto.");
    }
  };

  const manejarEliminar = async (id) => {
    setMenuAbiertoId(null);
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      toast.success("Producto eliminado correctamente.");
      cargarProductos();
    } catch (err) {
      toast.error(err.message || "Error al eliminar el producto.");
    }
  };

  const manejarToggleDisponibilidad = async (id) => {
    try {
      await cambiarDisponibilidadProducto(id);
      toast.success("Disponibilidad actualizada.");
      cargarProductos();
    } catch (err) {
      toast.error(err.message || "Error al cambiar disponibilidad.");
    }
  };

  // ---- Derivados: categorías únicas, filtrado, stats, paginación ----
  // Desde MG-65 la categoría es una FK (categoria_id) y el backend
  // devuelve el nombre ya resuelto como "categoria_nombre".

  const categoriasUnicas = useMemo(() => {
    const mapa = new Map();
    productos.forEach((p) => {
      if (p.categoria_id && p.categoria_nombre && !mapa.has(p.categoria_id)) {
        mapa.set(p.categoria_id, p.categoria_nombre);
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideTexto =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.categoria_nombre || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria =
        filtroCategoria === "todas" || String(p.categoria_id) === filtroCategoria;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "disponible" && p.disponible) ||
        (filtroEstado === "no-disponible" && !p.disponible);

      return coincideTexto && coincideCategoria && coincideEstado;
    });
  }, [productos, busqueda, filtroCategoria, filtroEstado]);

  const stats = useMemo(() => {
    const total = productos.length;
    const disponibles = productos.filter((p) => p.disponible).length;
    const noDisponibles = total - disponibles;
    const categorias = categoriasUnicas.length;
    return { total, disponibles, noDisponibles, categorias };
  }, [productos, categoriasUnicas]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / itemsPorPagina));

  const productosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return productosFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [productosFiltrados, paginaActual, itemsPorPagina]);

  // Si cambian los filtros y la página actual queda fuera de rango, la reseteamos
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
    <section className="pv-modulo">
      <div className="pv-header">
        <div>
          <h1 className="pv-titulo">Gestión de Productos</h1>
          <p className="pv-subtitulo">
            Administra productos, precios, categorías y disponibilidad del menú digital.
          </p>
        </div>

        <button className="pv-btn-nuevo" onClick={abrirModalNuevo}>
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <div className="pv-stats">
        <div className="pv-stat-card">
          <div className="pv-stat-icono pv-stat-icono--morado">
            <Package size={22} />
          </div>
          <div>
            <p className="pv-stat-label">Total de productos</p>
            <p className="pv-stat-valor">{stats.total}</p>
            <p className="pv-stat-nota">En el menú digital</p>
          </div>
        </div>

        <div className="pv-stat-card">
          <div className="pv-stat-icono pv-stat-icono--verde">
            <ShoppingBasket size={22} />
          </div>
          <div>
            <p className="pv-stat-label">Disponibles</p>
            <p className="pv-stat-valor">{stats.disponibles}</p>
            <p className="pv-stat-nota">Productos activos</p>
          </div>
        </div>

        <div className="pv-stat-card">
          <div className="pv-stat-icono pv-stat-icono--naranja">
            <EyeOff size={22} />
          </div>
          <div>
            <p className="pv-stat-label">No disponibles</p>
            <p className="pv-stat-valor">{stats.noDisponibles}</p>
            <p className="pv-stat-nota">Productos inactivos</p>
          </div>
        </div>

        <div className="pv-stat-card">
          <div className="pv-stat-icono pv-stat-icono--azul">
            <Tag size={22} />
          </div>
          <div>
            <p className="pv-stat-label">Categorías</p>
            <p className="pv-stat-valor">{stats.categorias}</p>
            <p className="pv-stat-nota">En total</p>
          </div>
        </div>
      </div>

      <div className="pv-controles">
        <div className="pv-buscador">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar producto por nombre, categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="pv-select"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {categoriasUnicas.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <select
          className="pv-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="no-disponible">No disponible</option>
        </select>

        <button
          className="pv-btn-refrescar"
          onClick={cargarProductos}
          title="Refrescar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {cargando && <p className="pv-cargando">Cargando productos...</p>}

      {!cargando && productosPagina.length === 0 && (
        <p className="pv-vacio">No se encontraron productos con esos filtros.</p>
      )}

      {!cargando && productosPagina.length > 0 && (
        <div className="pv-grid">
          {productosPagina.map((producto) => {
            const disponible = producto.disponible;

            return (
              <div className="pv-card" key={producto.id}>
                <div className="pv-card-top-row">
                  <div className="pv-card-imagen">
                    <img
                      src={producto.imagen ? urlImagen(producto.imagen) : "/placeholder-producto.png"}
                      alt={producto.nombre}
                    />
                  </div>

                  <div className="pv-card-info">
                    <div className="pv-card-top">
                      <span className={`pv-badge ${claseBadgeCategoria(producto.categoria_nombre)}`}>
                        {producto.categoria_nombre || "Sin categoría"}
                      </span>

                      <button
                        className="pv-menu-btn"
                        onClick={() =>
                          setMenuAbiertoId(menuAbiertoId === producto.id ? null : producto.id)
                        }
                      >
                        <MoreVertical size={18} />
                      </button>

                      {menuAbiertoId === producto.id && (
                        <div className="pv-menu-dropdown">
                          <button onClick={() => toast("Función próximamente")}>
                            Duplicar producto
                          </button>
                          <button onClick={() => toast("Función próximamente")}>
                            Ver historial
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="pv-card-nombre">{producto.nombre}</h3>
                    <p className="pv-card-descripcion">
                      {producto.descripcion || "Sin descripción"}
                    </p>

                    <div className="pv-card-precio-fila">
                      <span className="pv-card-precio">
                        ${Number(producto.precio).toFixed(2)}
                      </span>

                      <span
                        className={`pv-estado ${
                          disponible ? "pv-estado--disponible" : "pv-estado--no-disponible"
                        }`}
                      >
                        <span className="pv-estado-punto" />
                        {disponible ? "Disponible" : "No disponible"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pv-card-acciones">
                  <button
                    className="pv-accion pv-accion--editar"
                    onClick={() => abrirModalEditar(producto)}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="pv-accion pv-accion--ver"
                    onClick={() => manejarToggleDisponibilidad(producto.id)}
                    title={disponible ? "Marcar no disponible" : "Marcar disponible"}
                  >
                    {disponible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>

                  <button
                    className="pv-accion pv-accion--eliminar"
                    onClick={() => manejarEliminar(producto.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!cargando && productosFiltrados.length > 0 && (
        <div className="pv-paginacion">
          <button
            className="pv-pagina-flecha"
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            <ChevronLeft size={18} />
          </button>

          {numerosDePagina.map((n, i) =>
            n === "..." ? (
              <span key={`ellipsis-${i}`} className="pv-pagina-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={n}
                className={`pv-pagina-num ${n === paginaActual ? "pv-pagina-num--activa" : ""}`}
                onClick={() => irAPagina(n)}
              >
                {n}
              </button>
            )
          )}

          <button
            className="pv-pagina-flecha"
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            <ChevronRight size={18} />
          </button>

          <div className="pv-mostrar">
            <span>Mostrar</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>de {productosFiltrados.length} productos</span>
          </div>
        </div>
      )}

      {modalAbierto && (
        <Modal
          titulo={productoEditar ? "Editar producto" : "Nuevo producto"}
          onClose={cerrarModal}
        >
          <ProductoForm
            productoEditar={productoEditar}
            onGuardar={manejarGuardar}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Productos;