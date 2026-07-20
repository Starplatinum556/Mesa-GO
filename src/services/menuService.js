import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error al cargar el menú.");
  }
  return datos;
}

// MG-64: obtiene la mesa y el menú disponible a partir del token del QR.
// Es un endpoint público (no requiere sesión iniciada).
export async function obtenerMenuPorCodigoQr(codigoQr) {
  const respuesta = await apiFetch(`/api/menu/${codigoQr}`);
  return procesarRespuesta(respuesta);
}