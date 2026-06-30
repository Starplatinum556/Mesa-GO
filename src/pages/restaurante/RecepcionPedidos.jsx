import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  QrCode,
  ReceiptText,
  Search,
  ShoppingBag,
  Table2,
  Wallet,
} from "lucide-react";

function RecepcionPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/pedidos")
      .then((res) => res.json())
      .then((datos) => {
        setPedidos(datos);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo conectar con el servidor (localhost:4000).");
        setCargando(false);
      });
  }, []);

  const totalPedidos = pedidos.length;
  const nuevos = pedidos.filter((p) => p.estado === "Nuevo").length;
  const pendientes = pedidos.filter((p) => p.estado === "Pendiente").length;
  const confirmados = pedidos.filter((p) => p.estado === "Confirmado").length;
  const totalVentas = pedidos.reduce((acc, p) => acc + Number(p.total), 0);

  const colorPorEstado = (estado) => {
    if (estado === "Nuevo") return "azul";
    if (estado === "Pendiente") return "naranja";
    if (estado === "Confirmado") return "morado";
    return "azul";
  };

  return (
    <section className="recepcion-page">
      <div className="recepcion-header">
        <div>
          <h1>Recepción de Pedidos</h1>
          <p>Administra y recibe los pedidos de las mesas en tiempo real.</p>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {cargando && <p>Cargando pedidos...</p>}

      {!cargando && !error && (
        <>
          <section className="metricas-grid">
            <article className="metrica-card">
              <div className="metrica-icon azul">
                <ShoppingBag size={28} />
              </div>

              <div>
                <p>Total pedidos hoy</p>
                <h2>{totalPedidos}</h2>
                <span>${totalVentas.toFixed(2)} en ventas</span>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon verde">
                <ReceiptText size={28} />
              </div>

              <div>
                <p>Pedidos nuevos</p>
                <h2>{nuevos}</h2>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon naranja">
                <Clock3 size={28} />
              </div>

              <div>
                <p>Pedidos pendientes</p>
                <h2>{pendientes}</h2>
              </div>
            </article>

            <article className="metrica-card">
              <div className="metrica-icon morado">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <p>Pedidos confirmados</p>
                <h2>{confirmados}</h2>
              </div>
            </article>
          </section>

          <section className="barra-control">
            <div className="tabs-pedidos">
              <button className="activo">
                Todos <span>{totalPedidos}</span>
              </button>
              <button>
                Nuevos <span>{nuevos}</span>
              </button>
              <button>
                Pendientes <span>{pendientes}</span>
              </button>
              <button>
                Confirmados <span>{confirmados}</span>
              </button>
            </div>

            <div className="busqueda-pedidos">
              <Search size={19} />
              <input type="text" placeholder="Buscar por mesa o código..." />
            </div>

            <button className="btn-filtros">
              <Filter size={18} />
              Filtros
            </button>
          </section>

          <section className="tabla-pedidos-card">
            <table className="tabla-pedidos">
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Código de pedido</th>
                  <th>Productos</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pedidos.map((pedido) => {
                  const color = colorPorEstado(pedido.estado);

                  return (
                    <tr key={pedido.id}>
                      <td>
                        <div className="mesa-info">
                          <div className={`mesa-icon ${color}`}>
                            <Table2 size={21} />
                          </div>

                          <div>
                            <strong>Mesa {pedido.mesa}</strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="codigo-info">
                          <strong>#{pedido.codigo}</strong>
                          <QrCode size={15} />
                        </div>
                      </td>

                      <td>
                        <div className="productos-info">
                          <strong>{pedido.cantidad_productos} productos</strong>
                          <p>{pedido.productos}</p>
                        </div>
                      </td>

                      <td>
                        <div className="pago-info">
                          {pedido.metodo_pago === "Tarjeta" ? (
                            <CreditCard size={20} />
                          ) : (
                            <Wallet size={20} />
                          )}

                          <div>
                            <strong>{pedido.metodo_pago}</strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="total-pedido">
                          ${Number(pedido.total).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`estado-pill ${pedido.estado.toLowerCase()}`}
                        >
                          {pedido.estado}
                        </span>
                      </td>

                      <td>
                        <div className="acciones-pedido">
                          {pedido.estado === "Nuevo" && (
                            <button className="btn-accion-principal">
                              Aceptar pedido
                            </button>
                          )}

                          {pedido.estado === "Pendiente" && (
                            <button className="btn-accion-principal">
                              Enviar a cocina
                            </button>
                          )}

                          {pedido.estado === "Confirmado" && (
                            <button className="btn-accion-disabled">
                              Enviado a cocina
                            </button>
                          )}

                          <button className="btn-ver-detalle">
                            <Eye size={16} />
                            Ver detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="tabla-footer">
              <p>Mostrando {totalPedidos} de {totalPedidos} pedidos</p>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default RecepcionPedidos;