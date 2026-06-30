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

const pedidos = [
  {
    mesa: "Mesa 12",
    zona: "Salón de Comidas",
    codigo: "#MG-00125",
    hora: "09:41 AM",
    productos: "Hamburguesa Clásica, Papas fritas, Jugo Natural de Naranja",
    cantidad: "3 productos",
    pago: "Tarjeta",
    detallePago: "Visa **** 4242",
    total: "$15.75",
    estado: "Nuevo",
    color: "azul",
  },
  {
    mesa: "Mesa 07",
    zona: "Terraza",
    codigo: "#MG-00124",
    hora: "09:38 AM",
    productos: "Pizza de Pepperoni, Encebollado",
    cantidad: "2 productos",
    pago: "Efectivo",
    detallePago: "",
    total: "$14.90",
    estado: "Nuevo",
    color: "azul",
  },
  {
    mesa: "Mesa 03",
    zona: "Salón de Comidas",
    codigo: "#MG-00123",
    hora: "09:31 AM",
    productos: "Hamburguesa Clásica, Papas fritas, Encebollado, Pastel de Chocolate",
    cantidad: "4 productos",
    pago: "Tarjeta",
    detallePago: "Mastercard **** 8888",
    total: "$24.50",
    estado: "Pendiente",
    color: "naranja",
  },
  {
    mesa: "Mesa 08",
    zona: "Terraza",
    codigo: "#MG-00122",
    hora: "09:22 AM",
    productos: "Lasaña de Carne, Jugo Natural de Naranja",
    cantidad: "2 productos",
    pago: "Efectivo",
    detallePago: "",
    total: "$13.75",
    estado: "Pendiente",
    color: "naranja",
  },
  {
    mesa: "Mesa 01",
    zona: "Salón VIP",
    codigo: "#MG-00121",
    hora: "09:10 AM",
    productos: "Pizza de Pepperoni, Ensalada César, Pastel de Chocolate",
    cantidad: "3 productos",
    pago: "Tarjeta",
    detallePago: "Visa **** 1234",
    total: "$18.90",
    estado: "Confirmado",
    color: "morado",
  },
];

function RecepcionPedidos() {
  return (
    <section className="recepcion-page">
      <div className="recepcion-header">
        <div>
          <h1>Recepción de Pedidos</h1>
          <p>Administra y recibe los pedidos de las mesas en tiempo real.</p>
        </div>
      </div>

      <section className="metricas-grid">
        <article className="metrica-card">
          <div className="metrica-icon azul">
            <ShoppingBag size={28} />
          </div>

          <div>
            <p>Total pedidos hoy</p>
            <h2>32</h2>
            <span>$1,286.75 en ventas</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon verde">
            <ReceiptText size={28} />
          </div>

          <div>
            <p>Pedidos nuevos</p>
            <h2>8</h2>
            <span>$284.90 en ventas</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon naranja">
            <Clock3 size={28} />
          </div>

          <div>
            <p>Pedidos pendientes</p>
            <h2>5</h2>
            <span>$215.40 en ventas</span>
          </div>
        </article>

        <article className="metrica-card">
          <div className="metrica-icon morado">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <p>Pedidos confirmados</p>
            <h2>19</h2>
            <span>$786.45 en ventas</span>
          </div>
        </article>
      </section>

      <section className="barra-control">
        <div className="tabs-pedidos">
          <button className="activo">Todos <span>32</span></button>
          <button>Nuevos <span>8</span></button>
          <button>Pendientes <span>5</span></button>
          <button>Confirmados <span>19</span></button>
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
              <th>Hora</th>
              <th>Productos</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.codigo}>
                <td>
                  <div className="mesa-info">
                    <div className={`mesa-icon ${pedido.color}`}>
                      <Table2 size={21} />
                    </div>

                    <div>
                      <strong>{pedido.mesa}</strong>
                      <p>{pedido.zona}</p>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="codigo-info">
                    <strong>{pedido.codigo}</strong>
                    <QrCode size={15} />
                  </div>
                </td>

                <td>
                  <div className="hora-info">
                    <strong>{pedido.hora}</strong>
                    <p>Hoy</p>
                  </div>
                </td>

                <td>
                  <div className="productos-info">
                    <strong>{pedido.cantidad}</strong>
                    <p>{pedido.productos}</p>
                  </div>
                </td>

                <td>
                  <div className="pago-info">
                    {pedido.pago === "Tarjeta" ? (
                      <CreditCard size={20} />
                    ) : (
                      <Wallet size={20} />
                    )}

                    <div>
                      <strong>{pedido.pago}</strong>
                      {pedido.detallePago && <p>{pedido.detallePago}</p>}
                    </div>
                  </div>
                </td>

                <td>
                  <strong className="total-pedido">{pedido.total}</strong>
                </td>

                <td>
                  <span className={`estado-pill ${pedido.estado.toLowerCase()}`}>
                    {pedido.estado}
                  </span>
                </td>

                <td>
                  <div className="acciones-pedido">
                    {pedido.estado === "Nuevo" && (
                      <button className="btn-accion-principal">Aceptar pedido</button>
                    )}

                    {pedido.estado === "Pendiente" && (
                      <button className="btn-accion-principal">Enviar a cocina</button>
                    )}

                    {pedido.estado === "Confirmado" && (
                      <button className="btn-accion-disabled">Enviado a cocina</button>
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

        <div className="tabla-footer">
          <p>Mostrando 1 a 5 de 32 pedidos</p>

          <div className="paginacion">
            <button>‹</button>
            <button className="activo">1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <span>...</span>
            <button>7</button>
            <button>›</button>
          </div>

          <select>
            <option>5 por página</option>
            <option>10 por página</option>
          </select>
        </div>
      </section>
    </section>
  );
}

export default RecepcionPedidos;