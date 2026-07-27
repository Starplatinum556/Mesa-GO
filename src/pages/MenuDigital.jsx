import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { urlImagen } from "../api";
import {
  obtenerMenuPorCodigoQr,
  crearORecuperarSesionCliente,
  guardarPedidoTemporal,
  confirmarPagoPedido,
} from "../services/menuService";

// MG-34: permite reconocer visualmente cada categoría.
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
  return (
    ICONOS_CATEGORIA[categoria.trim().toLowerCase()] || "🍴"
  );
}

function MenuDigital() {
  const { codigoQr } = useParams();

  // MG-52: evita procesar dos veces el mismo código QR
  // cuando React ejecuta el efecto nuevamente en desarrollo.
  const sesionProcesadaRef = useRef(null);

  const [mesa, setMesa] = useState(null);
  // Identidad visual del restaurante (logo, banner, color) — llega
  // en la misma respuesta del menú, no hace falta pedirla aparte.
  const [restaurante, setRestaurante] = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [claveCarrito, setClaveCarrito] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [pedidoTemporal, setPedidoTemporal] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [pagoConfirmado, setPagoConfirmado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Evitar dos solicitudes consecutivas para el mismo QR.
    if (sesionProcesadaRef.current === codigoQr) {
      return;
    }

    sesionProcesadaRef.current = codigoQr;

    const cargarMenu = async () => {
      setCargando(true);
      setError(null);

      try {
        // MG-64: cargar la mesa y el menú mediante el código QR.
        const datos = await obtenerMenuPorCodigoQr(codigoQr);

        // MG-52: buscar una sesión guardada para este QR.
        const claveSesion =
          `mesago_sesion_cliente_${codigoQr}`;

        const tokenGuardado =
          localStorage.getItem(claveSesion);

        // Crear una sesión temporal nueva o recuperar la activa.
        const datosSesion =
          await crearORecuperarSesionCliente(
            codigoQr,
            tokenGuardado
          );

        // Guardar el token asociado específicamente a esta mesa.
        localStorage.setItem(
          claveSesion,
          datosSesion.sesion.token
        );

        // Guardar los datos completos para el carrito y pedido.
        localStorage.setItem(
          "mesago_sesion_cliente_actual",
          JSON.stringify(datosSesion.sesion)
        );
        // MG-53: cada sesión temporal tendrá su propio carrito.
        const claveCarritoSesion =
          `mesago_carrito_sesion_${datosSesion.sesion.id}`;

        setClaveCarrito(claveCarritoSesion);

        // Recuperar el carrito guardado, si existe.
        const carritoGuardado =
          localStorage.getItem(claveCarritoSesion);

          if (carritoGuardado) {
            try {
              const productosGuardados =
                JSON.parse(carritoGuardado);

              setCarrito(
                Array.isArray(productosGuardados)
                  ? productosGuardados
                  : []
              );
            } catch {
              localStorage.removeItem(claveCarritoSesion);
              setCarrito([]);
            }
          } else {
            setCarrito([]);
          }

          // MG-57: recuperar el pedido temporal guardado de esta sesión.
          const clavePedidoTemporal =
            `mesago_pedido_temporal_${datosSesion.sesion.id}`;

          const pedidoTemporalGuardado =
            localStorage.getItem(clavePedidoTemporal);

          if (pedidoTemporalGuardado) {
            try {
              const pedidoRecuperado =
                JSON.parse(pedidoTemporalGuardado);

              setPedidoTemporal(pedidoRecuperado);
              setObservaciones(
                pedidoRecuperado.observaciones || ""
              );
            } catch {
              localStorage.removeItem(clavePedidoTemporal);
              setPedidoTemporal(null);
              setObservaciones("");
            }
          } else {
            setPedidoTemporal(null);
            setObservaciones("");
          }

          setMesa(datos.mesa);
          setRestaurante(datos.restaurante || null);
          setProductos(datos.productos);
      } catch (err) {
        // Permite volver a intentar si ocurrió un error.
        sesionProcesadaRef.current = null;

        const mensaje =
          err.message || "No se pudo cargar el menú.";

        setError(mensaje);
        toast.error(mensaje);
      } finally {
        setCargando(false);
      }
    };

    cargarMenu();
  }, [codigoQr]);
    // MG-53: guardar automáticamente el carrito de la sesión.
    useEffect(() => {
      if (!claveCarrito) {
        return;
      }

      localStorage.setItem(
        claveCarrito,
        JSON.stringify(carrito)
      );
    }, [carrito, claveCarrito]);
  const categorias = useMemo(() => {
    return [
      "Todas",
      ...new Set(
        productos
          .map((producto) => producto.categoria)
          .filter(Boolean)
      ),
    ];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const nombre = producto.nombre || "";
      const categoriaProducto =
        producto.categoria || "Sin categoría";

      const coincideBusqueda = nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideCategoria =
        categoria === "Todas" ||
        categoriaProducto === categoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  // MG-64: organizar los productos por categorías.
  const productosPorCategoria = useMemo(() => {
    const grupos = [];

    for (const producto of productosFiltrados) {
      const nombreCategoria =
        producto.categoria || "Sin categoría";

      let grupo = grupos.find(
        (item) => item.categoria === nombreCategoria
      );

      if (!grupo) {
        grupo = {
          categoria: nombreCategoria,
          productos: [],
        };

        grupos.push(grupo);
      }

      grupo.productos.push(producto);
    }

    return grupos;
  }, [productosFiltrados]);

// MG-53: agregar un producto o aumentar su cantidad.
const agregarProducto = (producto) => {
  setCarrito((anterior) => {
    const productoExistente = anterior.find(
      (item) => item.id === producto.id
    );

    if (productoExistente) {
      return anterior.map((item) =>
        item.id === producto.id
          ? {
              ...item,
              cantidad: (item.cantidad || 1) + 1,
            }
          : item
      );
    }

    return [
      ...anterior,
      {
        ...producto,
        cantidad: 1,
      },
    ];
  });

  toast.success(`${producto.nombre} agregado`);
};

// MG-53: aumentar la cantidad desde el carrito.
const aumentarCantidad = (productoId) => {
  setCarrito((anterior) =>
    anterior.map((item) =>
      item.id === productoId
        ? {
            ...item,
            cantidad: (item.cantidad || 1) + 1,
          }
        : item
    )
  );
};

// MG-53: disminuir sin permitir cantidades menores que uno.
const disminuirCantidad = (productoId) => {
  setCarrito((anterior) =>
    anterior.map((item) =>
      item.id === productoId
        ? {
            ...item,
            cantidad: Math.max(
              1,
              (item.cantidad || 1) - 1
            ),
          }
        : item
    )
  );
};

          // MG-53: eliminar completamente un producto.
          const eliminarProducto = (productoId) => {
            setCarrito((anterior) =>
              anterior.filter((item) => item.id !== productoId)
            );

            toast.success("Producto eliminado del carrito");
          };

          // MG-53: eliminar todos los productos.
          const vaciarCarrito = () => {
            setCarrito([]);
            toast.success("Carrito vaciado");
          };
          // MG-62: confirmar gráficamente el pago del pedido temporal.
    const manejarConfirmarPago = async () => {
      if (!pedidoTemporal?.id) {
        toast.error("Primero debes guardar el pedido temporal.");
        return;
      }

      const sesionGuardada = localStorage.getItem(
        "mesago_sesion_cliente_actual"
      );

      if (!sesionGuardada) {
        toast.error("No se encontró una sesión temporal activa.");
        return;
      }

      try {
        setConfirmandoPago(true);

        const sesion = JSON.parse(sesionGuardada);

        if (!sesion.token) {
          throw new Error("La sesión temporal no contiene un token válido.");
        }

        const respuesta = await confirmarPagoPedido({
          pedidoId: pedidoTemporal.id,
          tokenSesion: sesion.token,
          metodoPago,
          comprobante:
            metodoPago === "Tarjeta"
              ? `SIMULADO-${pedidoTemporal.codigo}`
              : null,
        });

        setPagoConfirmado(respuesta.pedido);
        setPedidoTemporal(null);
        setCarrito([]);
        setObservaciones("");

        localStorage.removeItem(
          `mesago_pedido_temporal_${sesion.id}`
        );

        if (claveCarrito) {
          localStorage.removeItem(claveCarrito);
        }

        toast.success(respuesta.mensaje);
      } catch (error) {
        toast.error(
          error.message || "No se pudo confirmar el pago."
        );
      } finally {
        setConfirmandoPago(false);
      }
    };
            // MG-57: guardar o actualizar el pedido temporal.
      const manejarPedidoTemporal = async () => {
        if (carrito.length === 0) {
          toast.error("Agrega al menos un producto al carrito.");
          return;
        }

        const sesionGuardada = localStorage.getItem(
          "mesago_sesion_cliente_actual"
        );

        if (!sesionGuardada) {
          toast.error("No se encontró una sesión temporal activa.");
          return;
        }

        try {
          setGuardandoPedido(true);

          const sesion = JSON.parse(sesionGuardada);

          if (!sesion.token) {
            throw new Error(
              "La sesión temporal no contiene un token válido."
            );
          }

          const productosPedido = carrito.map((producto) => ({
            producto_id: producto.id,
            cantidad: producto.cantidad || 1,
          }));

          const respuesta = await guardarPedidoTemporal({
            tokenSesion: sesion.token,
            productos: productosPedido,
            observaciones: observaciones.trim(),
          });

          setPedidoTemporal(respuesta.pedido);

          localStorage.setItem(
            `mesago_pedido_temporal_${sesion.id}`,
            JSON.stringify(respuesta.pedido)
          );

          toast.success(respuesta.mensaje);
        } catch (error) {
          toast.error(
            error.message || "No se pudo guardar el pedido temporal."
          );
        } finally {
          setGuardandoPedido(false);
        }
      };
      // Cantidad total de unidades agregadas.
      const cantidadTotal = carrito.reduce(
        (acumulado, producto) =>
          acumulado + (producto.cantidad || 1),
        0
      );

      // Total considerando precio y cantidad.
      const total = carrito.reduce(
        (acumulado, producto) =>
          acumulado +
          Number(producto.precio) *
            (producto.cantidad || 1),
        0
      );

          if (cargando) {
            return (
              <p className="estado-carga">
                Cargando menú...
              </p>
            );
          }

          if (error || !mesa) {
            return (
              <p className="estado-error">
                {error ||
                  "No se encontró la mesa asociada al código QR."}
              </p>
            );
          }

          return (
            <main className="menu-digital-pagina">
              {/* Banner de portada del restaurante — solo se muestra si el
                  ADMIN subió uno en Configuración (identidad visual). */}
              {restaurante?.banner && (
                <div className="menu-digital-banner">
                  <img
                    src={urlImagen(restaurante.banner)}
                    alt={`Banner de ${restaurante?.nombre || "MesaGo"}`}
                  />
                </div>
              )}

              <header className="menu-digital-header">
                <div className="menu-logo">
                  {restaurante?.logo ? (
                    <img
                      className="menu-logo-imagen"
                      src={urlImagen(restaurante.logo)}
                      alt={`Logo de ${restaurante?.nombre || "MesaGo"}`}
                    />
                  ) : (
                    <strong>
                      Mesa<span>Go</span>
                    </strong>
                  )}
                </div>

                <div>
                  <p>{mesa.zona}</p>
                  <h1>Mesa {mesa.numero}</h1>
                </div>

                  <button
                    type="button"
                    className="carrito-resumen"
                    onClick={() => setCarritoAbierto(true)}
                    aria-label="Abrir carrito de compras"
                  >
                    <ShoppingCart size={20} />

                    <span>
                      {cantidadTotal}{" "}
                      {cantidadTotal === 1
                        ? "producto"
                        : "productos"}
                    </span>

                    <strong>${total.toFixed(2)}</strong>
                  </button>
              </header>
        {carritoAbierto && (
          <div
            className="carrito-overlay"
            onClick={() => setCarritoAbierto(false)}
          >
            <aside
              className="carrito-panel"
              aria-label="Carrito de compras"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="carrito-panel-header">
                <div>
                  <p>Tu pedido</p>
                  <h2>Carrito de compras</h2>
                </div>

                <button
                  type="button"
                  className="carrito-cerrar"
                  onClick={() => setCarritoAbierto(false)}
                  aria-label="Cerrar carrito"
                >
                  <X size={22} />
                </button>
              </div>

              {pagoConfirmado ? (
          <div className="pago-confirmado-panel">
            <CheckCircle2 size={58} />

            <h3>¡Pedido enviado a cocina!</h3>

            <p>
              El pago fue confirmado y tu pedido ya está siendo recibido.
            </p>

            <div className="pago-confirmado-resumen">
              <div>
                <span>Código del pedido</span>
                <strong>{pagoConfirmado.codigo}</strong>
              </div>

              <div>
                <span>Método de pago</span>
                <strong>{pagoConfirmado.metodo_pago}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>
                  ${Number(pagoConfirmado.total).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>{pagoConfirmado.estado}</strong>
              </div>
            </div>

            <button
              type="button"
              className="carrito-guardar-pedido"
              onClick={() => setCarritoAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        ) : carrito.length === 0 ? (
        <div className="carrito-vacio">
          <ShoppingCart size={42} />

          <h3>Tu carrito está vacío</h3>

          <p>
            Agrega productos del menú para comenzar tu pedido.
          </p>

          <button
            type="button"
            onClick={() => setCarritoAbierto(false)}
          >
            Ver productos
          </button>
        </div>
      ) : (
        <>
          <div className="carrito-productos">
            {carrito.map((producto) => {
              const cantidad = producto.cantidad || 1;

              const subtotal =
                Number(producto.precio) * cantidad;

              return (
                <article
                  className="carrito-producto"
                  key={producto.id}
                >
                  <div
                    className="carrito-producto-icono"
                    style={{ overflow: "hidden", width: 58, height: 58, flexShrink: 0 }}
                  >
                    {producto.foto ? (
                      <img
                        src={urlImagen(producto.foto)}
                        alt={producto.nombre}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      obtenerIconoCategoria(
                        producto.categoria
                      )
                    )}
                  </div>

                  <div className="carrito-producto-info">
                    <h3>{producto.nombre}</h3>

                    <p>
                      ${Number(producto.precio).toFixed(2)}{" "}
                      por unidad
                    </p>

                    <div className="carrito-cantidad">
                      <button
                        type="button"
                        onClick={() =>
                          disminuirCantidad(producto.id)
                        }
                        disabled={cantidad === 1}
                        aria-label={`Disminuir cantidad de ${producto.nombre}`}
                      >
                        <Minus size={16} />
                      </button>

                      <strong>{cantidad}</strong>

                      <button
                        type="button"
                        onClick={() =>
                          aumentarCantidad(producto.id)
                        }
                        aria-label={`Aumentar cantidad de ${producto.nombre}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="carrito-producto-acciones">
                    <strong>
                      ${subtotal.toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      className="carrito-eliminar"
                      onClick={() =>
                        eliminarProducto(producto.id)
                      }
                      aria-label={`Eliminar ${producto.nombre}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

            <div className="carrito-panel-footer">
              <div className="pedido-observaciones">
                <label htmlFor="observaciones-pedido">
                  Observaciones del pedido
                </label>

                <textarea
                  id="observaciones-pedido"
                  value={observaciones}
                  onChange={(event) =>
                    setObservaciones(event.target.value)
                  }
                  maxLength={500}
                  placeholder="Ejemplo: sin cebolla, bebida sin hielo..."
                />

                <small>
                  {observaciones.length}/500 caracteres
                </small>
              </div>

              {pedidoTemporal && (
                <div className="pedido-temporal-guardado">
                  <span>Pedido temporal guardado</span>
                  <strong>{pedidoTemporal.codigo}</strong>
                </div>
              )}
              {pedidoTemporal && (
              <div className="pago-cliente-panel">
                <div className="pago-cliente-titulo">
                  <h3>Selecciona el método de pago</h3>
                  <p>
                    El pedido se enviará a cocina después de confirmar.
                  </p>
                </div>

                <div className="pago-metodos">
                  <label
                    className={`pago-metodo-opcion ${
                      metodoPago === "Efectivo" ? "activo" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value="Efectivo"
                      checked={metodoPago === "Efectivo"}
                      onChange={(event) =>
                        setMetodoPago(event.target.value)
                      }
                    />

                    <Wallet size={22} />

                    <span>
                      <strong>Efectivo</strong>
                      <small>Pago al recibir el pedido</small>
                    </span>
                  </label>

                  <label
                    className={`pago-metodo-opcion ${
                      metodoPago === "Tarjeta" ? "activo" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value="Tarjeta"
                      checked={metodoPago === "Tarjeta"}
                      onChange={(event) =>
                        setMetodoPago(event.target.value)
                      }
                    />

                    <CreditCard size={22} />

                    <span>
                      <strong>Tarjeta</strong>
                      <small>Validación simulada para esta versión</small>
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  className="carrito-confirmar-pago"
                  onClick={manejarConfirmarPago}
                  disabled={confirmandoPago}
                >
                  {confirmandoPago
                    ? "Confirmando pago..."
                    : `Confirmar pago de $${total.toFixed(2)}`}
                </button>
              </div>
            )}

              <div className="carrito-total">
                <span>
                  Total de {cantidadTotal}{" "}
                  {cantidadTotal === 1
                    ? "producto"
                    : "productos"}
                </span>

                <strong>${total.toFixed(2)}</strong>
              </div>

              <div className="carrito-acciones-finales">
                <button
                  type="button"
                  className="carrito-guardar-pedido"
                  onClick={manejarPedidoTemporal}
                  disabled={guardandoPedido}
                >
                  {guardandoPedido
                    ? "Guardando..."
                    : pedidoTemporal
                      ? "Actualizar pedido temporal"
                      : "Guardar pedido temporal"}
                </button>

                <button
                  type="button"
                  className="carrito-vaciar"
                  onClick={vaciarCarrito}
                  disabled={guardandoPedido}
                >
                  <Trash2 size={17} />
                  Vaciar carrito
                </button>
              </div>
            </div>
        </>
      )}
    </aside>
  </div>
)}
      <section className="menu-controles">
        <div className="busqueda-menu">
          <Search size={18} />

          <input
            type="text"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar productos..."
          />
        </div>

        <div className="categorias-menu">
          {categorias.map((item) => (
            <button
              type="button"
              key={item}
              className={
                categoria === item ? "activo" : ""
              }
              onClick={() => setCategoria(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {productosPorCategoria.map((grupo) => (
        <section
          className="categoria-menu-seccion"
          key={grupo.categoria}
        >
          <h2 className="categoria-menu-titulo">
            <span
              className="categoria-menu-icono"
              aria-hidden="true"
            >
              {obtenerIconoCategoria(
                grupo.categoria
              )}
            </span>

            {grupo.categoria}

            <span className="categoria-menu-contador">
              {grupo.productos.length}{" "}
              {grupo.productos.length === 1
                ? "producto"
                : "productos"}
            </span>
          </h2>

          <div className="productos-menu-grid">
            {grupo.productos.map((producto) => (
              <article
                className="producto-menu-card"
                key={producto.id}
              >
                <div className="producto-menu-imagen">
                  {producto.foto ? (
                    <img
                      src={urlImagen(producto.foto)}
                      alt={producto.nombre}
                    />
                  ) : (
                    obtenerIconoCategoria(
                      producto.categoria
                    )
                  )}
                </div>

                <div className="producto-menu-contenido">
                  <span>
                    {producto.categoria ||
                      "Sin categoría"}
                  </span>

                  <h3>{producto.nombre}</h3>

                  <p>
                    {producto.descripcion ||
                      "Sin descripción disponible."}
                  </p>

                  <div className="producto-menu-footer">
                    <strong>
                      $
                      {Number(
                        producto.precio
                      ).toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        agregarProducto(producto)
                      }
                    >
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