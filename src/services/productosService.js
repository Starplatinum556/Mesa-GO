import { apiFetch, procesarRespuesta } from "../api";

const MENSAJE_ERROR = "Ocurrió un error con los productos";

export async function obtenerProductos() {
  const respuesta = await apiFetch("/api/productos");
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function crearProducto(producto) {
  const respuesta = await apiFetch("/api/productos", {
    method: "POST",
    body: JSON.stringify(producto),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function actualizarProducto(id, producto) {
  const respuesta = await apiFetch(`/api/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(producto),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function eliminarProducto(id) {
  const respuesta = await apiFetch(`/api/productos/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function cambiarDisponibilidadProducto(id) {
  const respuesta = await apiFetch(`/api/productos/${id}/disponibilidad`, {
    method: "PATCH",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}