import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con las categorías");
  }
  return datos;
}

export async function obtenerCategorias() {
  const respuesta = await apiFetch("/api/categorias");
  return procesarRespuesta(respuesta);
}

export async function crearCategoria(categoria) {
  const respuesta = await apiFetch("/api/categorias", {
    method: "POST",
    body: JSON.stringify(categoria),
  });
  return procesarRespuesta(respuesta);
}

export async function actualizarCategoria(id, categoria) {
  const respuesta = await apiFetch(`/api/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(categoria),
  });
  return procesarRespuesta(respuesta);
}

export async function eliminarCategoria(id) {
  const respuesta = await apiFetch(`/api/categorias/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta);
}

export async function cambiarEstadoCategoria(id) {
  const respuesta = await apiFetch(`/api/categorias/${id}/estado`, {
    method: "PATCH",
  });
  return procesarRespuesta(respuesta);
}