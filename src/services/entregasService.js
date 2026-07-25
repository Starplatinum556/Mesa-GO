// MG-48: servicio de Entregas — conecta Entregas.jsx con las rutas
// reales del backend (/api/entregas...). Lee el token igual que el
// resto de la app: sessionStorage, clave "token" (ver cierre de
// sesión en RestauranteLayout.jsx).
//
// Ajusta API_URL si tu backend no corre en localhost:4000 — puedes
// definir VITE_API_URL en un archivo .env de Vite para no tocar
// este archivo en cada entorno (local, producción, etc.).
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
    // Algunas respuestas (poco probable acá) pueden no traer JSON.
  }
  if (!res.ok) {
    throw new Error(data?.error || "Ocurrió un error inesperado.");
  }
  return data;
}

// GET /api/entregas — pedidos "Listo para entregar" y "Entregado".
export async function obtenerEntregas() {
  const res = await fetch(`${API_URL}/entregas`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}

// GET /api/entregas/historial — pedidos completados/cancelados/no
// entregados. Acepta filtros opcionales: { busqueda, desde, hasta, estado }.
// MGH: si no se pasa "estado", el backend trae Completado + Cancelado +
// No entregado juntos — pásalo explícito si necesitas solo uno de esos.
export async function obtenerHistorialEntregas(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.estado && filtros.estado !== "todos") params.set("estado", filtros.estado);

  const query = params.toString();
  const res = await fetch(`${API_URL}/entregas/historial${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}

// GET /api/entregas/:id — detalle con items (nombre, cantidad,
// precio_unitario, subtotal) + total del pedido.
export async function obtenerDetalleEntrega(id) {
  const res = await fetch(`${API_URL}/entregas/${id}`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}

// PATCH /api/entregas/:id/entregar — Listo/Listo para entregar -> Entregado.
export async function marcarEntregado(id) {
  const res = await fetch(`${API_URL}/entregas/${id}/entregar`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}

// PATCH /api/entregas/:id/completar — Entregado -> Completado, libera la mesa.
export async function completarServicio(id) {
  const res = await fetch(`${API_URL}/entregas/${id}/completar`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return manejarRespuesta(res);
}