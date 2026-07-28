import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthVisual from "../components/AuthVisual";
import { restablecerPassword } from "../services/recuperacionService";
import "../styles/auth.css";

function RestablecerPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!passwordNueva || !confirmar) {
      toast.error("Completa los 2 campos.");
      return;
    }
    if (passwordNueva.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== confirmar) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await restablecerPassword(token, passwordNueva);
      toast.success("Contraseña restablecida. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "No se pudo restablecer la contraseña.");
    } finally {
      setEnviando(false);
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
            <span className="auth-eyebrow">Nueva contraseña</span>
            <h2>Restablecer contraseña</h2>
            <p>Elige tu nueva contraseña para volver a entrar a MesaGo.</p>
          </div>

          <form className="auth-form" onSubmit={manejarEnvio}>
            <div className="campo">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="campo">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                placeholder="Repite tu nueva contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-auth" disabled={enviando}>
              {enviando ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>

          <p className="auth-footer">
            ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
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

export default RestablecerPassword;