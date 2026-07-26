// MP: servicio de Mi Perfil — mismo patrón que entregasService.js
// (token desde sessionStorage, misma API_URL).
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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

// GET /api/mi-perfil — datos del usuario en sesión (los 3 roles).
export async function obtenerMiPerfil() {
  const res = await fetch(`${API_URL}/mi-perfil`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}

// PATCH /api/mi-perfil — edita datos personales (no contraseña ni foto).
export async function actualizarMiPerfil(datos) {
  const res = await fetch(`${API_URL}/mi-perfil`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res);
}