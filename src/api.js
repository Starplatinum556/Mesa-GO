const BASE_URL = "http://localhost:4000";

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