import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthVisual from "../components/AuthVisual";
import "../styles/auth.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:4000/api`;

function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async (e) => {
    e.preventDefault();

    if (!correo || !password) {
      toast.error("Ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}` },
        body: JSON.stringify({ correo, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        toast.error(datos.error || "Correo o contraseña incorrectos.");
        return;
      }

      // Guardamos el usuario logueado para usarlo en otras pantallas
      sessionStorage.setItem("token", datos.token);
      sessionStorage.setItem("usuarioMesaGo", JSON.stringify(datos.usuario));

      // MG-59: los 3 roles (ADMIN, COCINERO, DESPACHADOR) entran al
      // panel interno; RestauranteLayout decide qué ve cada uno.
      navigate("/restaurante");
    } catch (err) {
      console.error(err);
      toast.error(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:4000."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-pagina">
      <section className="auth-form-panel">
        <div className="auth-form-inner mgi-entrada">
          <div className="auth-logo">
            <div className="logo-cuadro">
              <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="44" height="44" rx="14" />
                <path d="M22 38h20" />
                <path d="M24 38c0-8 4-14 8-14s8 6 8 14" />
                <path d="M32 20v-4" />
                <circle cx="32" cy="16" r="2" />
                <path d="M22 44h20" />
              </svg>
            </div>

            <h1>
              Mesa<span>Go</span>
            </h1>
          </div>

          <div className="auth-header">
            <span className="auth-eyebrow">Acceso al sistema</span>
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales para acceder al panel principal de MesaGo.</p>
          </div>

          <form className="auth-form" onSubmit={manejarLogin}>
            <div className="campo">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="campo">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="opciones-form">
              <label>
                <input type="checkbox" />
                Recordarme
              </label>

              <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" className="btn-auth" disabled={cargando}>
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>

          <Link to="/" className="volver-inicio">
            ← Volver al inicio
          </Link>
        </div>
      </section>

      <AuthVisual />
    </main>
  );
}

export default Login;