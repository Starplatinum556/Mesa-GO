import { useEffect, useState } from "react";
import { Edit, Package, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "../../api";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/productos")
      .then((res) => res.json())
      .then((datos) => {
        setProductos(datos);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo conectar con el servidor (localhost:4000).");
        setCargando(false);
      });
  }, []);

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
      </section>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {cargando && <p>Cargando productos...</p>}

      {!cargando && !error && (
        <section className="tabla-pedidos-card">
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Disponibilidad</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto) => {
                const disponible = producto.disponible;
                const estado = disponible ? "Disponible" : "No disponible";

                return (
                  <tr key={producto.id}>
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

                    <td>
                      <strong>${producto.precio}</strong>
                    </td>

                    <td>
                      <span
                        className={
                          disponible ? "estado-pill nuevo" : "estado-pill pendiente"
                        }
                      >
                        {estado}
                      </span>
                    </td>

                    <td>
                      <div className="acciones-tabla">
                        <button className="btn-ver">
                          <Edit size={15} />
                          Editar
                        </button>

                        <button className="btn-ok">
                          {disponible ? (
                            <ToggleRight size={16} />
                          ) : (
                            <ToggleLeft size={16} />
                          )}
                          Cambiar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}

export default Productos;