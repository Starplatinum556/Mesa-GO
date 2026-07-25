import { apiFetch, procesarRespuesta } from "../api";

const MENSAJE_ERROR = "Ocurrió un error con las zonas";

export async function obtenerZonas() {
  const respuesta = await apiFetch("/api/zonas");
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function crearZona(zona) {
  const respuesta = await apiFetch("/api/zonas", {
    method: "POST",
    body: JSON.stringify(zona),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function actualizarZona(id, zona) {
  const respuesta = await apiFetch(`/api/zonas/${id}`, {
    method: "PUT",
    body: JSON.stringify(zona),
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function eliminarZona(id) {
  const respuesta = await apiFetch(`/api/zonas/${id}`, {
    method: "DELETE",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}

export async function cambiarEstadoZona(id) {
  const respuesta = await apiFetch(`/api/zonas/${id}/estado`, {
    method: "PATCH",
  });
  return procesarRespuesta(respuesta, MENSAJE_ERROR);
}