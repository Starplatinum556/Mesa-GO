import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

function MenuDigital() {
  const { codigoQr } = useParams();

  const [mesa, setMesa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const respuesta = await fetch(
          `http://localhost:4000/api/menu/${codigoQr}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || "No se pudo cargar el menú"
          );
        }

        setMesa(datos.mesa);
        setProductos(datos.productos);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarMenu();
  }, [codigoQr]);

  const categorias = useMemo(() => {
    return [
      "Todas",
      ...new Set(productos.map((producto) => producto.categoria)),
    ];
  }, [productos]);

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

  const agregarProducto = (producto) => {
    setCarrito((anterior) => [...anterior, producto]);
    toast.success(`${producto.nombre} agregado`);
  };

  const total = carrito.reduce(
    (acumulado, producto) =>
      acumulado + Number(producto.precio),
    0
  );

  if (cargando) {
    return <p className="estado-carga">Cargando menú...</p>;
  }

  if (!mesa) {
    return (
      <p className="estado-error">
        No se encontró la mesa asociada al código QR.
      </p>
    );
  }

  return (
    <main className="menu-digital-pagina">
      <header className="menu-digital-header">
        <div className="menu-logo">
          <strong>
            Mesa<span>Go</span>
          </strong>
        </div>

        <div>
          <p>{mesa.zona}</p>
          <h1>Mesa {mesa.numero}</h1>
        </div>

        <div className="carrito-resumen">
          <ShoppingCart size={20} />
          <span>{carrito.length} productos</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
      </header>

      <section className="menu-controles">
        <div className="busqueda-menu">
          <Search size={18} />

          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar productos..."
          />
        </div>

        <div className="categorias-menu">
          {categorias.map((item) => (
            <button
              key={item}
              className={categoria === item ? "activo" : ""}
              onClick={() => setCategoria(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="productos-menu-grid">
        {productosFiltrados.map((producto) => (
          <article className="producto-menu-card" key={producto.id}>
            <div className="producto-menu-imagen">
              {producto.nombre.charAt(0)}
            </div>

            <div className="producto-menu-contenido">
              <span>{producto.categoria}</span>
              <h3>{producto.nombre}</h3>
              <p>{producto.descripcion}</p>

              <div className="producto-menu-footer">
                <strong>
                  ${Number(producto.precio).toFixed(2)}
                </strong>

                <button onClick={() => agregarProducto(producto)}>
                  + Agregar
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {productosFiltrados.length === 0 && (
        <p className="estado-vacio">
          No se encontraron productos disponibles.
        </p>
      )}
    </main>
  );
}

export default MenuDigital;