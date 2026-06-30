import { BarChart3, DollarSign, ShoppingBag, Star, TrendingUp } from "lucide-react";

function Reportes() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Reportes del Restaurante</h1>
        <p>Resumen visual de ventas, pedidos y actividad del día.</p>
      </div>

      <section className="metricas-grid">
        <article className="metrica-card">
          <div className="metrica-icon verde">
            <DollarSign size={28} />
          </div>
          <div>
            <p>Ventas del día</p>
            <h2>$1,286</h2>
            <span>Total registrado hoy</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon azul">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p>Pedidos del día</p>
            <h2>32</h2>
            <span>Órdenes procesadas</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <TrendingUp size={28} />
          </div>
          <div>
            <p>Ticket promedio</p>
            <h2>$9.80</h2>
            <span>Promedio por pedido</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon morado">
            <Star size={28} />
          </div>
          <div>
            <p>Más vendido</p>
            <h2>Pizza</h2>
            <span>Producto destacado</span>
          </div>
        </article>
      </section>

      <section className="reportes-grid">
        <article className="reporte-card grande">
          <div className="reporte-header">
            <div>
              <h3>Pedidos por estado</h3>
              <p>Distribución simulada de órdenes del día.</p>
            </div>
            <BarChart3 size={24} />
          </div>

          <div className="barras-reporte">
            <div>
              <span>Nuevos</span>
              <div className="barra"><strong style={{ width: "35%" }}></strong></div>
              <p>8 pedidos</p>
            </div>

            <div>
              <span>Pendientes</span>
              <div className="barra naranja"><strong style={{ width: "25%" }}></strong></div>
              <p>5 pedidos</p>
            </div>

            <div>
              <span>Confirmados</span>
              <div className="barra morada"><strong style={{ width: "75%" }}></strong></div>
              <p>19 pedidos</p>
            </div>
          </div>
        </article>

        <article className="reporte-card">
          <h3>Productos destacados</h3>
          <ul className="lista-reporte">
            <li><span>Pizza de Pepperoni</span><strong>12 ventas</strong></li>
            <li><span>Hamburguesa Clásica</span><strong>9 ventas</strong></li>
            <li><span>Jugo Natural</span><strong>8 ventas</strong></li>
            <li><span>Papas fritas</span><strong>7 ventas</strong></li>
          </ul>
        </article>
      </section>
    </section>
  );
}

export default Reportes;