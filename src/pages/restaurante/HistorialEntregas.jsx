import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ListChecks,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerDetalleEntrega,
  obtenerHistorialEntregas,
} from "../../services/entregasService";
import "../../styles/despachador/historial.css";

/* ──────────────────────────────
   Helpers
────────────────────────────── */
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonto(valor) {
  const numero = Number(valor);
  return (Number.isFinite(numero) ? numero : 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
  });
}

function claseBadgeEstado(estado) {
  if (estado === "Completado") return "mgh-badge mgh-badge-verde";
  if (estado === "Cancelado") return "mgh-badge mgh-badge-rojo";
  if (estado === "No entregado") return "mgh-badge mgh-badge-naranja";
  return "mgh-badge mgh-badge-gris";
}

function calcularPrecioUnitario(item) {
  const valor = item.precio_unitario ?? item.precio ?? 0;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

const FILTROS_INICIALES = { busqueda: "", desde: "", hasta: "", estado: "todos" };

/* ──────────────────────────────
   Modal de detalle
────────────────────────────── */
function ModalDetalle({ pedidoId, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    obtenerDetalleEntrega(pedidoId)
      .then((d) => {
        if (activo) setDetalle(d);
      })
      .catch((err) => {
        toast.error(err.message || "No se pudo cargar el detalle.");
        onCerrar();
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  return (
    <div className="mgh-modal-overlay" onClick={onCerrar}>
      <div className="mgh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mgh-modal-header">
          <div>
            <span className="mgh-modal-titulo">Detalle del pedido</span>
            <h2 className="mgh-modal-codigo">{detalle?.codigo || "..."}</h2>
          </div>
          <button className="mgh-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {cargando ? (
          <p className="mgh-cargando">Cargando detalle...</p>
        ) : !detalle ? null : (
          <div className="mgh-modal-cuerpo">
            <div className="mgh-modal-meta">
              <div>
                <span>Mesa</span>
                <strong>Mesa {detalle.mesa}</strong>
              </div>
              {detalle.zona && (
                <div>
                  <span>Zona</span>
                  <strong>{detalle.zona}</strong>
                </div>
              )}
              <div>
                <span>Fecha</span>
                <strong>{formatFecha(detalle.creado_en)} · {formatHora(detalle.creado_en)}</strong>
              </div>
              <div>
                <span>Estado</span>
                <span className={claseBadgeEstado(detalle.estado)}>{detalle.estado}</span>
              </div>
              {detalle.completado_por && (
                <div>
                  <span>Completado por</span>
                  <strong>{detalle.completado_por}</strong>
                </div>
              )}
            </div>

            {detalle.observaciones && (
              <div className="mgh-modal-obs">
                <span>Observaciones</span>
                <p>{detalle.observaciones}</p>
              </div>
            )}

            <div className="mgh-modal-items">
              {(detalle.items || []).map((item, i) => {
                const subtotal =
                  item.subtotal !== undefined
                    ? Number(item.subtotal)
                    : calcularPrecioUnitario(item) * Number(item.cantidad || 0);
                return (
                  <div key={i} className="mgh-modal-item">
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>{formatMonto(subtotal)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mgh-modal-total">
              <span>Total</span>
              <strong>{formatMonto(detalle.total)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────
   Componente principal
────────────────────────────── */
function HistorialEntregas() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [detalleId, setDetalleId] = useState(null);

  // Debounce simple: espera 400ms tras el último cambio de filtros
  // antes de disparar la consulta, para no golpear la API en cada
  // tecla que se escribe en el buscador.
  useEffect(() => {
    let activo = true;
    setCargando(true);
    const temporizador = setTimeout(() => {
      obtenerHistorialEntregas(filtros)
        .then((data) => {
          if (activo) setRegistros(data);
        })
        .catch((err) => {
          if (activo) toast.error(err.message || "No se pudo cargar el historial.");
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    }, 400);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [filtros]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const hayFiltrosActivos =
    filtros.busqueda || filtros.desde || filtros.hasta || filtros.estado !== "todos";

  /* ── Métricas (sobre los registros ya filtrados) ── */
  const totalRegistros = registros.length;
  const completados = useMemo(
    () => registros.filter((r) => r.estado === "Completado"),
    [registros]
  );
  const totalFacturado = useMemo(
    () => completados.reduce((acc, r) => acc + (Number(r.total) || 0), 0),
    [completados]
  );
  const ticketPromedio = completados.length ? totalFacturado / completados.length : 0;

  return (
    <section className="modulo-admin">
      {/* Header */}
      <div className="recepcion-header">
        <div>
          <h1>Historial de Entregas</h1>
          <p>Consulta los pedidos ya cerrados: completados, cancelados o no entregados.</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="mgh-metricas">
        <div className="mgh-metrica mgh-m-azul">
          <div className="mgh-metrica-icono">
            <ListChecks size={26} />
          </div>
          <div>
            <h2>{totalRegistros}</h2>
            <p>Registros</p>
            <span>Con los filtros actuales</span>
          </div>
        </div>

        <div className="mgh-metrica mgh-m-verde">
          <div className="mgh-metrica-icono">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <h2>{completados.length}</h2>
            <p>Completados</p>
            <span>Servicios cerrados con éxito</span>
          </div>
        </div>

        <div className="mgh-metrica mgh-m-naranja">
          <div className="mgh-metrica-icono">
            <DollarSign size={26} />
          </div>
          <div>
            <h2>{formatMonto(totalFacturado)}</h2>
            <p>Total facturado</p>
            <span>Solo pedidos completados</span>
          </div>
        </div>

        <div className="mgh-metrica mgh-m-morado">
          <div className="mgh-metrica-icono">
            <TrendingUp size={26} />
          </div>
          <div>
            <h2>{formatMonto(ticketPromedio)}</h2>
            <p>Ticket promedio</p>
            <span>Por pedido completado</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mgh-filtros">
        <div className="mgh-filtro-grupo">
          <span className="mgh-filtro-label">Buscar por código</span>
          <div className="mgh-filtro-input-icon">
            <Search size={15} />
            <input
              type="text"
              placeholder="Ej. MG-482913"
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro("busqueda", e.target.value)}
            />
          </div>
        </div>

        <div className="mgh-filtro-grupo">
          <span className="mgh-filtro-label">Desde</span>
          <div className="mgh-filtro-input-icon">
            <Calendar size={15} />
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => actualizarFiltro("desde", e.target.value)}
            />
          </div>
        </div>

        <div className="mgh-filtro-grupo">
          <span className="mgh-filtro-label">Hasta</span>
          <div className="mgh-filtro-input-icon">
            <Calendar size={15} />
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => actualizarFiltro("hasta", e.target.value)}
            />
          </div>
        </div>

        <div className="mgh-filtro-grupo">
          <span className="mgh-filtro-label">Estado</span>
          <select
            className="mgh-filtro-select"
            value={filtros.estado}
            onChange={(e) => actualizarFiltro("estado", e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
            <option value="No entregado">No entregado</option>
          </select>
        </div>

        {hayFiltrosActivos && (
          <button className="mgh-btn-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="mg48-col" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
              {["Fecha", "Código", "Mesa", "Productos", "Total", "Método", "Estado", "Observaciones", "Completado por", ""].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "0.85rem 1rem",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={10} className="mgh-cargando">Cargando historial...</td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={10} className="mgh-tabla-vacio">
                  No se encontraron registros con esos filtros.
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div className="mgh-fecha-celda">
                      <span>{formatFecha(r.creado_en)}</span>
                      <span className="mgh-hora">
                        <Clock size={11} style={{ marginRight: 4, verticalAlign: -2 }} />
                        {formatHora(r.creado_en)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 700 }}>{r.codigo}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>Mesa {r.mesa}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>{r.cantidad_productos}</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 700 }}>{formatMonto(r.total)}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>{r.metodo_pago || "—"}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span className={claseBadgeEstado(r.estado)}>{r.estado}</span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    {r.observaciones ? (
                      <span className="mgh-obs" title={r.observaciones}>{r.observaciones}</span>
                    ) : (
                      <span className="mgh-obs mgh-obs-vacio">Sin observaciones</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>{r.completado_por || "—"}</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <button className="mgh-btn-ver" onClick={() => setDetalleId(r.id)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mgh-tabla-footer">
          <span className="mgh-conteo">
            {registros.length} registro{registros.length !== 1 ? "s" : ""} encontrado{registros.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {detalleId && (
        <ModalDetalle pedidoId={detalleId} onCerrar={() => setDetalleId(null)} />
      )}
    </section>
  );
}

export default HistorialEntregas;