import { urlImagen } from "../../api";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  Download,
  DollarSign,
  Lightbulb,
  PieChart as PieChartIcon,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { obtenerReportes } from "../../services/reportesService";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const COLORES_CATEGORIA = ["#ff7a1a", "#22c55e", "#8b5cf6", "#3b82f6", "#94a3b8", "#ec4899"];
const COLORES_METODO_PAGO = ["#22c55e", "#3b82f6", "#8b5cf6", "#94a3b8"];

function parsearFecha(fechaTexto) {
  const [anio, mes, dia] = fechaTexto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function formatFechaCorta(fechaTexto) {
  const fecha = parsearFecha(fechaTexto);
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

function formatFechaLarga(fechaTexto) {
  const fecha = parsearFecha(fechaTexto);
  return `${fecha.getDate()} de ${MESES_LARGOS[fecha.getMonth()]}, ${fecha.getFullYear()}`;
}

function formatDinero(valor) {
  const numero = Number(valor) || 0;
  return `$${numero.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPorcentaje(valor) {
  if (valor === null || valor === undefined) return null;
  const signo = valor > 0 ? "+" : "";
  return `${signo}${valor.toFixed(1)}%`;
}

// Rango por defecto: últimos 7 días (incluyendo hoy), en formato YYYY-MM-DD.
function rangoPorDefecto() {
  const hoy = new Date();
  const hace6Dias = new Date(hoy);
  hace6Dias.setDate(hoy.getDate() - 6);
  const aTexto = (fecha) => fecha.toISOString().slice(0, 10);
  return { desde: aTexto(hace6Dias), hasta: aTexto(hoy) };
}

function IndicadorCambio({ valor }) {
  if (valor === null) {
    return <span className="reporte-kpi-cambio neutro">Sin período previo</span>;
  }
  const positivo = valor >= 0;
  return (
    <span className={`reporte-kpi-cambio ${positivo ? "positivo" : "negativo"}`}>
      {positivo ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {formatPorcentaje(valor)} vs período anterior
    </span>
  );
}

function TooltipVentasPorDia({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="reporte-tooltip">
      <strong>{formatFechaLarga(label)}</strong>
      <span>Ventas: {formatDinero(payload[0].value)}</span>
    </div>
  );
}

function Reportes() {
  const rangoInicial = useMemo(() => rangoPorDefecto(), []);
  const [desdeInput, setDesdeInput] = useState(rangoInicial.desde);
  const [hastaInput, setHastaInput] = useState(rangoInicial.hasta);

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarReporte = async (desde, hasta) => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerReportes({ desde, hasta });
      setReporte(datos);
      setDesdeInput(datos.periodo.desde);
      setHastaInput(datos.periodo.hasta);
    } catch (err) {
      setError(err.message || "No se pudo cargar el reporte.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte(rangoInicial.desde, rangoInicial.hasta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarRango = () => {
    if (desdeInput > hastaInput) {
      toast.error("La fecha 'desde' no puede ser posterior a 'hasta'.");
      return;
    }
    cargarReporte(desdeInput, hastaInput);
  };

  const aplicarPreset = (dias) => {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - (dias - 1));
    const aTexto = (fecha) => fecha.toISOString().slice(0, 10);
    cargarReporte(aTexto(inicio), aTexto(hoy));
  };

  // MG-42/MG-50: "consejo" real, calculado con los días de fin de
  // semana presentes en el rango cargado — no es un dato inventado.
  // Si el rango no tiene ambos tipos de día, simplemente no se muestra.
  const consejoFinDeSemana = useMemo(() => {
    if (!reporte?.ventasPorDia?.length) return null;

    const finDeSemana = [];
    const entreSemana = [];
    for (const dia of reporte.ventasPorDia) {
      const diaSemana = parsearFecha(dia.fecha).getDay(); // 0=domingo, 6=sábado
      if (diaSemana === 0 || diaSemana === 6) finDeSemana.push(dia.total);
      else entreSemana.push(dia.total);
    }
    if (finDeSemana.length === 0 || entreSemana.length === 0) return null;

    const promedio = (lista) => lista.reduce((a, b) => a + b, 0) / lista.length;
    const promedioFinDeSemana = promedio(finDeSemana);
    const promedioEntreSemana = promedio(entreSemana);
    if (promedioEntreSemana === 0) return null;

    const diferencia = ((promedioFinDeSemana - promedioEntreSemana) / promedioEntreSemana) * 100;
    if (Math.abs(diferencia) < 5) return null; // no vale la pena resaltarlo

    return diferencia > 0
      ? `Los fines de semana tienes ${diferencia.toFixed(0)}% más de ventas en promedio. ¡Aprovecha para promociones especiales!`
      : `Entre semana tienes ${Math.abs(diferencia).toFixed(0)}% más de ventas en promedio que los fines de semana.`;
  }, [reporte]);

  const exportarCsv = () => {
    if (!reporte) return;

    const filas = [];
    filas.push(["Reporte MesaGo", `${reporte.periodo.desde} a ${reporte.periodo.hasta}`]);
    filas.push([]);
    filas.push(["KPIs"]);
    filas.push(["Ventas totales", reporte.kpis.ventasTotales.toFixed(2)]);
    filas.push(["Pedidos realizados", reporte.kpis.pedidosRealizados]);
    filas.push(["Clientes atendidos", reporte.kpis.clientesAtendidos]);
    filas.push(["Ticket promedio", reporte.kpis.ticketPromedio.toFixed(2)]);
    filas.push([]);
    filas.push(["Ventas por día"]);
    filas.push(["Fecha", "Total"]);
    reporte.ventasPorDia.forEach((dia) => filas.push([dia.fecha, dia.total.toFixed(2)]));
    filas.push([]);
    filas.push(["Ventas por categoría"]);
    filas.push(["Categoría", "Total", "% del total"]);
    reporte.ventasPorCategoria.forEach((cat) =>
      filas.push([cat.categoria, cat.total.toFixed(2), cat.porcentaje.toFixed(1)])
    );
    filas.push([]);
    filas.push(["Productos más vendidos"]);
    filas.push(["Producto", "Unidades vendidas", "Total", "% del total"]);
    reporte.productosMasVendidos.forEach((p) =>
      filas.push([p.nombre, p.cantidad, p.total.toFixed(2), p.porcentaje.toFixed(1)])
    );
    filas.push([]);
    filas.push(["Métodos de pago"]);
    filas.push(["Método", "Total", "% del total"]);
    reporte.metodosPago.forEach((m) =>
      filas.push([m.metodo, m.total.toFixed(2), m.porcentaje.toFixed(1)])
    );

    const csv = filas.map((fila) => fila.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reporte-mesago-${reporte.periodo.desde}-a-${reporte.periodo.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  if (cargando && !reporte) {
    return (
      <section className="modulo-admin">
        <p className="estado-carga">Cargando reportes...</p>
      </section>
    );
  }

  if (error && !reporte) {
    return (
      <section className="modulo-admin">
        <p className="estado-error">{error}</p>
      </section>
    );
  }

  const { kpis, ventasPorDia, ventasPorCategoria, productosMasVendidos, metodosPago, resumen } = reporte;

  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Reportes</h1>
          <p>Visualiza el rendimiento de tu restaurante con datos clave.</p>
        </div>
      </div>

      <div className="reporte-periodo-barra">
        <div className="reporte-periodo-campo">
          <Calendar size={16} />
          <input type="date" value={desdeInput} onChange={(e) => setDesdeInput(e.target.value)} />
          <span>—</span>
          <input type="date" value={hastaInput} onChange={(e) => setHastaInput(e.target.value)} />
          <button type="button" className="btn-secundario" onClick={aplicarRango} disabled={cargando}>
            Aplicar
          </button>
        </div>

        <div className="reporte-periodo-presets">
          <button type="button" onClick={() => aplicarPreset(7)}>Últimos 7 días</button>
          <button type="button" onClick={() => aplicarPreset(30)}>Últimos 30 días</button>
          <button type="button" className="btn-accion-principal btn-header" onClick={exportarCsv}>
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <section className="reporte-kpis">
        <article className="reporte-kpi">
          <div className="reporte-kpi-icono naranja">
            <DollarSign size={28} />
          </div>
          <div>
            <p>Ventas totales</p>
            <h2>{formatDinero(kpis.ventasTotales)}</h2>
            <IndicadorCambio valor={kpis.cambioVentas} />
          </div>
        </article>

        <article className="reporte-kpi">
          <div className="reporte-kpi-icono verde">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p>Pedidos realizados</p>
            <h2>{kpis.pedidosRealizados}</h2>
            <IndicadorCambio valor={kpis.cambioPedidos} />
          </div>
        </article>

        <article className="reporte-kpi">
          <div className="reporte-kpi-icono azul">
            <Users size={28} />
          </div>
          <div>
            <p>Clientes atendidos</p>
            <h2>{kpis.clientesAtendidos}</h2>
            <IndicadorCambio valor={kpis.cambioClientes} />
          </div>
        </article>

        <article className="reporte-kpi">
          <div className="reporte-kpi-icono morado">
            <Receipt size={28} />
          </div>
          <div>
            <p>Ticket promedio</p>
            <h2>{formatDinero(kpis.ticketPromedio)}</h2>
            <IndicadorCambio valor={kpis.cambioTicket} />
          </div>
        </article>
      </section>

      <section className="reporte-fila-2">
        <article className="reporte-panel reporte-panel-grande">
          <div className="reporte-panel-cabecera">
            <div>
              <h3>Ventas por día</h3>
              <p>Evolución de tus ventas en el período seleccionado.</p>
            </div>
            <BarChart3 size={24} />
          </div>

          {ventasPorDia.every((dia) => dia.total === 0) ? (
            <p className="estado-vacio">No hay ventas registradas en este período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ventasPorDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a1a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatFechaCorta}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(valor) => `$${valor}`}
                />
                <Tooltip content={<TooltipVentasPorDia />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#ff7a1a"
                  strokeWidth={3}
                  fill="url(#colorVentas)"
                  dot={{ r: 4, fill: "#ff7a1a", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="reporte-panel">
          <div className="reporte-panel-cabecera">
            <div>
              <h3>Ventas por categoría</h3>
              <p>Distribución de ventas por tipo de producto.</p>
            </div>
            <PieChartIcon size={24} />
          </div>

          {ventasPorCategoria.length === 0 ? (
            <p className="estado-vacio">No hay ventas registradas en este período.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={ventasPorCategoria}
                    dataKey="total"
                    nameKey="categoria"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {ventasPorCategoria.map((_, indice) => (
                      <Cell key={indice} fill={COLORES_CATEGORIA[indice % COLORES_CATEGORIA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(valor) => formatDinero(valor)} />
                </PieChart>
              </ResponsiveContainer>

              <ul className="reporte-leyenda">
                {ventasPorCategoria.map((cat, indice) => (
                  <li key={cat.categoria}>
                    <span
                      className="reporte-leyenda-punto"
                      style={{ background: COLORES_CATEGORIA[indice % COLORES_CATEGORIA.length] }}
                    />
                    <span className="reporte-leyenda-nombre">{cat.categoria}</span>
                    <span className="reporte-leyenda-porcentaje">{cat.porcentaje.toFixed(0)}%</span>
                    <strong>{formatDinero(cat.total)}</strong>
                  </li>
                ))}
                <li className="reporte-leyenda-total">
                  <span>Total</span>
                  <strong>{formatDinero(ventasPorCategoria.reduce((a, c) => a + c.total, 0))}</strong>
                </li>
              </ul>
            </>
          )}
        </article>
      </section>

      <section className="reporte-fila-3">
        <article className="reporte-panel">
          <div className="reporte-panel-cabecera">
            <div>
              <h3>Productos más vendidos</h3>
              <p>Top 5 del período seleccionado.</p>
            </div>
            <Trophy size={24} />
          </div>

          {productosMasVendidos.length === 0 ? (
            <p className="estado-vacio">No hay ventas registradas en este período.</p>
          ) : (
            <ol className="reporte-top-productos">
              {productosMasVendidos.map((producto, indice) => (
                <li key={producto.nombre}>
                  <span className="reporte-top-rango">{indice + 1}</span>
                  {producto.imagen ? (
                    <img
                      src={urlImagen(producto.imagen)}
                      alt={producto.nombre}
                      className="reporte-top-imagen"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="reporte-top-imagen reporte-top-imagen-vacia">
                      <ShoppingBag size={18} />
                    </div>
                  )}
                  <div className="reporte-top-info">
                    <strong>{producto.nombre}</strong>
                    <span>{producto.cantidad} vendidos</span>
                  </div>
                  <div className="reporte-top-cifras">
                    <strong>{formatDinero(producto.total)}</strong>
                    <span>{producto.porcentaje.toFixed(0)}% del total</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="reporte-panel">
          <div className="reporte-panel-cabecera">
            <div>
              <h3>Métodos de pago</h3>
              <p>Cómo pagaron tus clientes.</p>
            </div>
            <CreditCard size={24} />
          </div>

          {metodosPago.length === 0 ? (
            <p className="estado-vacio">No hay pagos registrados en este período.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={metodosPago}
                    dataKey="total"
                    nameKey="metodo"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {metodosPago.map((_, indice) => (
                      <Cell key={indice} fill={COLORES_METODO_PAGO[indice % COLORES_METODO_PAGO.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(valor) => formatDinero(valor)} />
                </PieChart>
              </ResponsiveContainer>

              <ul className="reporte-leyenda">
                {metodosPago.map((metodo, indice) => (
                  <li key={metodo.metodo}>
                    <span
                      className="reporte-leyenda-punto"
                      style={{ background: COLORES_METODO_PAGO[indice % COLORES_METODO_PAGO.length] }}
                    />
                    <span className="reporte-leyenda-nombre">{metodo.metodo}</span>
                    <span className="reporte-leyenda-porcentaje">{metodo.porcentaje.toFixed(0)}%</span>
                    <strong>{formatDinero(metodo.total)}</strong>
                  </li>
                ))}
                <li className="reporte-leyenda-total">
                  <span>Total</span>
                  <strong>{formatDinero(metodosPago.reduce((a, m) => a + m.total, 0))}</strong>
                </li>
              </ul>
            </>
          )}
        </article>

        <article className="reporte-panel">
          <div className="reporte-panel-cabecera">
            <div>
              <h3>Resumen del período</h3>
              <p>Puntos clave a simple vista.</p>
            </div>
            <Sparkles size={24} />
          </div>

          <ul className="reporte-resumen-lista">
            <li>
              <span className="reporte-resumen-icono verde">
                <TrendingUp size={17} />
              </span>
              <div>
                <strong>Día con más ventas</strong>
                <span>
                  {resumen.diaMasVentas ? formatFechaLarga(resumen.diaMasVentas.fecha) : "Sin datos"}
                </span>
              </div>
              <strong className="reporte-resumen-valor verde">
                {resumen.diaMasVentas ? formatDinero(resumen.diaMasVentas.total) : "—"}
              </strong>
            </li>

            <li>
              <span className="reporte-resumen-icono rojo">
                <TrendingDown size={17} />
              </span>
              <div>
                <strong>Día con menos ventas</strong>
                <span>
                  {resumen.diaMenosVentas ? formatFechaLarga(resumen.diaMenosVentas.fecha) : "Sin datos"}
                </span>
              </div>
              <strong className="reporte-resumen-valor rojo">
                {resumen.diaMenosVentas ? formatDinero(resumen.diaMenosVentas.total) : "—"}
              </strong>
            </li>

            <li>
              <span className="reporte-resumen-icono azul">
                <Clock size={17} />
              </span>
              <div>
                <strong>Hora pico</strong>
                <span>{resumen.horaPico ? resumen.horaPico.texto : "Sin datos"}</span>
              </div>
              <strong className="reporte-resumen-valor azul">
                {resumen.horaPico ? formatDinero(resumen.horaPico.total) : "—"}
              </strong>
            </li>

            <li>
              <span className="reporte-resumen-icono rojo">
                <XCircle size={17} />
              </span>
              <div>
                <strong>Pedidos cancelados</strong>
                <span>{resumen.pedidosCancelados.cantidad} pedidos</span>
              </div>
              <strong className="reporte-resumen-valor rojo">
                {formatDinero(resumen.pedidosCancelados.total)}
              </strong>
            </li>
          </ul>
        </article>
      </section>

      {consejoFinDeSemana && (
        <div className="reporte-consejo">
          <Lightbulb size={20} />
          <p>
            <strong>Consejo:</strong> {consejoFinDeSemana}
          </p>
        </div>
      )}
    </section>
  );
}

export default Reportes;