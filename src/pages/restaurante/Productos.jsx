import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Package,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../../components/Modal";
import ProductoForm from "../../components/ProductoForm";

import {
  actualizarProducto,
  cambiarDisponibilidadProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
} from "../../services/productosService";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const datos = await obtenerProductos();
      setProductos(datos);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const abrirCrear = () => {
    setProductoEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (producto) => {
    setProductoEditar(producto);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setProductoEditar(null);
    setModalAbierto(false);
  };

  const guardarProducto = async (datos) => {
    try {
      if (productoEditar) {
        await actualizarProducto(productoEditar.id, datos);
        toast.success("Producto actualizado correctamente");
      } else {
        await crearProducto(datos);
        toast.success("Producto creado correctamente");
      }

      cerrarModal();
      await cargarProductos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cambiarDisponibilidad = async (producto) => {
    try {
      const respuesta = await cambiarDisponibilidadProducto(producto.id);

      toast.success(
        respuesta.mensaje ||
          "Disponibilidad actualizada correctamente"
      );

      await cargarProductos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const manejarEliminar = async (producto) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${producto.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await eliminarProducto(producto.id);
      toast.success("Producto eliminado correctamente");
      await cargarProductos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const coincideBusqueda = producto.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideCategoria =
        categoria === "Todas" ||
        producto.categoria === categoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>
            Administra los productos, precios, categorías y disponibilidad.
          </p>
        </div>

        <button
          className="btn-accion-principal btn-header"
          onClick={abrirCrear}
        >
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <section className="barra-productos">
        <div className="busqueda-pedidos">
          <Search size={19} />

          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar producto..."
          />
        </div>

        <select
          className="select-categoria"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
        >
          <option value="Todas">Todas las categorías</option>
          <option value="Entradas">Entradas</option>
          <option value="Platos fuertes">Platos fuertes</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Postres">Postres</option>
        </select>
      </section>

      {cargando ? (
        <p className="estado-carga">Cargando productos...</p>
      ) : (
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
              {productosFiltrados.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <div className="mesa-info">
                      <div className="mesa-icon azul">
                        <Package size={21} />
                      </div>

                      <div>
                        <strong>{producto.nombre}</strong>
                        <p>{producto.descripcion}</p>
                      </div>
                    </div>
                  </td>

                  <td>{producto.categoria}</td>

                  <td>
                    <strong>
                      ${Number(producto.precio).toFixed(2)}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        producto.disponible
                          ? "estado-pill nuevo"
                          : "estado-pill pendiente"
                      }
                    >
                      {producto.disponible
                        ? "Disponible"
                        : "No disponible"}
                    </span>
                  </td>

                  <td>
                    <div className="acciones-tabla">
                      <button
                        className="btn-ver"
                        onClick={() => abrirEditar(producto)}
                      >
                        <Edit size={15} />
                        Editar
                      </button>

                      <button
                        className="btn-ok"
                        onClick={() =>
                          cambiarDisponibilidad(producto)
                        }
                      >
                        {producto.disponible ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}

                        Cambiar
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={() => manejarEliminar(producto)}
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

          {productosFiltrados.length === 0 && (
            <p className="estado-vacio">
              No se encontraron productos.
            </p>
          )}
        </section>
      )}

      {modalAbierto && (
        <Modal
          titulo={
            productoEditar
              ? "Editar producto"
              : "Agregar producto"
          }
          onClose={cerrarModal}
        >
          <ProductoForm
            productoEditar={productoEditar}
            onGuardar={guardarProducto}
            onCancelar={cerrarModal}
          />
        </Modal>
      )}
    </section>
  );
}

export default Productos;