import { useEffect, useState } from "react";
import {
  Bell,
  ChefHat,
  ClipboardList,
  FileBarChart,
  LogOut,
  MapPin,
  Package,
  PackageX,
  QrCode,
  Settings,
  Table2,
  Tag,
  User,
  UserCircle2,
  Users,
} from "lucide-react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { obtenerUsuarioSesion } from "../../components/RutaProtegida";

// MG-48: ícono a medida para "Entregas" en el sidebar — una mano
// sosteniendo una bandeja con el plato cubierto (cloche), en vez del
// camión genérico de lucide-react, inspirado en el clásico ícono de
// "servicio a la mesa". Usa "currentColor" (relleno sólido) y
// respeta el prop "size" para comportarse igual que el resto de
// íconos de lucide-react usados en el menú.
function IconoMeseroEntrega({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Manija de la cúpula */}
      <circle cx="12" cy="3.1" r="1" />
      <rect x="11.35" y="3.9" width="1.3" height="1.6" rx="0.55" />
      {/* Cúpula que cubre el plato */}
      <path d="M4.5 10.2C4.5 6 7.9 3 12 3s7.5 3 7.5 7.2H4.5Z" />
      {/* Bandeja / plato */}
      <ellipse cx="12" cy="10.9" rx="8.6" ry="1.6" />
      {/* Mano que sostiene la bandeja desde abajo */}
      <path d="M2.1 15.1c2.7-1.5 5.6-2.5 8.6-2.8a1 1 0 1 1 .2 2c-1.8.2-3.6.7-5.3 1.4l6.9 2.4c.6.2 1.2.2 1.7 0l6.8-2.4a1 1 0 1 1 .7 1.9l-6.8 2.4c-1 .3-2.1.3-3.1 0L2.9 17c-.5-.2-.9-.7-.8-1.3.02-.2.06-.4.1-.6Z" />
    </svg>
  );
}

// MG-40: cada rol tiene un menú "principal" (su operación del día a
// día) y, opcionalmente, uno "secundario" que aparece después de un
// divisor (por ahora solo "Mi Perfil" para el cocinero).
const MENU_POR_ROL = {
  ADMIN: {
    principal: [
      { to: "/restaurante/mesas", icon: Table2, label: "Mesas" },
      // MG-66: junto a Mesas, ya que las zonas existen para
      // organizarlas.
      { to: "/restaurante/zonas", icon: MapPin, label: "Zonas" },
      { to: "/restaurante/productos", icon: Package, label: "Productos" },
      // MG-65: junto a Productos, ya que las categorías existen para
      // organizarlos.
      { to: "/restaurante/categorias", icon: Tag, label: "Categorías" },
      { to: "/restaurante/personal", icon: Users, label: "Personal" },
      { to: "/restaurante/reportes", icon: FileBarChart, label: "Reportes" },
      { to: "/restaurante/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
  COCINERO: {
    principal: [
      { to: "/restaurante/cocina", icon: ChefHat, label: "Panel de Cocina" },
      { to: "/restaurante/disponibilidad", icon: PackageX, label: "Productos agotados" },
    ],
    secundario: [{ icon: UserCircle2, label: "Mi Perfil" }],
  },
  DESPACHADOR: {
    principal: [
      { to: "/restaurante/entregas", icon: IconoMeseroEntrega, label: "Entregas" },
      // MG-48: implementación del panel de entregas — se agrega el
      // historial junto a "Entregas" ya que ambas pantallas son
      // parte del mismo flujo de trabajo del despachador.
      { to: "/restaurante/historial-entregas", icon: ClipboardList, label: "Historial de Entregas" },
    ],
  },
};

const NOMBRE_ROL = {
  ADMIN: "Administrador",
  COCINERO: "Cocinero",
  DESPACHADOR: "Despachador",
};

function RestauranteLayout() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioSesion();

  // Reloj del topbar: se actualiza solo, sin necesidad de refrescar
  // la página. Cada minuto es suficiente ya que solo mostramos
  // horas y minutos (no segundos) en el mockup.
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  // Formato manual en vez de toLocaleTimeString: así garantizamos
  // "AM."/"PM." en mayúsculas con punto, sin depender de cómo cada
  // navegador interprete el locale "es-EC".
  const horas24 = ahora.getHours();
  const minutos = ahora.getMinutes().toString().padStart(2, "0");
  const periodo = horas24 >= 12 ? "PM." : "AM.";
  const horas12 = (horas24 % 12 === 0 ? 12 : horas24 % 12).toString().padStart(2, "0");
  const horaActual = `${horas12}:${minutos} ${periodo}`;

  const fechaActual = ahora.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // IMPORTANTE: este chequeo va DESPUÉS de los hooks de arriba.
  // Los hooks siempre deben llamarse en el mismo orden en cada
  // render; si el "return" temprano estuviera antes de useState/
  // useEffect, React rompería esa regla en cuanto "usuario" sea
  // null (por ejemplo, justo después de cerrar sesión).
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const menu = MENU_POR_ROL[usuario.rol] || { principal: [] };

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
          {menu.principal.map(({ to, icon: Icono, label }) => (
            <NavLink to={to} key={to}>
              <Icono size={20} />
              <span>{label}</span>
            </NavLink>
          ))}

          {menu.secundario && (
            <>
              <div className="admin-menu-divisor"></div>
              {menu.secundario.map(({ icon: Icono, label }) => (
                <button type="button" className="admin-menu-inerte" key={label}>
                  <Icono size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="salir-admin" onClick={cerrarSesion}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-titulo">
            <div className="admin-topbar-icono">
              <ChefHat size={22} />
            </div>
            <div>
              <h1>{usuario.restaurante_nombre || "Mi restaurante"}</h1>
              <p>Panel de {NOMBRE_ROL[usuario.rol] || usuario.rol}</p>
            </div>
          </div>

          <div className="admin-top-actions">
            <button className="top-icon">
              <Bell size={19} />
              <span>3</span>
            </button>

            <div className="admin-fecha-hora">
              <strong>{horaActual}</strong>
              <span>{fechaActual}</span>
            </div>

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

        {/* Contenedor propio para el contenido de cada ruta (Outlet).
            Separarlo del header permite que SOLO esto pueda scrollear
            si algún día no alcanza el espacio, sin que la topbar ni el
            sidebar se muevan, y sin que la página completa scrollee. */}
        <div className="admin-main-contenido">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

export default RestauranteLayout;