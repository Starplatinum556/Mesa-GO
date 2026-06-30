import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Registro() {
  const navigate = useNavigate();

  const [rolUsuario, setRolUsuario] = useState("");

  const manejarRegistro = (e) => {
    e.preventDefault();

    if (!rolUsuario) {
      alert("Selecciona un tipo de usuario para continuar.");
      return;
    }

    if (rolUsuario === "cliente") {
      navigate("/");
    }

    if (rolUsuario === "restaurante") {
      navigate("/restaurante");
    }

    if (rolUsuario === "empleado") {
      navigate("/restaurante/cocina");
    }
  };

  return (
    <main className="auth-pagina">
      <section className="auth-card registro-card">
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
          <span>Nuevo usuario</span>
          <h2>Crear cuenta</h2>
          <p>
            Registra tus datos y selecciona el tipo de usuario que utilizará
            MesaGo.
          </p>
        </div>

        <form className="auth-form" onSubmit={manejarRegistro}>
          <div className="campo">
            <label>Nombre completo</label>
            <input type="text" placeholder="Ingresa tu nombre completo" />
          </div>

          <div className="campo">
            <label>Correo electrónico</label>
            <input type="email" placeholder="ejemplo@correo.com" />
          </div>

          <div className="campo">
            <label>Tipo de usuario</label>
            <select
              value={rolUsuario}
              onChange={(e) => setRolUsuario(e.target.value)}
            >
              <option value="">Selecciona un tipo de usuario</option>
              <option value="cliente">Cliente</option>
              <option value="restaurante">Restaurante / Administrador</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>

          <div className="campo">
            <label>Contraseña</label>
            <input type="password" placeholder="Crea una contraseña" />
          </div>

          <div className="campo">
            <label>Confirmar contraseña</label>
            <input type="password" placeholder="Repite tu contraseña" />
          </div>

          <button type="submit" className="btn-auth">
            Registrarse
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>

        <Link to="/" className="volver-inicio">
          ← Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default Registro;