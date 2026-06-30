import { Link } from "react-router-dom";

function Login() {
  return (
    <main className="auth-pagina">
      <section className="auth-card">
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
          <span>Acceso al sistema</span>
          <h2>Iniciar sesión</h2>
          <p>
            Ingresa tus credenciales para acceder al panel principal de MesaGo.
          </p>
        </div>

        <form className="auth-form">
          <div className="campo">
            <label>Correo electrónico</label>
            <input type="email" placeholder="ejemplo@correo.com" />
          </div>

          <div className="campo">
            <label>Contraseña</label>
            <input type="password" placeholder="Ingresa tu contraseña" />
          </div>

          <div className="opciones-form">
            <label>
              <input type="checkbox" />
              Recordarme
            </label>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="button" className="btn-auth">
            Ingresar
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>

        <Link to="/" className="volver-inicio">
          ← Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default Login;