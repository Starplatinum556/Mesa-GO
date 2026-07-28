import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { urlImagen } from "../../api";
import {
  actualizarMiPerfil,
  cambiarPassword,
  obtenerMiPerfil,
  subirFotoPerfil,
} from "../../services/perfilService";
import "../../styles/perfil.css";

const NOMBRE_ROL = {
  ADMIN: "Administrador",
  COCINERO: "Cocinero",
  DESPACHADOR: "Despachador",
};

// MP: 3 MB, mismo límite que valida el backend (multer).
const TAMANO_MAXIMO_IMAGEN = 3 * 1024 * 1024;
const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

function archivoValido(archivo) {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
    toast.error("Formato no permitido. Usa JPG, PNG, WEBP o SVG.");
    return false;
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    toast.error("La imagen no puede pesar más de 3 MB.");
    return false;
  }
  return true;
}

const FORM_PASSWORD_VACIO = {
  passwordActual: "",
  passwordNueva: "",
  confirmarPassword: "",
};

/* ──────────────────────────────
   Helpers
────────────────────────────── */
function formatFecha(valor) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFechaCorta(valor) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// El input type="date" necesita "YYYY-MM-DD" — lo que llega de la
// BD puede venir con hora/zona incluida, así que se recorta acá.
function formatFechaInput(valor) {
  if (!valor) return "";
  return new Date(valor).toISOString().slice(0, 10);
}

// Actualiza el nombre cacheado en sessionStorage (el que usa la
// topbar vía obtenerUsuarioSesion) para que no quede desactualizado
// hasta el próximo login.
function sincronizarSesion(cambios) {
  const guardado = sessionStorage.getItem("usuarioMesaGo");
  if (!guardado) return;
  try {
    const usuarioActual = JSON.parse(guardado);
    sessionStorage.setItem(
      "usuarioMesaGo",
      JSON.stringify({ ...usuarioActual, ...cambios })
    );
  } catch {
    // si el valor guardado no es JSON válido, no rompemos nada
  }
}

