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
} from "lucide-react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { obtenerUsuarioSesion } from "../../components/RutaProtegida";

// MG-59: qué ve cada rol en el menú lateral. Un rol solo aparece aquí
// si el ticket lo autoriza explícitamente para ese módulo.
const MENU_POR_ROL = {
  ADMIN: [
    { to: "/restaurante/mesas", icon: Table2, label: "Mesas" },
    { to: "/restaurante/productos", icon: Package, label: "Productos" },
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

  // MG-59: sin sesión válida no se entra a ninguna pantalla interna.
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

          <h2>
            Mesa<span>Go</span>
          </h2>
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
          <div></div>

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