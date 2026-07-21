import { Navigate } from "react-router-dom";

// MG-59: lee la sesión guardada por Login.jsx (sessionStorage).
export function obtenerUsuarioSesion() {
  try {
    const token = sessionStorage.getItem("token");
    const usuario = JSON.parse(sessionStorage.getItem("usuarioMesaGo"));
    if (!token || !usuario) return null;
    return usuario;
  } catch {
    return null;
  }
}

// MG-59: pantalla de inicio por defecto para cada rol autenticado.
// Se usa tanto al hacer login como al redirigir accesos no autorizados.
export function rutaInicioPorRol(rol) {
  if (rol === "COCINERO") return "/restaurante/cocina";
  if (rol === "DESPACHADOR") return "/restaurante/entregas";
  if (rol === "ADMIN") return "/restaurante/mesas";
  return "/login";
}

// MG-59: protege una ruta interna del panel del restaurante.
// - Sin sesión iniciada -> redirige a /login.
// - Con sesión pero rol no autorizado para esta ruta -> redirige a la
//   pantalla de inicio que sí le corresponde (nunca deja una pantalla
//   en blanco ni un error sin manejar).
function RutaProtegida({ roles, children }) {
  const usuario = obtenerUsuarioSesion();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />;
  }

  return children;
}

export default RutaProtegida;