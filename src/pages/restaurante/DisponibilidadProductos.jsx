import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Package, PackageCheck, PackageX, Search } from "lucide-react";
import toast from "react-hot-toast";
import Paginacion from "../../components/Paginacion";
import { cambiarDisponibilidadProducto, obtenerProductos } from "../../services/productosService";

const PRODUCTOS_POR_PAGINA = 8;
const COLORES_CATEGORIA = ["azul", "morado", "verde", "naranja", "rosado"];

// Le asigna siempre el mismo color a la misma categoría (determinístico
// por nombre, no aleatorio en cada render).
function colorDeCategoria(categoria = "") {
  let hash = 0;
  for (let i = 0; i < categoria.length; i++) {
    hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORES_CATEGORIA[Math.abs(hash) % COLORES_CATEGORIA.length];
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "—";
  return new Date(fechaIso).toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// MG-40: pantalla independiente del flujo de pedidos — el cocinero
// entra aquí cuando quiera, tenga o no pedidos activos, para marcar
// qué productos se le acabaron durante el servicio.
function DisponibilidadProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(null);

  const [pestana, setPestana] = useState("todos"); // todos | disponibles | agotados
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [pagina, setPagina] = useState(1);

  const cargarProductos = async () => {
    try {
      const datos = await obtenerProductos();
      setProductos(datos);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el catálogo de productos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const disponibles = productos.filter((p) => p.disponible);
  const agotados = productos.filter((p) => !p.disponible);

  const categorias = useMemo(() => {
    return ["Todas", ...new Set(productos.map((p) => p.categoria))];
  }, [productos]);

  // MG-40: el orden pedido es Todos -> Disponibles -> Agotados.
  const productosPorPestana = useMemo(() => {
    if (pestana === "disponibles") return disponibles;
    if (pestana === "agotados") return agotados;
    return productos;
  }, [pestana, productos, disponibles, agotados]);

  const productosFiltrados = useMemo(() => {
    return productosPorPestana.filter((producto) => {
      const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoria === "Todas" || producto.categoria === categoria;
      return coincideBusqueda && coincideCategoria;
    });
  }, [productosPorPestana, busqueda, categoria]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
  const productosPagina = productosFiltrados.slice(
    (pagina - 1) * PRODUCTOS_POR_PAGINA,
    pagina * PRODUCTOS_POR_PAGINA
  );

  const cambiarPestana = (nueva) => {
    setPestana(nueva);
    setPagina(1);
  };

  const alternarDisponibilidad = async (producto) => {
    setActualizando(producto.id);
    try {
      await cambiarDisponibilidadProducto(producto.id);
      toast.success(
        producto.disponible
          ? `${producto.nombre} marcado como agotado`
          : `${producto.nombre} marcado como disponible`
      );
      await cargarProductos();
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar la disponibilidad.");
    } finally {
      setActualizando(null);
    }
  };

  if (cargando) {
    return <p className="estado-carga">Cargando productos...</p>;
  }

  if (error) {
    return <p className="estado-error">{error}</p>;
  }

  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Productos agotados</h1>
        <p>Administra la disponibilidad de los productos del menú.</p>
      </div>

      <section className="metricas-grid tres-columnas">
        <article className="metrica-card">
          <div className="metrica-icon rojo">
            <PackageX size={28} />
          </div>
          <div>
            <p>Productos agotados</p>
            <h2>{agotados.length}</h2>
            <span>No disponibles para los clientes</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <PackageCheck size={28} />
          </div>
          <div>
            <p>Productos disponibles</p>
            <h2>{disponibles.length}</h2>
            <span>Disponibles en el menú</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <Package size={28} />
          </div>
          <div>
            <p>Total de productos</p>
            <h2>{productos.length}</h2>
            <span>En el menú del restaurante</span>
          </div>
        </article>
      </section>

      <section className="barra-control">
        <div className="tabs-pedidos">
          <button
            className={pestana === "todos" ? "activo" : ""}
            onClick={() => cambiarPestana("todos")}
          >
            Todos los productos <span>{productos.length}</span>
          </button>
          <button
            className={pestana === "disponibles" ? "activo" : ""}
            onClick={() => cambiarPestana("disponibles")}
          >
            Disponibles <span>{disponibles.length}</span>
          </button>
          <button
            className={pestana === "agotados" ? "activo" : ""}
            onClick={() => cambiarPestana("agotados")}
          >
            Agotados <span>{agotados.length}</span>
          </button>
        </div>
      </section>

      <div className="disponibilidad-filtros">
        <div className="busqueda-menu">
          <Search size={18} />
          <input
            type="text"
            id="busqueda"
            name="busqueda"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            placeholder="Buscar producto..."
          />
        </div>

        <select
          id="categoria"
          name="categoria"
          className="filtro-categoria"
          value={categoria}
          onChange={(evento) => {
            setCategoria(evento.target.value);
            setPagina(1);
          }}
        >
          {categorias.map((item) => (
            <option key={item} value={item}>
              {item === "Todas" ? "Todas las categorías" : item}
            </option>
          ))}
        </select>
      </div>

      {productosPagina.length === 0 ? (
        <p className="estado-vacio">No se encontraron productos.</p>
      ) : (
        <section className="tabla-pedidos-card">
          <table className="tabla-pedidos tabla-productos-disponibilidad">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha marcado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosPagina.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <div className="celda-producto">
                      <div className="producto-imagen-espacio">
                        <ImageIcon size={18} />
                      </div>
                      <div>
                        <strong>{producto.nombre}</strong>
                        {producto.descripcion && <p>{producto.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-categoria ${colorDeCategoria(producto.categoria)}`}>
                      {producto.categoria}
                    </span>
                  </td>
                  <td>
                    <span className={producto.disponible ? "badge-estado disponible" : "badge-estado agotado"}>
                      {producto.disponible ? "Disponible" : "Agotado"}
                    </span>
                  </td>
                  <td className="celda-fecha">{formatearFecha(producto.actualizado_en)}</td>
                  <td>
                    <button
                      className={producto.disponible ? "btn-marcar-agotado" : "btn-marcar-disponible"}
                      disabled={actualizando === producto.id}
                      onClick={() => alternarDisponibilidad(producto)}
                    >
                      {producto.disponible ? <PackageX size={16} /> : <PackageCheck size={16} />}
                      {actualizando === producto.id
                        ? "Actualizando..."
                        : producto.disponible
                        ? "Marcar agotado"
                        : "Marcar disponible"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tabla-footer tabla-footer-paginacion">
            <p>
              Mostrando {(pagina - 1) * PRODUCTOS_POR_PAGINA + 1} a{" "}
              {Math.min(pagina * PRODUCTOS_POR_PAGINA, productosFiltrados.length)} de{" "}
              {productosFiltrados.length} productos
            </p>
            <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiarPagina={setPagina} />
          </div>
        </section>
      )}

      <div className="banner-info">
        <div className="banner-info-icono">i</div>
        <div>
          <strong>¿Cómo funciona?</strong>
          <p>Los productos marcados como agotados no aparecerán en el menú digital de los clientes.</p>
        </div>
      </div>
    </section>
  );
}

export default DisponibilidadProductos;