export const BASE_URL = "http://localhost:4000";

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

// MG-56: para subir archivos (FormData) NO hay que fijar el
// "Content-Type" a mano — el navegador arma el boundary del
// multipart automáticamente. Por eso este helper es distinto de
// apiFetch en vez de reutilizarlo.
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

// MG-56: arma la URL completa para mostrar una imagen guardada
// (el backend devuelve rutas relativas, ej: "/uploads/restaurantes/1/logo-123.png").
export const urlImagen = (rutaRelativa) => {
  if (!rutaRelativa) return null;
  if (/^https?:\/\//.test(rutaRelativa)) return rutaRelativa;
  return `${BASE_URL}${rutaRelativa}`;
};

// Compartida por todos los services (productosService, categoriasService,
// zonasService, etc.) para no repetir la misma función en cada archivo.
// mensajeDefecto se usa si el backend no manda un "error" en el body.
export async function procesarRespuesta(respuesta, mensajeDefecto = "Ocurrió un error inesperado") {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || mensajeDefecto);
  }
  return datos;
}