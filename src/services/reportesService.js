import { apiFetch, procesarRespuesta } from "../api";

// MG-42 / MG-50: reporte del ADMIN para un rango de fechas.
// Si no se pasan fechas, el backend usa los últimos 7 días por defecto.
export async function obtenerReportes({ desde, hasta } = {}) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  const query = params.toString();
  const respuesta = await apiFetch(`/api/reportes${query ? `?${query}` : ""}`);
  return procesarRespuesta(respuesta, "No se pudo cargar el reporte.");
}