/* ──────────────────────────────
   Fila de dato personal (modo lectura)
────────────────────────────── */
function FilaInfo({ label, value, Icon }) {
  return (
    <div className="mp-info-fila">
      <span className="mp-info-icono">
        <Icon size={17} />
      </span>
      <div className="mp-info-texto">
        <span className="mp-info-label">{label}</span>
        <span className={value ? "mp-info-valor" : "mp-info-valor mp-info-valor-vacio"}>
          {value || "No registrado"}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────
   Fila de dato personal (modo edición)
────────────────────────────── */
function FilaEditable({ label, Icon, children }) {
  return (
    <div className="mp-info-fila mp-info-fila-editable">
      <span className="mp-info-icono">
        <Icon size={17} />
      </span>
      <div className="mp-info-texto mp-info-texto-editable">
        <label className="mp-info-label">{label}</label>
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────
   Fila de seguridad (con acción opcional)
────────────────────────────── */
function FilaSeguridad({ label, value, Icon, accion, onAccion }) {
  return (
    <div className="mp-seguridad-fila">
      <span className="mp-seguridad-icono">
        <Icon size={17} />
      </span>
      <div className="mp-seguridad-texto">
        <span className="mp-seguridad-label">{label}</span>
        <span className="mp-seguridad-valor">{value}</span>
      </div>
      {accion && (
        <button type="button" className="mp-seguridad-accion" onClick={onAccion}>
          {accion}
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────
   Componente principal
────────────────────────────── */
function MiPerfil() {
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState(null);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const inputFotoRef = useRef(null);

  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [formPassword, setFormPassword] = useState(FORM_PASSWORD_VACIO);

  useEffect(() => {
    let activo = true;
    obtenerMiPerfil()
      .then((data) => {
        if (activo) setPerfil(data);
      })
      .catch((err) => {
        if (activo) toast.error(err.message || "No se pudo cargar tu perfil.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const iniciarEdicion = () => {
    setFormulario({
      nombre: perfil.nombre || "",
      correo: perfil.correo || "",
      telefono: perfil.telefono || "",
      cedula: perfil.cedula || "",
      fecha_nacimiento: formatFechaInput(perfil.fecha_nacimiento),
      genero: perfil.genero || "",
      nacionalidad: perfil.nacionalidad || "",
    });
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFormulario(null);
  };

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    if (!formulario.nombre.trim() || !formulario.correo.trim()) {
      toast.error("Nombre y correo son requeridos.");
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await actualizarMiPerfil(formulario);
      setPerfil((prev) => ({ ...prev, ...actualizado }));
      sincronizarSesion({ nombre: actualizado.nombre });
      toast.success("Información actualizada.");
      setEditando(false);
      setFormulario(null);
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar tu perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // MP: subir/reemplazar la foto de perfil — acción independiente del
  // formulario de edición, se guarda al toque (mismo criterio que
  // logo/banner del restaurante en MG-56, pero acá no hace falta
  // gatearlo detrás de "Editar" porque no comparte pantalla con otros
  // campos de solo-lectura que puedan confundirse).
  const manejarSeleccionFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!archivo || !archivoValido(archivo)) return;

    setSubiendoFoto(true);
    try {
      const { foto } = await subirFotoPerfil(archivo);
      setPerfil((prev) => ({ ...prev, foto }));
      sincronizarSesion({ foto });
      toast.success("Foto de perfil actualizada.");
    } catch (err) {
      toast.error(err.message || "No se pudo subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  // MP-58: cambio de contraseña — toggle inline en la tarjeta de
  // Seguridad, mismo criterio que iniciarEdicion/cancelarEdicion.
  const iniciarCambioPassword = () => {
    setFormPassword(FORM_PASSWORD_VACIO);
    setCambiandoPassword(true);
  };

  const cancelarCambioPassword = () => {
    setCambiandoPassword(false);
    setFormPassword(FORM_PASSWORD_VACIO);
  };

  const actualizarCampoPassword = (campo, valor) => {
    setFormPassword((prev) => ({ ...prev, [campo]: valor }));
  };

  // El JWT actual sigue siendo válido hasta que expire (no hay
  // revocación de tokens), así que después de un cambio exitoso
  // cerramos la sesión manualmente y mandamos a /login — es lo que
  // realmente "cierra el círculo" de seguridad acá.
  const enviarCambioPassword = async (e) => {
    e.preventDefault();
    const { passwordActual, passwordNueva, confirmarPassword } = formPassword;

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      toast.error("Completa los 3 campos.");
      return;
    }
    if (passwordNueva.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== confirmarPassword) {
      toast.error("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    if (passwordNueva === passwordActual) {
      toast.error("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    setGuardandoPassword(true);
    try {
      await cambiarPassword({ passwordActual, passwordNueva });
      toast.success("Contraseña actualizada. Vuelve a iniciar sesión.");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("usuarioMesaGo");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (cargando) {
    return (
      <section className="modulo-admin">
        <p className="mp-cargando">Cargando tu perfil...</p>
      </section>
    );
  }

  if (!perfil) {
    return (
      <section className="modulo-admin">
        <p className="mp-cargando">No se pudo cargar tu perfil. Intenta recargar la página.</p>
      </section>
    );
  }

  const cuentaActiva = perfil.estado === "ACTIVO";

  return (
    <section className="modulo-admin">
      {/* Header */}
      <div className="recepcion-header">
        <div>
          <h1>Mi Perfil</h1>
          <p>Administra tu información personal y la seguridad de tu cuenta.</p>
        </div>
      </div>

      <div className="mp-grid">
        {/* Tarjeta: Información personal */}
        <section className="mp-card" aria-labelledby="mp-info-title">
          <div className="mp-card-header">
            <div className="mp-card-heading">
              <span className="mp-icon-badge mp-icon-badge-naranja">
                <User size={20} />
              </span>
              <h2 id="mp-info-title">Información personal</h2>
            </div>

            {!editando ? (
              <button key="btn-editar" type="button" className="mp-btn-editar" onClick={iniciarEdicion}>
                <Pencil size={15} />
                Editar información
              </button>
            ) : (
              <button key="btn-cancelar" type="button" className="mp-btn-cancelar" onClick={cancelarEdicion} disabled={guardando}>
                <X size={15} />
                Cancelar
              </button>
            )}
          </div>

          <div className="mp-card-body">
            <div className="mp-foto-bloque">
              <div className="mp-foto">
                {perfil.foto ? (
                  <img src={urlImagen(perfil.foto)} alt="Tu foto de perfil" className="mp-foto-imagen" />
                ) : (
                  <div className="mp-foto-placeholder">
                    <User size={48} />
                  </div>
                )}

                {editando && (
                  <>
                    <input
                      ref={inputFotoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={manejarSeleccionFoto}
                      hidden
                    />
                    <button
                      type="button"
                      className="mp-foto-camara"
                      aria-label="Cambiar foto de perfil"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={subiendoFoto}
                    >
                      <Camera size={16} />
                    </button>
                  </>
                )}
              </div>

              <div className="mp-miembro-desde">
                <span className="mp-miembro-icono">
                  <Calendar size={15} />
                </span>
                <div className="mp-miembro-texto">
                  <span>Miembro desde</span>
                  <strong>{formatFechaCorta(perfil.created_at) || "No disponible"}</strong>
                </div>
              </div>
            </div>

            {!editando ? (
              <div key="vista-detalles" className="mp-detalles">
                <FilaInfo label="Nombre completo" value={perfil.nombre} Icon={User} />
                <FilaInfo label="Correo electrónico" value={perfil.correo} Icon={Mail} />
                <FilaInfo label="Teléfono" value={perfil.telefono} Icon={Phone} />
                <FilaInfo label="Cédula" value={perfil.cedula} Icon={CreditCard} />
                <FilaInfo
                  label="Fecha de nacimiento"
                  value={formatFecha(perfil.fecha_nacimiento)}
                  Icon={Calendar}
                />
                <FilaInfo label="Género" value={perfil.genero} Icon={UserRound} />
                <FilaInfo label="Nacionalidad" value={perfil.nacionalidad} Icon={Globe} />
              </div>
            ) : (
              <form key="form-detalles" className="mp-detalles" onSubmit={guardarCambios}>
                <FilaEditable label="Nombre completo" Icon={User}>
                  <input
                    type="text"
                    className="mp-input"
                    value={formulario.nombre}
                    onChange={(e) => actualizarCampo("nombre", e.target.value)}
                    required
                  />
                </FilaEditable>

                <FilaEditable label="Correo electrónico" Icon={Mail}>
                  <input
                    type="email"
                    className="mp-input"
                    value={formulario.correo}
                    onChange={(e) => actualizarCampo("correo", e.target.value)}
                    required
                  />
                </FilaEditable>

                <FilaEditable label="Teléfono" Icon={Phone}>
                  <input
                    type="tel"
                    className="mp-input"
                    placeholder="098 765 4321"
                    value={formulario.telefono}
                    onChange={(e) => actualizarCampo("telefono", e.target.value)}
                  />
                </FilaEditable>

                <FilaEditable label="Cédula" Icon={CreditCard}>
                  <input
                    type="text"
                    className="mp-input"
                    placeholder="10 dígitos"
                    value={formulario.cedula}
                    onChange={(e) => actualizarCampo("cedula", e.target.value)}
                  />
                </FilaEditable>

                <FilaEditable label="Fecha de nacimiento" Icon={Calendar}>
                  <input
                    type="date"
                    className="mp-input"
                    value={formulario.fecha_nacimiento}
                    onChange={(e) => actualizarCampo("fecha_nacimiento", e.target.value)}
                  />
                </FilaEditable>

                <FilaEditable label="Género" Icon={UserRound}>
                  <select
                    className="mp-input"
                    value={formulario.genero}
                    onChange={(e) => actualizarCampo("genero", e.target.value)}
                  >
                    <option value="">Sin especificar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </FilaEditable>

                <FilaEditable label="Nacionalidad" Icon={Globe}>
                  <input
                    type="text"
                    className="mp-input"
                    placeholder="Ecuatoriana"
                    value={formulario.nacionalidad}
                    onChange={(e) => actualizarCampo("nacionalidad", e.target.value)}
                  />
                </FilaEditable>

                <div className="mp-form-acciones">
                  <button type="submit" className="mp-btn-guardar" disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Tarjeta: Seguridad de la cuenta */}
        <section className="mp-card" aria-labelledby="mp-seguridad-title">
          <div className="mp-card-header mp-card-header-simple">
            <span className="mp-icon-badge mp-icon-badge-morado">
              <ShieldCheck size={20} />
            </span>
            <h2 id="mp-seguridad-title">Seguridad de la cuenta</h2>
          </div>

          <div className="mp-card-body mp-card-body-columna">
            <div className="mp-banner mp-banner-morado">
              <span className="mp-banner-icono">
                <ShieldAlert size={18} />
              </span>
              <div>
                <p className="mp-banner-titulo">Protege tu cuenta</p>
                <p className="mp-banner-desc">
                  Mantén tu información segura actualizando tu contraseña periódicamente.
                </p>
              </div>
            </div>

            {!cambiandoPassword ? (
              <FilaSeguridad
                key="fila-password"
                label="Contraseña"
                value="**********"
                Icon={Lock}
                accion={editando ? "Cambiar contraseña" : null}
                onAccion={iniciarCambioPassword}
              />
            ) : (
              <form key="form-password" className="mp-password-form" onSubmit={enviarCambioPassword}>
                <div className="mp-password-campos">
                  <div className="mp-campo-password">
                    <label>Contraseña actual</label>
                    <input
                      type="password"
                      className="mp-input"
                      value={formPassword.passwordActual}
                      onChange={(e) => actualizarCampoPassword("passwordActual", e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <div className="mp-campo-password">
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      className="mp-input"
                      placeholder="Mínimo 6 caracteres"
                      value={formPassword.passwordNueva}
                      onChange={(e) => actualizarCampoPassword("passwordNueva", e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="mp-campo-password">
                    <label>Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      className="mp-input"
                      value={formPassword.confirmarPassword}
                      onChange={(e) => actualizarCampoPassword("confirmarPassword", e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="mp-form-acciones">
                  <button
                    type="button"
                    className="mp-btn-cancelar"
                    onClick={cancelarCambioPassword}
                    disabled={guardandoPassword}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="mp-btn-guardar" disabled={guardandoPassword}>
                    {guardandoPassword ? "Guardando..." : "Actualizar contraseña"}
                  </button>
                </div>
              </form>
            )}

            <div key={cuentaActiva ? "cuenta-activa" : "cuenta-inactiva"} className={`mp-banner ${cuentaActiva ? "mp-banner-verde" : "mp-banner-rojo"}`}>
              <span className="mp-banner-icono">
                {cuentaActiva ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </span>
              <div>
                <p className="mp-banner-titulo">
                  {cuentaActiva ? "Cuenta activa" : "Cuenta desactivada"}
                </p>
                <p className="mp-banner-desc">
                  {cuentaActiva
                    ? "Tu cuenta se encuentra activa y sin restricciones de acceso."
                    : "Tu cuenta está desactivada. Contacta al administrador de tu restaurante."}
                </p>
              </div>
            </div>

            <div className="mp-rol-info">
              <span>Rol</span>
              <strong>{NOMBRE_ROL[perfil.rol] || perfil.rol}</strong>
              <span>·</span>
              <span>{perfil.restaurante_nombre}</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default MiPerfil;