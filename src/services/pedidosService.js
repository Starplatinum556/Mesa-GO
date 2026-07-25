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

// MG-40: detalle completo de un pedido (items con cantidad, precio
// unitario y subtotal), para el modal "Ver detalle".
export async function obtenerDetallePedido(id) {
  const respuesta = await apiFetch(`/api/pedidos/${id}`);
  return procesarRespuesta(respuesta);
}

// MG-40/MG-47: avanza el pedido al siguiente estado de su etapa
// (Cocina: Nuevo -> En preparación -> Listo para entregar). El
// backend calcula y valida la transición.
export async function actualizarEstadoPedido(id, estadoEsperado) {
  const respuesta = await apiFetch(`/api/pedidos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado: estadoEsperado }),
  });
  return procesarRespuesta(respuesta);
}