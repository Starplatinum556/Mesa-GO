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