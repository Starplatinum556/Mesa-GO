import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Lightbulb,
  ShoppingBag,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import Paginacion from "../../components/Paginacion";
import {
  completarServicio,
  marcarEntregado,
  obtenerDetalleEntrega,
  obtenerEntregas,
  obtenerHistorialEntregas,
} from "../../services/entregasService";

const POR_PAGINA = 4;

/* ──────────────────────────────
   Icono de mesa (SVG inline)
────────────────────────────── */
function IconoMesa({ color, bg }) {
  return (
    <div className="mg48-card-icono" style={{ background: bg }}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="11" width="18" height="4" rx="2" fill={color} />
        <rect x="9" y="15" width="2" height="5" rx="1" fill={color} />
        <rect x="15" y="15" width="2" height="5" rx="1" fill={color} />
        <rect x="1" y="7" width="5" height="6" rx="1.5" fill={color} opacity="0.65" />
        <rect x="20" y="7" width="5" height="6" rx="1.5" fill={color} opacity="0.65" />
      </svg>
    </div>
  );
}

/* ──────────────────────────────
   Icono de plato listo para servir (SVG inline)
   MG-48: reemplaza el ícono de mesa en las tarjetas "Listo" — una
   cúpula (cloche) que representa el plato cubierto, listo para que
   el mesero lo lleve a la mesa.
────────────────────────────── */
function IconoPlato({ color, bg }) {
  return (
    <div className="mg48-card-icono" style={{ background: bg }}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base / plato */}
        <ellipse cx="13" cy="19" rx="10" ry="2.2" fill={color} opacity="0.65" />
        {/* Cúpula que cubre el plato */}
        <path d="M4 15.5C4 9.7 8.3 5.5 13 5.5C17.7 5.5 22 9.7 22 15.5H4Z" fill={color} />
        {/* Manija superior */}
        <circle cx="13" cy="4" r="1.6" fill={color} />
        <rect x="12.2" y="4.6" width="1.6" height="2" rx="0.8" fill={color} />
      </svg>
    </div>
  );
}

/* ──────────────────────────────
   Tarjeta pedido LISTO
────────────────────────────── */
function TarjetaListo({ pedido, onDetalle }) {
  return (
    <article className="mg48-tarjeta">
      <div className="mg48-tarjeta-top">
        <IconoPlato color="#ea580c" bg="#fff3ec" />
        <div className="mg48-tarjeta-info">
          <span className="mg48-tarjeta-mesa">Mesa {pedido.mesa}</span>
          <div className="mg48-tarjeta-fila">
            <strong className="mg48-tarjeta-codigo">{pedido.codigo}</strong>
            <span className="mg48-badge mg48-badge-listo">Listo</span>
          </div>
          <div className="mg48-tarjeta-meta">
            <Clock size={13} />
            <span>{formatHora(pedido.creado_en)}</span>
            <span className="mg48-tarjeta-sep">·</span>
            <span>{pedido.cantidad_productos} producto{pedido.cantidad_productos !== "1" ? "s" : ""}</span>
          </div>
        </div>
      </div>
      <button
        className="mg48-btn-detalle"
        onClick={() => onDetalle(pedido)}
      >
        Detalles del pedido
      </button>
    </article>
  );
}

/* ──────────────────────────────
   Tarjeta pedido ENTREGADO
────────────────────────────── */
function TarjetaEntregado({ pedido, onFinalizar, cargando }) {
  return (
    <article className="mg48-tarjeta">
      <div className="mg48-tarjeta-top">
        <IconoMesa color="#16a34a" bg="#f0fdf4" />
        <div className="mg48-tarjeta-info">
          <span className="mg48-tarjeta-mesa">Mesa {pedido.mesa}</span>
          <div className="mg48-tarjeta-fila">
            <strong className="mg48-tarjeta-codigo">{pedido.codigo}</strong>
            <span className="mg48-badge mg48-badge-entregado">Entregado</span>
          </div>
          <div className="mg48-tarjeta-meta">
            <Clock size={13} />
            <span>{formatHora(pedido.creado_en)}</span>
            <span className="mg48-tarjeta-sep">·</span>
            <span>{pedido.cantidad_productos} producto{pedido.cantidad_productos !== "1" ? "s" : ""}</span>
          </div>
        </div>
      </div>
      <button
        className="mg48-btn-finalizar"
        disabled={cargando}
        onClick={() => onFinalizar(pedido)}
      >
        <CheckCircle2 size={16} />
        {cargando ? "Abriendo..." : "Finalizar servicio"}
      </button>
    </article>
  );
}

