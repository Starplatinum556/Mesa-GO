import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con los pedidos");
  }
  return datos;
}

// MG-47: pedidos reales del restaurante del usuario autenticado.
// El backend ya filtra por restaurante_id usando el token (JWT).
export async function obtenerPedidos() {
  const respuesta = await apiFetch("/api/pedidos");
  return procesarRespuesta(respuesta);
}

// MG-47: mueve un pedido al siguiente estado de su etapa
// (Cocina -> "Listo", Despachador -> "Entregado"). El backend valida
// que el rol autenticado pueda hacer esa transición.
export async function actualizarEstadoPedido(id, estado) {
  const respuesta = await apiFetch(`/api/pedidos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  return procesarRespuesta(respuesta);
}