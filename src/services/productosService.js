import { apiFetch, apiFetchArchivo, procesarRespuesta } from "../api";

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

// ==========================
// Subir/reemplazar la imagen de un producto.
// Usa apiFetchArchivo (de api.js), que ya arma la URL completa con
// BASE_URL y toma el token desde sessionStorage — igual que el resto
// de tus services.
// ==========================
export async function subirImagenProducto(id, archivo) {
  const formData = new FormData();
  formData.append("imagen", archivo);

  const respuesta = await apiFetchArchivo(`/api/productos/${id}/imagen`, formData);
  return procesarRespuesta(respuesta, "No se pudo subir la imagen del producto.");
}