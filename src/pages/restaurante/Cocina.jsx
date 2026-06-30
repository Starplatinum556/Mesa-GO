import { ChefHat, Clock3, Eye, Flame, CheckCircle2 } from "lucide-react";

const pedidosCocina = [
  {
    codigo: "#MG-00123",
    mesa: "Mesa 03",
    productos: "Hamburguesa Clásica, Papas fritas, Encebollado, Pastel de Chocolate",
    hora: "09:36 AM",
    tiempo: "12 min",
    estado: "En preparación",
  },
  {
    codigo: "#MG-00122",
    mesa: "Mesa 08",
    productos: "Lasaña de Carne, Jugo Natural de Naranja",
    hora: "09:27 AM",
    tiempo: "18 min",
    estado: "En preparación",
  },
  {
    codigo: "#MG-00120",
    mesa: "Mesa 05",
    productos: "Pizza de Pepperoni, Gaseosa",
    hora: "09:18 AM",
    tiempo: "25 min",
    estado: "Preparando",
  },
];

function Cocina() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Pedidos en Cocina</h1>
        <p>Control de pedidos confirmados que se encuentran en preparación.</p>
      </div>

      <section className="metricas-grid tres-columnas">
        <article className="metrica-card">
          <div className="metrica-icon morado">
            <ChefHat size={28} />
          </div>
          <div>
            <p>Pedidos en cocina</p>
            <h2>5</h2>
            <span>Órdenes en preparación</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <Clock3 size={28} />
          </div>
          <div>
            <p>Tiempo promedio</p>
            <h2>18</h2>
            <span>minutos por pedido</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p>Listos hoy</p>
            <h2>14</h2>
            <span>Pedidos preparados</span>
          </div>
        </article>
      </section>

      <section className="cards-operativas">
        {pedidosCocina.map((pedido) => (
          <article className="card-operativa" key={pedido.codigo}>
            <div className="card-operativa-icon cocina">
              <Flame size={26} />
            </div>

            <div className="card-operativa-info">
              <div className="card-operativa-header">
                <div>
                  <h3>{pedido.codigo}</h3>
                  <p>{pedido.mesa}</p>
                </div>

                <span className="estado-pill pendiente">{pedido.estado}</span>
              </div>

              <p className="descripcion-card">{pedido.productos}</p>

              <div className="datos-card">
                <span>Hora: {pedido.hora}</span>
                <span>Tiempo: {pedido.tiempo}</span>
              </div>

              <div className="acciones-card">
                <button className="btn-accion-principal">Marcar como listo</button>
                <button className="btn-ver-detalle">
                  <Eye size={16} />
                  Ver detalle
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

export default Cocina;