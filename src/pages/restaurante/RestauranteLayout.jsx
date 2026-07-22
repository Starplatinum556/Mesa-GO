import {
  Bell,
  ChefHat,
  FileBarChart,
  LogOut,
  Package,
  QrCode,
  Settings,
  Table2,
  Truck,
  User,
  Users,
} from "lucide-react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { obtenerUsuarioSesion } from "../../components/RutaProtegida";

const MENU_POR_ROL = {
  ADMIN: [
    { to: "/restaurante/mesas", icon: Table2, label: "Mesas" },
    { to: "/restaurante/productos", icon: Package, label: "Productos" },
    { to: "/restaurante/personal", icon: Users, label: "Personal" },
    { to: "/restaurante/reportes", icon: FileBarChart, label: "Reportes" },
    { to: "/restaurante/configuracion", icon: Settings, label: "Configuración" },
  ],
  COCINERO: [
    { to: "/restaurante/cocina", icon: ChefHat, label: "En cocina" },
  ],
  DESPACHADOR: [
    { to: "/restaurante/entregas", icon: Truck, label: "Entregas" },
  ],
};

const NOMBRE_ROL = {
  ADMIN: "Administrador",
  COCINERO: "Cocinero",
  DESPACHADOR: "Despachador",
};

function RestauranteLayout() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioSesion();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const opcionesMenu = MENU_POR_ROL[usuario.rol] || [];

  const cerrarSesion = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuarioMesaGo");
    navigate("/login");
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">
            <QrCode size={22} />
          </div>
          <div>
            <h2>
              Mesa<span>Go</span>
            </h2>
            {usuario.restaurante_nombre && (
              <p className="admin-logo-restaurante">{usuario.restaurante_nombre}</p>
            )}
          </div>
        </div>

        <nav className="admin-menu">
          {opcionesMenu.map(({ to, icon: Icono, label }) => (
            <NavLink to={to} key={to}>
              <Icono size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="conexion">
            <span></span>
            <strong>Conectado</strong>
          </div>

          <p>{NOMBRE_ROL[usuario.rol] || usuario.rol}</p>

          <button type="button" className="salir-admin" onClick={cerrarSesion}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-titulo">
            <h1>{usuario.restaurante_nombre || "Mi restaurante"}</h1>
            <p>Panel de {NOMBRE_ROL[usuario.rol] || usuario.rol}</p>
          </div>

          <div className="admin-top-actions">
            <button className="top-icon">
              <Bell size={19} />
            </button>

            <button className="admin-user">
              <div className="admin-user-icon">
                <User size={19} />
              </div>
              <div>
                <strong>{usuario.nombre}</strong>
                <p>{NOMBRE_ROL[usuario.rol] || usuario.rol}</p>
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