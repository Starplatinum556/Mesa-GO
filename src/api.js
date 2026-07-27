export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:4000`;

const getToken = () => sessionStorage.getItem("token");

export const apiFetch = async (endpoint, opciones = {}) => {
  const respuesta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...opciones.headers,
    },
  });

  return respuesta;
};

// MG-56: para subir archivos con FormData no se debe establecer
// Content-Type manualmente, porque el navegador genera el boundary.
export const apiFetchArchivo = async (endpoint, formData) => {
  const respuesta = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  return respuesta;
};

// Construye la URL completa para imágenes guardadas en el backend.
export const urlImagen = (rutaRelativa) => {
  if (!rutaRelativa) return null;

  if (/^https?:\/\//.test(rutaRelativa)) {
    return rutaRelativa;
  }

  return `${BASE_URL}${rutaRelativa}`;
};

// Procesa las respuestas compartidas por los servicios.
export async function procesarRespuesta(
  respuesta,
  mensajeDefecto = "Ocurrió un error inesperado"
) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || mensajeDefecto);
  }

  return datos;
}