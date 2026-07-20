import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con los productos");
  }
  return datos;
}

export async function obtenerProductos() {
  const respuesta = await apiFetch("/api/productos");
  return procesarRespuesta(respuesta);
}

export async function crearProducto(producto) {
  const respuesta = await apiFetch("/api/productos", {
    method: "POST",
    body: JSON.stringify(producto),
  });
  return procesarRespuesta(respuesta);
}

export async function actualizarProducto(id, producto) {
  const respuesta = await apiFetch(`/api/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(producto),
  });
  return procesarRespuesta(respuesta);
}

export async function eliminarProducto(id) {
  const respuesta = await apiFetch(`/api/productos/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta);
}

export async function cambiarDisponibilidadProducto(id) {
  const respuesta = await apiFetch(`/api/productos/${id}/disponibilidad`, {
    method: "PATCH",
  });
  return procesarRespuesta(respuesta);
}