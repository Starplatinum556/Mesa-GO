import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { obtenerMenuPorCodigoQr } from "../services/menuService";

// MG-34: pequeño toque visual para reconocer cada categoría de un
// vistazo. Si la categoría no está mapeada, usa un ícono genérico.
const ICONOS_CATEGORIA = {
  entradas: "🥗",
  "platos fuertes": "🍽️",
  principales: "🍽️",
  bebidas: "🥤",
  postres: "🍰",
  sopas: "🍲",
  ensaladas: "🥗",
  pizzas: "🍕",
  hamburguesas: "🍔",
  pastas: "🍝",
  mariscos: "🦐",
  carnes: "🥩",
  desayunos: "🍳",
  cafe: "☕",
  café: "☕",
  snacks: "🍟",
  vegetariano: "🥦",
};

function obtenerIconoCategoria(categoria = "") {
  return ICONOS_CATEGORIA[categoria.trim().toLowerCase()] || "🍴";
}

function MenuDigital() {
  const { codigoQr } = useParams();

  const [mesa, setMesa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);
  // MG-64: mensaje persistente para los casos de error (QR inexistente,
  // invalidado, mesa eliminada o falla interna). No basta con un toast
  // porque el cliente puede tardar en mirar la pantalla tras escanear.
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarMenu = async () => {
      setCargando(true);
      setError(null);

      try {
        // MG-64: 1) token recibido desde la URL (codigoQr) -> 2)-4) el
        // backend valida que exista/esté activo e identifica la mesa ->
        // 5)-6) devuelve el menú disponible organizado por categorías.
        const datos = await obtenerMenuPorCodigoQr(codigoQr);
        setMesa(datos.mesa);
        setProductos(datos.productos);
      } catch (err) {
        setError(err.message || "No se pudo cargar el menú.");
        toast.error(err.message || "No se pudo cargar el menú.");
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

  // MG-64: el menú debe visualizarse organizado por categorías, no como
  // una lista plana. Se agrupan los productos ya filtrados, respetando
  // el orden en que llegaron desde el backend (categoria, nombre).
  const productosPorCategoria = useMemo(() => {
    const grupos = [];
    for (const producto of productosFiltrados) {
      let grupo = grupos.find((g) => g.categoria === producto.categoria);
      if (!grupo) {
        grupo = { categoria: producto.categoria, productos: [] };
        grupos.push(grupo);
      }
      grupo.productos.push(producto);
    }
    return grupos;
  }, [productosFiltrados]);

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

  // MG-64: casos de error (QR inexistente/invalidado, mesa eliminada,
  // error interno) — no se muestra el menú en ninguno de estos casos.
  if (error || !mesa) {
    return (
      <p className="estado-error">
        {error || "No se encontró la mesa asociada al código QR."}
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

      {productosPorCategoria.map((grupo) => (
        <section className="categoria-menu-seccion" key={grupo.categoria}>
          <h2 className="categoria-menu-titulo">
            <span className="categoria-menu-icono" aria-hidden="true">
              {obtenerIconoCategoria(grupo.categoria)}
            </span>
            {grupo.categoria}
            <span className="categoria-menu-contador">
              {grupo.productos.length}{" "}
              {grupo.productos.length === 1 ? "producto" : "productos"}
            </span>
          </h2>

          <div className="productos-menu-grid">
            {grupo.productos.map((producto) => (
              <article className="producto-menu-card" key={producto.id}>
                <div className="producto-menu-imagen">
                  {obtenerIconoCategoria(producto.categoria)}
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
          </div>
        </section>
      ))}

      {productosFiltrados.length === 0 && (
        <p className="estado-vacio">
          No se encontraron productos disponibles.
        </p>
      )}
    </main>
  );
}

export default MenuDigital;