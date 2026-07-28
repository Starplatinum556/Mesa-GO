import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthVisual from "../components/AuthVisual";
import { solicitarRecuperacion } from "../services/recuperacionService";
import "../styles/auth.css";
import "../styles/recuperacion.css";

function OlvidePassword() {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!correo.trim()) {
      toast.error("Ingresa tu correo electrónico.");
      return;
    }

    setEnviando(true);
    setResultado(null);
    try {
      const datos = await solicitarRecuperacion(correo.trim());
      setResultado(datos);
      toast.success("Enlace de recuperación generado.");
    } catch (err) {
      toast.error(err.message || "No se pudo generar el enlace.");
    } finally {
      setEnviando(false);
    }
  };

  const enlaceReset = resultado?.token
    ? `${window.location.origin}/restablecer-password/${resultado.token}`
    : null;

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
            <span className="auth-eyebrow">Recuperar acceso</span>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p>Ingresa el correo de tu cuenta y te generamos un enlace para restablecerla.</p>
          </div>

          {!enlaceReset ? (
            <form className="auth-form" onSubmit={manejarEnvio}>
              <div className="campo">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-auth" disabled={enviando}>
                {enviando ? "Generando enlace..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          ) : (
            <div className="auth-demo-caja">
              <span className="auth-demo-etiqueta">Modo demo</span>
              <p>
                Como el proyecto todavía no tiene envío de correo real, aquí está tu enlace
                de recuperación (esto normalmente te llegaría al correo):
              </p>
              <Link to={`/restablecer-password/${resultado.token}`} className="auth-demo-enlace">
                {enlaceReset}
              </Link>
              <p className="auth-demo-nota">Válido por 1 hora, un solo uso.</p>
            </div>
          )}

          <p className="auth-footer">
            ¿Ya te acordaste? <Link to="/login">Inicia sesión</Link>
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

export default OlvidePassword;