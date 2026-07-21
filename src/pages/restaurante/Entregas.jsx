import { useState } from "react";
import { CheckCircle2, Eye, PackageCheck, Truck } from "lucide-react";

const pedidosEntrega = [
  {
    codigo: "#MG-00119",
    mesa: "Mesa 04",
    productos: "Encebollado, Jugo Natural de Naranja",
    estado: "Listo para entregar",
    hora: "09:45 AM",
  },
  {
    codigo: "#MG-00118",
    mesa: "Mesa 10",
    productos: "Hamburguesa Clásica, Papas fritas",
    estado: "Listo para entregar",
    hora: "09:43 AM",
  },
  {
    codigo: "#MG-00117",
    mesa: "Mesa 02",
    productos: "Pastel de Chocolate, Café",
    estado: "Entregado",
    hora: "09:35 AM",
  },
];

// MG-59: "Listos para entregar" y "Entregados" viven en una sola
// pantalla (Entregas) con un filtro interno, en vez de 2 secciones
// separadas del menú lateral.
function Entregas() {
  const [filtro, setFiltro] = useState("todos");

  const pendientes = pedidosEntrega.filter(
    (p) => p.estado === "Listo para entregar"
  ).length;
  const entregados = pedidosEntrega.filter(
    (p) => p.estado === "Entregado"
  ).length;

  const pedidosFiltrados = pedidosEntrega.filter((pedido) => {
    if (filtro === "pendientes") return pedido.estado === "Listo para entregar";
    if (filtro === "entregados") return pedido.estado === "Entregado";
    return true;
  });

  return (
    <section className="modulo-admin">
      <div className="recepcion-header">
        <h1>Entregas</h1>
        <p>Pedidos preparados por cocina, listos o ya entregados al cliente.</p>
      </div>

      <section className="metricas-grid tres-columnas">
        <article className="metrica-card">
          <div className="metrica-icon azul">
            <PackageCheck size={28} />
          </div>
          <div>
            <p>Listos para entregar</p>
            <h2>{pendientes}</h2>
            <span>Esperando despacho</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <Truck size={28} />
          </div>
          <div>
            <p>Entregados hoy</p>
            <h2>{entregados}</h2>
            <span>Pedidos cerrados</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon morado">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p>Entrega promedio</p>
            <h2>4</h2>
            <span>minutos estimados</span>
          </div>
        </article>
      </section>

      <section className="barra-control">
        <div className="tabs-pedidos">
          <button
            className={filtro === "todos" ? "activo" : ""}
            onClick={() => setFiltro("todos")}
          >
            Todos <span>{pedidosEntrega.length}</span>
          </button>
          <button
            className={filtro === "pendientes" ? "activo" : ""}
            onClick={() => setFiltro("pendientes")}
          >
            Pendientes <span>{pendientes}</span>
          </button>
          <button
            className={filtro === "entregados" ? "activo" : ""}
            onClick={() => setFiltro("entregados")}
          >
            Entregados <span>{entregados}</span>
          </button>
        </div>
      </section>

      <section className="tabla-pedidos-card">
        <table className="tabla-pedidos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Mesa</th>
              <th>Productos</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.codigo}>
                <td>
                  <strong>{pedido.codigo}</strong>
                </td>
                <td>{pedido.mesa}</td>
                <td>{pedido.productos}</td>
                <td>{pedido.hora}</td>
                <td>
                  <span
                    className={
                      pedido.estado === "Entregado"
                        ? "estado-pill nuevo"
                        : "estado-pill confirmado"
                    }
                  >
                    {pedido.estado}
                  </span>
                </td>
                <td>
                  <div className="acciones-pedido">
                    {pedido.estado !== "Entregado" ? (
                      <button className="btn-accion-principal">
                        Marcar entregado
                      </button>
                    ) : (
                      <button className="btn-accion-disabled">Finalizado</button>
                    )}

                    <button className="btn-ver-detalle">
                      <Eye size={16} />
                      Ver detalle
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pedidosFiltrados.length === 0 && (
          <div className="tabla-footer">
            <p>No hay pedidos en este filtro.</p>
          </div>
        )}
      </section>
    </section>
  );
}

export default Entregas;