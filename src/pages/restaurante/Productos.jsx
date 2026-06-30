import { Edit, Package, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";

const productos = [
  { nombre: "Hamburguesa Clásica", categoria: "Platos fuertes", precio: "$6.50", estado: "Disponible" },
  { nombre: "Pizza de Pepperoni", categoria: "Platos fuertes", precio: "$8.90", estado: "Disponible" },
  { nombre: "Papas fritas", categoria: "Entradas", precio: "$2.50", estado: "Disponible" },
  { nombre: "Encebollado", categoria: "Entradas", precio: "$6.00", estado: "No disponible" },
  { nombre: "Jugo Natural de Naranja", categoria: "Bebidas", precio: "$2.75", estado: "Disponible" },
  { nombre: "Pastel de Chocolate", categoria: "Postres", precio: "$3.50", estado: "Disponible" },
];

function Productos() {
  return (
    <section className="modulo-admin">
      <div className="recepcion-header fila-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p>Administra productos, precios, categorías y disponibilidad del menú digital.</p>
        </div>

        <button className="btn-accion-principal btn-header">
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <section className="barra-control productos-control">
        <div className="busqueda-pedidos">
          <Search size={19} />
          <input type="text" placeholder="Buscar producto..." />
        </div>

        <button className="btn-filtros">Entradas</button>
        <button className="btn-filtros">Platos fuertes</button>
        <button className="btn-filtros">Bebidas</button>
        <button className="btn-filtros">Postres</button>
      </section>

      <section className="tabla-pedidos-card">
        <table className="tabla-pedidos">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Disponibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.nombre}>
                <td>
                  <div className="mesa-info">
                    <div className="mesa-icon azul">
                      <Package size={21} />
                    </div>

                    <div>
                      <strong>{producto.nombre}</strong>
                      <p>Producto del menú digital</p>
                    </div>
                  </div>
                </td>

                <td>{producto.categoria}</td>
                <td>
                  <strong>{producto.precio}</strong>
                </td>

                <td>
                  <span
                    className={
                      producto.estado === "Disponible"
                        ? "estado-pill nuevo"
                        : "estado-pill pendiente"
                    }
                  >
                    {producto.estado}
                  </span>
                </td>

                <td>
                  <div className="acciones-tabla">
                    <button className="btn-ver">
                      <Edit size={15} />
                      Editar
                    </button>

                    <button className="btn-ok">
                      {producto.estado === "Disponible" ? (
                        <ToggleRight size={16} />
                      ) : (
                        <ToggleLeft size={16} />
                      )}
                      Cambiar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export default Productos;