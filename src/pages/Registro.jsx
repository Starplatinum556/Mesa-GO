import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "../api";

function Registro() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolUsuario, setRolUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async (e) => {
    e.preventDefault();

    if (!nombre || !correo || !rolUsuario || !password || !confirmar) {
      alert("Todos los campos son requeridos.");
      return;
    }

    if (password !== confirmar) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Mapear el valor del select al rol que espera el backend
    const rolMap = {
      cliente: "CLIENTE",
      restaurante: "ADMIN",
      empleado: "COCINERO",
    };
    const rol = rolMap[rolUsuario];

    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:4000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, password, rol }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(datos.error || "Error al registrar usuario.");
        return;
      }

      // Guardar token y usuario en sessionStorage
      sessionStorage.setItem("token", datos.token);
      sessionStorage.setItem("usuarioMesaGo", JSON.stringify(datos.usuario));

      // Redirigir según rol
      if (datos.usuario.rol === "ADMIN") {
        navigate("/restaurante");
      } else if (datos.usuario.rol === "COCINERO") {
        navigate("/restaurante/cocina");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:4000.");
    } finally {
      setCargando(false);
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
            <input
              type="text"
              placeholder="Ingresa tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

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
            <input
              type="password"
              placeholder="Crea una contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-auth" disabled={cargando}>
            {cargando ? "Registrando..." : "Registrarse"}
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