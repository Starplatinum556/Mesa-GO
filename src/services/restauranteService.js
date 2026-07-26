import { apiFetch, apiFetchArchivo } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con la información del restaurante");
  }
  return datos;
}

// MG-47: datos reales del restaurante del admin autenticado
// (tabla restaurantes), no información inventada en el frontend.
export async function obtenerRestaurante() {
  const respuesta = await apiFetch("/api/restaurante");
  return procesarRespuesta(respuesta);
}

export async function actualizarRestaurante(datosRestaurante) {
  const respuesta = await apiFetch("/api/restaurante", {
    method: "PUT",
    body: JSON.stringify(datosRestaurante),
  });
  return procesarRespuesta(respuesta);
}

// MG-56: subir/reemplazar el logo. Recibe el File tal cual sale
// del <input type="file">.
export async function subirLogoRestaurante(archivo) {
  const formData = new FormData();
  formData.append("logo", archivo);
  const respuesta = await apiFetchArchivo("/api/restaurante/logo", formData);
  return procesarRespuesta(respuesta);
}

// MG-56: subir/reemplazar el banner.
export async function subirBannerRestaurante(archivo) {
  const formData = new FormData();
  formData.append("banner", archivo);
  const respuesta = await apiFetchArchivo("/api/restaurante/banner", formData);
  return procesarRespuesta(respuesta);
}