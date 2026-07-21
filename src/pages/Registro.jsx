import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const estiloWizard = {
  contenedor: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0",
    margin: "1.5rem 0 1rem",
  },
  paso: (activo) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  }),
  circulo: (activo) => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: activo ? "#2563eb" : "#e5e7eb",
    color: activo ? "#fff" : "#9ca3af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    transition: "all 0.3s",
  }),
  etiqueta: (activo) => ({
    fontSize: "11px",
    fontWeight: activo ? "700" : "400",
    color: activo ? "#2563eb" : "#9ca3af",
    whiteSpace: "nowrap",
  }),
  linea: (activo) => ({
    flex: 1,
    height: "2px",
    background: activo ? "#2563eb" : "#e5e7eb",
    margin: "0 8px",
    marginBottom: "18px",
    transition: "all 0.3s",
  }),
};

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
      alert("Todos los campos son requeridos.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      alert("El formato del correo no es válido.");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    setPaso(2);
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    if (!nombreRestaurante.trim() || !direccion.trim() || !telefono.trim()) {
      alert("Nombre, dirección y teléfono del restaurante son requeridos.");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch("http://localhost:4000/api/registro", {
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
        alert(datos.error || "Error al registrar.");
        return;
      }
      sessionStorage.setItem("token", datos.token);
      sessionStorage.setItem("usuarioMesaGo", JSON.stringify(datos.usuario));
      navigate("/restaurante");
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el servidor.");
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
          <h1>Mesa<span>Go</span></h1>
        </div>

        {/* Wizard visual */}
        <div style={estiloWizard.contenedor}>
          <div style={estiloWizard.paso(paso >= 1)}>
            <div style={estiloWizard.circulo(paso >= 1)}>1</div>
            <span style={estiloWizard.etiqueta(paso >= 1)}>Tu cuenta</span>
          </div>
          <div style={estiloWizard.linea(paso >= 2)} />
          <div style={estiloWizard.paso(paso >= 2)}>
            <div style={estiloWizard.circulo(paso >= 2)}>2</div>
            <span style={estiloWizard.etiqueta(paso >= 2)}>Tu restaurante</span>
          </div>
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <>
            <div className="auth-header">
              <span>Paso 1 de 2</span>
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
                Siguiente →
              </button>
            </form>
          </>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <>
            <div className="auth-header">
              <span>Paso 2 de 2</span>
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
                  RUC{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="0000000000001"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    padding: "0.85rem",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#fff",
                    color: "#374151",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  ← Volver
                </button>

                <button
                  type="submit"
                  className="btn-auth"
                  disabled={cargando}
                  style={{ flex: 2 }}
                >
                  {cargando ? "Creando restaurante..." : "Crear restaurante"}
                </button>
              </div>
            </form>
          </>
        )}

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