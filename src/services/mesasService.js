import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con las mesas");
  }
  return datos;
}

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