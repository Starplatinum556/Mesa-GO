// Servicio de recuperación de contraseña — endpoints públicos,
// no requieren token de sesión (usuario deslogueado por definición).
const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:4000/api`;

async function manejarRespuesta(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // sin cuerpo JSON, poco probable acá
  }
  if (!res.ok) {
    throw new Error(data?.error || "Ocurrió un error inesperado.");
  }
  return data;
}

// POST /api/forgot-password — { correo }
// MODO DEMO: la respuesta trae "token" directo (ver nota en el
// backend). El día que se conecte correo real, esta función no
// cambia — solo dejaría de venir "token" en la respuesta.
export async function solicitarRecuperacion(correo) {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo }),
  });
  return manejarRespuesta(res);
}

// POST /api/reset-password — { token, passwordNueva }
export async function restablecerPassword(token, passwordNueva) {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, passwordNueva }),
  });
  return manejarRespuesta(res);
}