import {
  Bell,
  ChefHat,
  ClipboardList,
  Clock,
  FileBarChart,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  Table2,
  Truck,
  User,
} from "lucide-react";
import { NavLink, Outlet, Link } from "react-router-dom";

function RestauranteLayout() {
  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">
            <QrCode size={22} />
          </div>

          <h2>
            Mesa<span>Go</span>
          </h2>
        </div>

        <nav className="admin-menu">
          <NavLink to="/restaurante" end>
            <ClipboardList size={20} />
            <span>Recepción</span>
            <small>8</small>
          </NavLink>

          <NavLink to="/restaurante/cocina">
            <ChefHat size={20} />
            <span>En cocina</span>
            <small>5</small>
          </NavLink>

          <NavLink to="/restaurante/entregas">
            <ShoppingBag size={20} />
            <span>Listos para entregar</span>
            <small>3</small>
          </NavLink>

          <NavLink to="/restaurante/entregas">
            <Truck size={20} />
            <span>Entregados</span>
          </NavLink>

          <NavLink to="/restaurante/reportes">
            <Clock size={20} />
            <span>Historial</span>
          </NavLink>

          <NavLink to="/restaurante/mesas">
            <Table2 size={20} />
            <span>Mesas</span>
          </NavLink>

          <NavLink to="/restaurante/productos">
            <Package size={20} />
            <span>Productos</span>
          </NavLink>

          <NavLink to="/restaurante/reportes">
            <FileBarChart size={20} />
            <span>Reportes</span>
          </NavLink>

          <NavLink to="/restaurante/configuracion">
            <Settings size={20} />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="conexion">
            <span></span>
            <strong>Conectado</strong>
          </div>

          <p>Sucursal Centro</p>

          <Link to="/" className="salir-admin">
            <LogOut size={16} />
            Volver al inicio
          </Link>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div></div>

          <div className="admin-top-actions">
            <button className="top-action qr-action">
              <QrCode size={18} />
              Pedido desde QR
            </button>

            <button className="top-icon">
              <Bell size={19} />
              <span>3</span>
            </button>

            <button className="admin-user">
              <div className="admin-user-icon">
                <User size={19} />
              </div>

              <div>
                <strong>Administrador</strong>
                <p>Turno: Mañana</p>
              </div>
            </button>
          </div>
        </header>

        <Outlet />
      </section>
    </main>
  );
}

export default RestauranteLayout;