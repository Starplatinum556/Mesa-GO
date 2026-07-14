const API_URL = "http://localhost:4000/api/mesas";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con las mesas");
  }

  return datos;
}

export async function obtenerMesas() {
  const respuesta = await fetch(API_URL);
  return procesarRespuesta(respuesta);
}

export async function crearMesa(mesa) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mesa),
  });

  return procesarRespuesta(respuesta);
}

export async function actualizarMesa(id, mesa) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mesa),
  });

  return procesarRespuesta(respuesta);
}

export async function eliminarMesa(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return procesarRespuesta(respuesta);
}