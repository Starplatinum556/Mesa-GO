import { apiFetch, apiFetchArchivo, procesarRespuesta } from "../api";

export async function obtenerMesas() {
  const respuesta = await apiFetch("/api/mesas");
  return procesarRespuesta(respuesta);
}

export async function crearMesa(mesa) {
  const respuesta = await apiFetch("/api/mesas", {
    method: "POST",
    body: JSON.stringify(mesa),
  });
  return procesarRespuesta(respuesta);
}

export async function actualizarMesa(id, mesa) {
  const respuesta = await apiFetch(`/api/mesas/${id}`, {
    method: "PUT",
    body: JSON.stringify(mesa),
  });
  return procesarRespuesta(respuesta);
}

export async function eliminarMesa(id) {
  const respuesta = await apiFetch(`/api/mesas/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta);
}

export async function subirImagenMesa(id, archivo) {
  const formData = new FormData();
  formData.append("imagen", archivo);
 
  const respuesta = await apiFetchArchivo(`/api/mesas/${id}/imagen`, formData);
  return procesarRespuesta(respuesta, "No se pudo subir la imagen de la mesa.");
}