import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthVisual from "../components/AuthVisual";
import "../styles/auth.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:4000/api`;

function Registro() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [nombreRestaurante, setNombreRestaurante] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ruc, setRuc] = useState("");

  const validarPaso1 = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !password || !confirmar) {
      toast.error("Todos los campos son requeridos.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      toast.error("El formato del correo no es válido.");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setPaso(2);
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    if (!nombreRestaurante.trim() || !direccion.trim() || !telefono.trim()) {
      toast.error("Nombre, dirección y teléfono del restaurante son requeridos.");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo,
          password,
          nombreRestaurante,
          direccion,
          telefono,
          ruc,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        toast.error(datos.error || "Error al registrar.");
        return;
      }
      sessionStorage.setItem("token", datos.token);
      sessionStorage.setItem("usuarioMesaGo", JSON.stringify(datos.usuario));
      navigate("/restaurante");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-pagina">
      <section className="auth-form-panel">
        <div className="auth-form-inner registro-form-inner mgi-entrada">
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

          {/* Wizard visual */}
          <div className="auth-wizard">
            <div className="auth-wizard-paso">
              <div className={`auth-wizard-circulo ${paso >= 1 ? "activo" : ""}`}>1</div>
              <span className={`auth-wizard-etiqueta ${paso >= 1 ? "activo" : ""}`}>Tu cuenta</span>
            </div>
            <div className={`auth-wizard-linea ${paso >= 2 ? "activo" : ""}`} />
            <div className="auth-wizard-paso">
              <div className={`auth-wizard-circulo ${paso >= 2 ? "activo" : ""}`}>2</div>
              <span className={`auth-wizard-etiqueta ${paso >= 2 ? "activo" : ""}`}>Tu restaurante</span>
            </div>
          </div>

          {/* PASO 1 */}
          {paso === 1 && (
            <div key="paso-1" className="mgi-entrada">
              <div className="auth-header">
                <span className="auth-eyebrow">Paso 1 de 2</span>
                <h2>Datos del administrador</h2>
                <p>Crea tu cuenta como administrador de MesaGo.</p>
              </div>

              <form className="auth-form" onSubmit={validarPaso1}>
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
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
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

                <button type="submit" className="btn-auth">
                  Siguiente
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div key="paso-2" className="mgi-entrada">
              <div className="auth-header">
                <span className="auth-eyebrow">Paso 2 de 2</span>
                <h2>Datos del restaurante</h2>
                <p>Configura la información de tu negocio en MesaGo.</p>
              </div>

              <form className="auth-form" onSubmit={manejarRegistro}>
                <div className="campo">
                  <label>Nombre del negocio</label>
                  <input
                    type="text"
                    placeholder="Ej: Restaurante El Sabor"
                    value={nombreRestaurante}
                    onChange={(e) => setNombreRestaurante(e.target.value)}
                  />
                </div>

                <div className="campo">
                  <label>Dirección</label>
                  <input
                    type="text"
                    placeholder="Av. Principal 123"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>

                <div className="campo">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="0999999999"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className="campo">
                  <label>
                    RUC <span className="campo-opcional">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0000000000001"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                  />
                </div>

                <div className="auth-form-botones">
                  <button
                    type="button"
                    className="btn-auth-volver"
                    onClick={() => setPaso(1)}
                    disabled={cargando}
                  >
                    ← Volver
                  </button>

                  <button type="submit" className="btn-auth" disabled={cargando}>
                    {cargando ? "Creando restaurante..." : "Crear restaurante"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="auth-footer">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
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

export default Registro;