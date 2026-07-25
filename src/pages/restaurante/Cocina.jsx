import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChefHat, ClipboardList, Play } from "lucide-react";
import toast from "react-hot-toast";
import Paginacion from "../../components/Paginacion";
import {
  actualizarEstadoPedido,
  obtenerDetallePedido,
  obtenerPedidos,
} from "../../services/pedidosService";

const PEDIDOS_POR_PAGINA = 8;
const INTERVALO_POLLING_MS = 15000; // recarga automática de pedidos
const ESTADOS_COCINA = ["Nuevo", "En preparación"];

const ACCION_POR_ESTADO = {
  Nuevo: { etiqueta: "Iniciar preparación", siguienteEstado: "En preparación" },
  "En preparación": { etiqueta: "Marcar como listo", siguienteEstado: "Listo para entregar" },
};

// Clase de la pestaña "Todos" es un caso especial: no filtra por un único estado
const TODOS = "Todos";

function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function esDeHoy(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

// Agrupa los ítems del pedido por categoría (Entrada, Plato Fuerte, Bebidas, Postres...)
// tal como se ve en el mockup. Si el backend no envía "categoria" en los items,
// todo cae en un único grupo "Orden" para no romper la vista.
function agruparItemsPorCategoria(items = []) {
  const grupos = new Map();
  const SIN_CATEGORIA = "Orden";

  items.forEach((item) => {
    const clave = item.categoria || SIN_CATEGORIA;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(item);
  });

  return Array.from(grupos.entries()).map(([categoria, items]) => ({ categoria, items }));
}

function Cocina() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [pestana, setPestana] = useState(TODOS);
  const [pagina, setPagina] = useState(1);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [aplicandoAccion, setAplicandoAccion] = useState(false);

  const panelRef = useRef(null);
  const botonDisparadorRef = useRef(null);

  const cargarPedidos = async ({ mostrarCargando = false } = {}) => {
    if (mostrarCargando) setCargando(true);
    try {
      const datos = await obtenerPedidos();
      setPedidos(datos);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los pedidos.");
    } finally {
      if (mostrarCargando) setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos({ mostrarCargando: true });
    const idPolling = setInterval(() => cargarPedidos(), INTERVALO_POLLING_MS);
    return () => clearInterval(idPolling);
  }, []);

  useEffect(() => {
    if (!pedidoSeleccionado) return;

    const manejarTecla = (evento) => {
      if (evento.key === "Escape") cerrarDetalle();
    };

    document.addEventListener("keydown", manejarTecla);
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", manejarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoSeleccionado]);

  const pedidosCocina = useMemo(
    () => pedidos.filter((p) => ESTADOS_COCINA.includes(p.estado)),
    [pedidos]
  );
  const nuevos = useMemo(() => pedidosCocina.filter((p) => p.estado === "Nuevo"), [pedidosCocina]);
  const enPreparacion = useMemo(
    () => pedidosCocina.filter((p) => p.estado === "En preparación"),
    [pedidosCocina]
  );
  const listosParaEntregar = useMemo(
    () => pedidos.filter((p) => p.estado === "Listo para entregar"),
    [pedidos]
  );
  const pedidosHoy = useMemo(() => pedidos.filter((p) => esDeHoy(p.creado_en)), [pedidos]);

  const pedidosPestana =
    pestana === TODOS ? pedidosCocina : pestana === "Nuevo" ? nuevos : enPreparacion;

  const totalPaginas = Math.max(1, Math.ceil(pedidosPestana.length / PEDIDOS_POR_PAGINA));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const pedidosPagina = useMemo(
    () => pedidosPestana.slice((pagina - 1) * PEDIDOS_POR_PAGINA, pagina * PEDIDOS_POR_PAGINA),
    [pedidosPestana, pagina]
  );

  const cambiarPestana = (nueva) => {
    setPestana(nueva);
    setPagina(1);
  };

  const abrirDetalle = async (pedido, evento) => {
    botonDisparadorRef.current = evento?.currentTarget || botonDisparadorRef.current || null;
    setErrorDetalle(null);
    setPedidoSeleccionado({
      id: pedido.id,
      codigo: pedido.codigo,
      estado: pedido.estado,
      mesa: pedido.mesa,
      zona: pedido.zona,
    });
    setCargandoDetalle(true);
    try {
      const detalle = await obtenerDetallePedido(pedido.id);
      setPedidoSeleccionado(detalle);
    } catch (err) {
      setErrorDetalle(err.message || "No se pudo cargar el detalle del pedido.");
      toast.error(err.message || "No se pudo cargar el detalle del pedido.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
    setErrorDetalle(null);
    botonDisparadorRef.current?.focus();
  };

  const aplicarAccion = async () => {
    const accion = ACCION_POR_ESTADO[pedidoSeleccionado?.estado];
    if (!accion) return;

    setAplicandoAccion(true);
    try {
      await actualizarEstadoPedido(pedidoSeleccionado.id, accion.siguienteEstado);
      toast.success(`${pedidoSeleccionado.codigo} → ${accion.siguienteEstado}`);
      cerrarDetalle();
      await cargarPedidos();
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar el pedido.");
    } finally {
      setAplicandoAccion(false);
    }
  };

  const reintentarDetalle = () => {
    if (pedidoSeleccionado) abrirDetalle(pedidoSeleccionado);
  };

  const accionActual = pedidoSeleccionado ? ACCION_POR_ESTADO[pedidoSeleccionado.estado] : null;
  const gruposOrden = useMemo(
    () => agruparItemsPorCategoria(pedidoSeleccionado?.items),
    [pedidoSeleccionado]
  );

  const claseEstado = (estado) => {
    if (estado === "Nuevo") return "estado-pill nuevo";
    if (estado === "En preparación") return "estado-pill preparacion";
    if (estado === "Listo para entregar") return "estado-pill listo";
    return "estado-pill";
  };

  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Panel de Cocina</h1>
        <p>Gestiona y actualiza el estado de los pedidos en tiempo real.</p>
      </div>

      <section className="metricas-grid cuatro-columnas">
        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <ClipboardList size={26} />
          </div>
          <div>
            <p>Nuevos</p>
            <h2>{nuevos.length}</h2>
            <span>Por preparar</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon rojo">
            <ChefHat size={26} />
          </div>
          <div>
            <p>En preparación</p>
            <h2>{enPreparacion.length}</h2>
            <span>Cocinándose</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <Bell size={26} />
          </div>
          <div>
            <p>Listos para entregar</p>
            <h2>{listosParaEntregar.length}</h2>
            <span>Esperando despacho</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon morado">
            <ClipboardList size={26} />
          </div>
          <div>
            <p>Pedidos hoy</p>
            <h2>{pedidosHoy.length}</h2>
            <span>En total</span>
          </div>
        </article>
      </section>

      <section className="tabla-pedidos-card">
        <h2 className="pedidos-titulo">Pedidos</h2>

        <div className="tabs-pedidos">
          <button className={pestana === TODOS ? "activo" : ""} onClick={() => cambiarPestana(TODOS)}>
            Todos los pedidos <span>({pedidosCocina.length})</span>
          </button>
          <button className={pestana === "Nuevo" ? "activo" : ""} onClick={() => cambiarPestana("Nuevo")}>
            Nuevos <span>({nuevos.length})</span>
          </button>
          <button
            className={pestana === "En preparación" ? "activo" : ""}
            onClick={() => cambiarPestana("En preparación")}
          >
            En preparación <span>({enPreparacion.length})</span>
          </button>
        </div>

        {cargando && <p className="estado-carga">Cargando pedidos...</p>}
        {!cargando && error && <p className="estado-error">{error}</p>}
        {!cargando && !error && pedidosPestana.length === 0 && (
          <p className="estado-vacio">No hay pedidos en esta pestaña.</p>
        )}

        {!cargando && !error && pedidosPestana.length > 0 && (
          <div className={`contenedor-pedidos ${pedidoSeleccionado ? "con-detalle" : ""}`}>
            {/* 🧾 LISTA */}
            <div className="lista-pedidos">
              <table className="tabla-pedidos">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Mesa</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {pedidosPagina.map((pedido) => (
                    <tr key={pedido.id}>
                      <td><strong>{pedido.codigo}</strong></td>
                      <td>
                        Mesa {pedido.mesa}
                        {pedido.zona && <span className="fila-subtexto">{pedido.zona}</span>}
                      </td>
                      <td>{formatearHora(pedido.creado_en)}</td>
                      <td>
                        <span className={claseEstado(pedido.estado)}>{pedido.estado}</span>
                      </td>
                      <td>
                        <button className="btn-ver-detalle" onClick={(evento) => abrirDetalle(pedido, evento)}>
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="tabla-footer tabla-footer-paginacion">
                <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiarPagina={setPagina} />
              </div>
            </div>

            {/* 📦 DETALLE */}
            {pedidoSeleccionado && (
              <div
                className="detalle-pedido"
                role="dialog"
                aria-modal="true"
                aria-label="Detalle del pedido"
                tabIndex={-1}
                ref={panelRef}
              >
                <div className="detalle-header">
                  <h2>Detalle del pedido</h2>
                  <button onClick={cerrarDetalle} aria-label="Cerrar">✕</button>
                </div>

                <div className="detalle-codigo-fila">
                  <strong>{pedidoSeleccionado.codigo}</strong>
                </div>

                <div className="detalle-info">
                  <div>
                    <span>Mesa</span>
                    <strong>{pedidoSeleccionado.mesa}</strong>
                  </div>
                  <div>
                    <span>Zona</span>
                    <strong>{pedidoSeleccionado.zona || "—"}</strong>
                  </div>
                  <div>
                    <span>Hora</span>
                    <strong>
                      {pedidoSeleccionado.creado_en ? formatearHora(pedidoSeleccionado.creado_en) : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <span className={claseEstado(pedidoSeleccionado.estado)}>
                      {pedidoSeleccionado.estado || "—"}
                    </span>
                  </div>
                </div>

                {cargandoDetalle ? (
                  <div className="detalle-body">
                    <p className="estado-carga">Cargando detalle...</p>
                  </div>
                ) : errorDetalle ? (
                  <div className="detalle-body">
                    <div className="detalle-seccion detalle-error">
                      <p>{errorDetalle}</p>
                      <button className="btn-ver-detalle" onClick={reintentarDetalle}>
                        Reintentar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Parte fija: no se mueve al hacer scroll de los productos */}
                    <div className="detalle-fijo">
                      {pedidoSeleccionado.observaciones && (
                        <div className="detalle-seccion detalle-observaciones">
                          <h4>Observaciones del cliente</h4>
                          <p>{pedidoSeleccionado.observaciones}</p>
                        </div>
                      )}

                      <div className="detalle-seccion-header detalle-orden-header">
                        <h3 className="detalle-orden-titulo">Orden</h3>
                        <span>Cantidad</span>
                      </div>
                    </div>

                    {/* Solo esta parte hace scroll: los productos */}
                    <div className="detalle-body detalle-scroll">
                      {gruposOrden.map(({ categoria, items }) => (
                        <div className="detalle-seccion" key={categoria}>
                          {categoria !== "Orden" && <h4 className="detalle-categoria">{categoria}</h4>}
                          {items.map((item, indice) => (
                            <div className="detalle-item" key={item.id ?? indice}>
                              <span>{item.nombre}</span>
                              <strong>{item.cantidad}</strong>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!cargandoDetalle && !errorDetalle && accionActual && (
                  <div className="detalle-footer">
                    <button
                      className="btn-accion-principal"
                      disabled={aplicandoAccion}
                      onClick={aplicarAccion}
                    >
                      <Play size={16} fill="currentColor" />
                      {aplicandoAccion ? "Actualizando..." : accionActual.etiqueta}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export default Cocina;