/* ──────────────────────────────
   Helpers
────────────────────────────── */
function formatHora(iso) {
  return new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuracion(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function esHoy(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  return (
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate()
  );
}

// MG-48: resumen de finalización de servicio (estilo ticket). NO es
// un comprobante fiscal — solo un resumen interno para que el
// despachador confirme qué se está cerrando antes de liberar la mesa.
// Se asume "item.precio" como precio unitario; si el backend lo
// nombra distinto (p. ej. "precio_unitario"), ya queda cubierto acá.
function calcularPrecioUnitario(item) {
  const valor = item.precio_unitario ?? item.precio ?? 0;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function formatMonto(valor) {
  return valor.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
  });
}

/* ──────────────────────────────
   Componente principal
────────────────────────────── */
function Entregas() {
  const [pedidos, setPedidos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [detalle, setDetalle] = useState(null);
  // MG-48: "ver" muestra el detalle normal del pedido (Listos);
  // "finalizar" muestra el resumen tipo ticket antes de confirmar
  // la finalización del servicio (Entregados).
  const [modoDetalle, setModoDetalle] = useState("ver");
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [aplicandoAccion, setAplicandoAccion] = useState(false);
  const [abriendoFinalizarId, setAbriendoFinalizarId] = useState(null);

  const [paginaListos, setPaginaListos] = useState(1);
  const [paginaEntregados, setPaginaEntregados] = useState(1);

  /* ── Carga inicial ── */
  const cargar = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        obtenerEntregas(),
        // MGH: el endpoint ahora también puede traer Cancelado/No
        // entregado — acá solo nos interesan los Completado para las
        // métricas del panel principal (completados hoy, tiempo promedio).
        obtenerHistorialEntregas({ estado: "Completado" }),
      ]);
      setPedidos(p);
      setHistorial(h);
    } catch (err) {
      toast.error(err.message || "No se pudo cargar el panel.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* ── Derivados ── */
  const listos = useMemo(
    () => pedidos.filter((p) => ["Listo", "Listo para entregar"].includes(p.estado)),
    [pedidos]
  );
  const entregados = useMemo(
    () => pedidos.filter((p) => p.estado === "Entregado"),
    [pedidos]
  );
  const completadosHoy = useMemo(
    () => historial.filter((p) => esHoy(p.creado_en)).length,
    [historial]
  );
  const tiempoPromedio = useMemo(() => {
    const hoy = historial.filter((p) => esHoy(p.creado_en));
    if (!hoy.length) return "—";
    const avg =
      hoy.reduce((acc, p) => acc + (Date.now() - new Date(p.creado_en).getTime()), 0) /
      hoy.length;
    return formatDuracion(avg);
  }, [historial]);

  // MG-48: total del ticket de finalización — se toma directo de
  // "pedidos.total" (ya corregido en la BD), sin recalcular en el
  // frontend. Solo si por algún motivo no llega el total, se cae a
  // sumar los subtotales de los items como respaldo.
  const totalFactura = useMemo(() => {
    const totalBackend = Number(detalle?.total);
    if (detalle?.total !== undefined && detalle?.total !== null && Number.isFinite(totalBackend)) {
      return totalBackend;
    }
    if (!detalle?.items) return 0;
    return detalle.items.reduce(
      (acc, item) =>
        acc + (item.subtotal !== undefined
          ? Number(item.subtotal)
          : calcularPrecioUnitario(item) * Number(item.cantidad || 0)),
      0
    );
  }, [detalle]);

  /* ── Paginación ── */
  const totalPagListos = Math.max(1, Math.ceil(listos.length / POR_PAGINA));
  const totalPagEntregados = Math.max(1, Math.ceil(entregados.length / POR_PAGINA));
  const listosPage = listos.slice((paginaListos - 1) * POR_PAGINA, paginaListos * POR_PAGINA);
  const entregadosPage = entregados.slice((paginaEntregados - 1) * POR_PAGINA, paginaEntregados * POR_PAGINA);

  /* ── Acciones ── */
  const abrirDetalle = async (pedido) => {
    setModoDetalle("ver");
    setCargandoDetalle(true);
    setDetalle({ id: pedido.id, codigo: pedido.codigo });
    try {
      const d = await obtenerDetalleEntrega(pedido.id);
      setDetalle(d);
    } catch (err) {
      toast.error(err.message);
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const accionEntregar = async () => {
    if (!detalle) return;
    setAplicandoAccion(true);
    try {
      await marcarEntregado(detalle.id);
      toast.success(`${detalle.codigo} marcado como entregado.`);
      setDetalle(null);
      await cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAplicandoAccion(false);
    }
  };

  // MG-48: en vez del confirm() del navegador, se abre el mismo panel
  // de detalle pero en modo "ticket" (ver abajo en el render), con la
  // info del pedido cargada desde el backend, para que el despachador
  // revise qué se va a cerrar antes de confirmar.
  const abrirFinalizar = async (pedido) => {
    setModoDetalle("finalizar");
    setAbriendoFinalizarId(pedido.id);
    setCargandoDetalle(true);
    setDetalle({ id: pedido.id, codigo: pedido.codigo, mesa: pedido.mesa });
    try {
      const d = await obtenerDetalleEntrega(pedido.id);
      setDetalle(d);
    } catch (err) {
      toast.error(err.message);
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
      setAbriendoFinalizarId(null);
    }
  };

  const confirmarFinalizar = async () => {
    if (!detalle) return;
    setAplicandoAccion(true);
    try {
     const respuesta = await completarServicio(detalle.id);

      toast.success(
        respuesta?.mensaje ||
          `Servicio completado para la Mesa ${detalle.mesa}.`
      );
      setDetalle(null);
      setModoDetalle("ver");
      await cargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAplicandoAccion(false);
    }
  };

  /* ── Render ── */
  if (cargando) {
    return (
      <section className="modulo-admin">
        <p className="mg48-cargando">Cargando panel de entregas...</p>
      </section>
    );
  }

  return (
    <section className="modulo-admin">
      {/* Header */}
      <div className="recepcion-header">
        <div>
          <h1>Panel de Entregas</h1>
          <p>Gestiona las entregas de pedidos y finalización de servicios.</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="mg48-metricas">
        <div className="mg48-metrica mg48-metrica-naranja">
          <div className="mg48-metrica-icono">
            <ShoppingBag size={26} />
          </div>
          <div>
            <h2>{listos.length}</h2>
            <p>Listos para entregar</p>
            <span>Pedidos esperando</span>
          </div>
        </div>

        <div className="mg48-metrica mg48-metrica-verde">
          <div className="mg48-metrica-icono">
            <Truck size={26} />
          </div>
          <div>
            <h2>{entregados.length}</h2>
            <p>Entregados</p>
            <span>Pendientes de finalizar</span>
          </div>
        </div>

        <div className="mg48-metrica mg48-metrica-azul">
          <div className="mg48-metrica-icono">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <h2>{completadosHoy}</h2>
            <p>Completados hoy</p>
            <span>Servicios finalizados</span>
          </div>
        </div>

        <div className="mg48-metrica mg48-metrica-morado">
          <div className="mg48-metrica-icono">
            <Clock size={26} />
          </div>
          <div>
            <h2>{tiempoPromedio}</h2>
            <p>Tiempo promedio</p>
            <span>Por servicio hoy</span>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="mg48-grid">
        {/* Columna izquierda — Listos */}
        <div className="mg48-col">
          <div className="mg48-col-header">
            <h3>Listos para entregar</h3>
            <span className="mg48-col-badge mg48-col-badge-naranja">{listos.length}</span>
          </div>

          {listos.length === 0 ? (
            <div className="mg48-vacio">
              <ShoppingBag size={36} opacity={0.3} />
              <p>Sin pedidos listos</p>
            </div>
          ) : (
            <>
              <div className="mg48-tarjetas">
                {listosPage.map((p) => (
                  <TarjetaListo key={p.id} pedido={p} onDetalle={abrirDetalle} />
                ))}
              </div>
              {totalPagListos > 1 && (
                <div className="mg48-paginacion">
                  <Paginacion
                    paginaActual={paginaListos}
                    totalPaginas={totalPagListos}
                    onCambiarPagina={setPaginaListos}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Columna central — Entregados */}
        <div className="mg48-col">
          <div className="mg48-col-header">
            <h3>Entregados <span className="mg48-col-sub">(pendientes de finalizar)</span></h3>
            <span className="mg48-col-badge mg48-col-badge-verde">{entregados.length}</span>
          </div>

          {entregados.length === 0 ? (
            <div className="mg48-vacio">
              <Truck size={36} opacity={0.3} />
              <p>Sin pedidos entregados pendientes</p>
            </div>
          ) : (
            <>
              <div className="mg48-tarjetas">
                {entregadosPage.map((p) => (
                  <TarjetaEntregado
                    key={p.id}
                    pedido={p}
                    onFinalizar={abrirFinalizar}
                    cargando={abriendoFinalizarId === p.id}
                  />
                ))}
              </div>
              {totalPagEntregados > 1 && (
                <div className="mg48-paginacion">
                  <Paginacion
                    paginaActual={paginaEntregados}
                    totalPaginas={totalPagEntregados}
                    onCambiarPagina={setPaginaEntregados}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Columna derecha — Detalle / Ticket de finalización */}
        <div className={modoDetalle === "finalizar" ? "mg48-detalle mg48-factura" : "mg48-detalle"}>
          {!detalle ? (
            <div className="mg48-detalle-vacio">
              <ShoppingBag size={40} opacity={0.2} />
              <p>Selecciona un pedido<br />para ver el detalle</p>
            </div>
          ) : modoDetalle === "finalizar" ? (
            <>
              <div className="mg48-factura-encabezado">
                <span className="mg48-factura-marca">MesaGo</span>
                <span className="mg48-factura-subtitulo">Resumen de servicio</span>
                <span className="mg48-factura-codigo">{detalle.codigo}</span>
                <span className="mg48-factura-aviso">
                  Documento interno · no es un comprobante fiscal
                </span>
              </div>

              {cargandoDetalle ? (
                <div className="mg48-detalle-cuerpo">
                  <p className="mg48-cargando">Cargando resumen...</p>
                </div>
              ) : (
                <>
                  <div className="mg48-factura-cuerpo">
                    <div className="mg48-factura-meta">
                      <span>Mesa</span>
                      <strong>Mesa {detalle.mesa}</strong>
                    </div>
                    <div className="mg48-factura-meta">
                      <span>Hora</span>
                      <strong>{formatHora(detalle.creado_en)}</strong>
                    </div>

                    <div className="mg48-factura-divisor" />

                    <div className="mg48-factura-items">
                      {(detalle.items || []).map((item, i) => {
                        const subtotal =
                          item.subtotal !== undefined
                            ? Number(item.subtotal)
                            : calcularPrecioUnitario(item) * Number(item.cantidad || 0);
                        return (
                          <div key={i} className="mg48-factura-item">
                            <span className="mg48-factura-item-nombre">
                              {item.cantidad}x {item.nombre}
                            </span>
                            <span className="mg48-factura-item-precio">
                              {formatMonto(subtotal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mg48-factura-divisor" />

                    <div className="mg48-factura-total">
                      <span>Total</span>
                      <strong>{formatMonto(totalFactura)}</strong>
                    </div>
                  </div>

                  <div className="mg48-detalle-footer mg48-factura-footer">
                    <button
                      className="mg48-btn-entregar"
                      disabled={aplicandoAccion}
                      onClick={confirmarFinalizar}
                    >
                      <CheckCircle2 size={18} />
                      {aplicandoAccion ? "Finalizando..." : "Confirmar finalización"}
                    </button>
                    <button
                      className="mg48-btn-cancelar-factura"
                      disabled={aplicandoAccion}
                      onClick={() => {
                        setDetalle(null);
                        setModoDetalle("ver");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="mg48-detalle-encabezado">
                <span className="mg48-detalle-titulo">Detalle del pedido</span>
                <h2 className="mg48-detalle-codigo">{detalle.codigo}</h2>
              </div>

              {cargandoDetalle ? (
                <div className="mg48-detalle-cuerpo">
                  <p className="mg48-cargando">Cargando detalle...</p>
                </div>
              ) : (
                <>
                  <div className="mg48-detalle-cuerpo">
                    {/* Info row */}
                    <div className="mg48-detalle-info">
                      <div>
                        <span>Mesa</span>
                        <strong>Mesa {detalle.mesa}</strong>
                      </div>
                      <div>
                        <span>Hora</span>
                        <strong>{formatHora(detalle.creado_en)}</strong>
                      </div>
                      <div>
                        <span>Estado</span>
                        <span className="mg48-badge mg48-badge-listo">
                          {detalle.estado}
                        </span>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {detalle.observaciones && (
                      <div className="mg48-detalle-obs">
                        <span>Observaciones del cliente</span>
                        <p>{detalle.observaciones}</p>
                      </div>
                    )}

                    {/* Productos */}
                    <div className="mg48-detalle-productos">
                      <div className="mg48-detalle-productos-header">
                        <strong>Productos</strong>
                      </div>
                      <div className="mg48-detalle-productos-thead">
                        <span>Producto</span>
                        <span>Cantidad</span>
                      </div>
                      <div className="mg48-detalle-items">
                        {(detalle.items || []).map((item, i) => (
                          <div key={i} className="mg48-detalle-item">
                            <span>{item.nombre}</span>
                            <span>{item.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Botón acción */}
                  <div className="mg48-detalle-footer">
                    <button
                      className="mg48-btn-entregar"
                      disabled={aplicandoAccion}
                      onClick={accionEntregar}
                    >
                      <CheckCircle2 size={18} />
                      {aplicandoAccion ? "Procesando..." : "Pedido entregado"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Consejo inferior */}
      <div className="mg48-consejo">
        <Lightbulb size={18} />
        <p>
          <strong>Consejo:</strong> Recuerda finalizar el servicio cuando la mesa quede libre
          para mantener el control correcto de las mesas disponibles.
        </p>
      </div>
    </section>
  );
}

export default Entregas;