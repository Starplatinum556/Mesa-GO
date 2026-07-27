import { apiFetch } from "../api";

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || "Ocurrió un error al procesar la solicitud."
    );
  }

  return datos;
}

// MG-64: obtiene la mesa y el menú disponible mediante el código QR.
export async function obtenerMenuPorCodigoQr(codigoQr) {
  const respuesta = await apiFetch(`/api/menu/${codigoQr}`);
  return procesarRespuesta(respuesta);
}

// MG-52: crea una sesión temporal o recupera una sesión activa.
export async function crearORecuperarSesionCliente(
  codigoQr,
  tokenExistente = null
) {
  const respuesta = await apiFetch("/api/sesiones-cliente", {
    method: "POST",
    body: JSON.stringify({
      codigoQr,
      tokenExistente,
    }),
  });

  return procesarRespuesta(respuesta);
}

// MG-57: crea o actualiza el pedido temporal usando el carrito.
export async function guardarPedidoTemporal({
  tokenSesion,
  productos,
  observaciones = "",
}) {
  const respuesta = await apiFetch("/api/pedidos-temporales", {
    method: "POST",
    body: JSON.stringify({
      tokenSesion,
      productos,
      observaciones,
    }),
  });

  return procesarRespuesta(respuesta);
}

// MG-62/MG-60: confirma el pago del pedido temporal
// y lo envía automáticamente al módulo de cocina.
export async function confirmarPagoPedido({
  pedidoId,
  tokenSesion,
  metodoPago,
  comprobante = null,
}) {
  const respuesta = await apiFetch(
    `/api/pedidos/${pedidoId}/confirmar-pago`,
    {
      method: "PATCH",
      body: JSON.stringify({
        tokenSesion,
        metodoPago,
        comprobante,
      }),
    }
  );

  return procesarRespuesta(respuesta);
}