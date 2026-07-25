import { apiFetch, procesarRespuesta } from "../api";

const MENSAJE_ERROR = "Ocurrió un error con las categorías";

export async function obtenerCategorias() {
  const respuesta = await apiFetch("/api/categorias");
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function crearCategoria(categoria) {
  const respuesta = await apiFetch("/api/categorias", {
    method: "POST",
    body: JSON.stringify(categoria),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function actualizarCategoria(id, categoria) {
  const respuesta = await apiFetch(`/api/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(categoria),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function eliminarCategoria(id) {
  const respuesta = await apiFetch(`/api/categorias/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function cambiarEstadoCategoria(id) {
  const respuesta = await apiFetch(`/api/categorias/${id}/estado`, {
    method: "PATCH",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}