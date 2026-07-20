import { useEffect, useState } from "react";
import { Edit, Package, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  cambiarDisponibilidadProducto,
} from "../../services/productosService";
import Modal from "../../components/Modal";
import ProductoForm from "../../components/ProductoForm";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const cargarProductos = async () => {
    try {
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
    setProductoEditar(producto);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditar(null);
  };

  const manejarGuardar = async (datos) => {
    try {
      if (productoEditar) {
        await actualizarProducto(productoEditar.id, datos);
        toast.success("Producto actualizado correctamente.");
      } else {
        await crearProducto(datos);
        toast.success("Producto creado correctamente.");
      }
      cerrarModal();
      cargarProductos();
    } catch (err) {
      toast.error(err.message || "Error al guardar el producto.");
    }
  };

  const manejarEliminar = async (id) => {
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

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra productos, precios, categorías y disponibilidad del menú digital.</p>
        </div>

        <button className="btn-accion-principal btn-header" onClick={abrirModalNuevo}>
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <section className="barra-control productos-control">
        <div className="busqueda-pedidos">
          <Search size={19} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      {cargando && <p>Cargando productos...</p>}

      {!cargando && (
        <section className="tabla-pedidos-card">
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Disponibilidad</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.map((producto) => {
                const disponible = producto.disponible;

                return (
                  <tr key={producto.id} className={disponible ? "" : "fila-inactiva"}>
                    <td>
                      <div className="mesa-info">
                        <div className="mesa-icon azul">
                          <Package size={21} />
                        </div>
                        <div>
                          <strong>{producto.nombre}</strong>
                          <p>{producto.descripcion || "Sin descripción"}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="estado-pill confirmado">
                        {producto.categoria || "General"}
                      </span>
                    </td>

                    <td>
                      <strong>${Number(producto.precio).toFixed(2)}</strong>
                    </td>

                    <td>
                      <span className={disponible ? "estado-pill nuevo" : "estado-pill inactivo"}>
                        {disponible ? "Disponible" : "No disponible"}
                      </span>
                    </td>

                    <td>
                      <div className="acciones-tabla">
                        <button
                          className="btn-ver"
                          onClick={() => abrirModalEditar(producto)}
                        >
                          <Edit size={15} />
                          Editar
                        </button>

                        <button
                          className={disponible ? "btn-alerta" : "btn-ok"}
                          onClick={() => manejarToggleDisponibilidad(producto.id)}
                        >
                          {disponible ? (
                            <ToggleRight size={16} />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                          {disponible ? "Deshabilitar" : "Habilitar"}
                        </button>

                        <button
                          className="btn-eliminar"
                          onClick={() => manejarEliminar(producto.id)}
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
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