const API_URL = "http://localhost:4000/api/productos";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error con los productos");
  }

  return datos;
}

export async function obtenerProductos() {
  const respuesta = await fetch(API_URL);
  return procesarRespuesta(respuesta);
}

export async function crearProducto(producto) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  return procesarRespuesta(respuesta);
}

export async function actualizarProducto(id, producto) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(producto),
  });

  return procesarRespuesta(respuesta);
}

export async function eliminarProducto(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return procesarRespuesta(respuesta);
}

export async function cambiarDisponibilidadProducto(id) {
  const respuesta = await fetch(`${API_URL}/${id}/disponibilidad`, {
    method: "PATCH",
  });

  return procesarRespuesta(respuesta);
}