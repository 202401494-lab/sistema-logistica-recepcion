const API_BASE_URL = 'http://localhost:4000/api';

/* Función para obtener el token de autenticación del almacenamiento local */
const obtenerToken = () => {
    if (typeof window === 'undefined') return '';

    /* Intenta obtener el token desde diferentes claves en el almacenamiento local */
    return (
        localStorage.getItem('token')
        || localStorage.getItem('accessToken')
        || ''
    );
};

/* Función para obtener los encabezados con el token de autenticación */
const obtenerHeaders = () => {
    const token = obtenerToken();

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/* Función para procesar la respuesta del servidor */
const procesarRespuesta = async (respuesta) => {
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        const error = new Error(
            datos.mensaje || 'Ocurrió un error en la solicitud',
        );

        error.alternativas = datos.alternativas || [];
        throw error;
    }

    return datos;
};

/* Función para registrar un nuevo proveedor */
export const registrarProveedor = async (datos) => {
    const respuesta = await fetch(`${API_BASE_URL}/proveedores`, {
        method: 'POST',
        headers: obtenerHeaders(),
        body: JSON.stringify(datos),
    });

    return procesarRespuesta(respuesta);
};

/* Recupera los proveedores guardados para que puedan seleccionarse después de recargar. */
export const obtenerProveedores = async () => {
    const respuesta = await fetch(`${API_BASE_URL}/proveedores`, {
        method: 'GET',
        headers: obtenerHeaders(),
    });

    return procesarRespuesta(respuesta);
};

/* Actualiza los datos de contacto y generales de un proveedor activo. */
export const actualizarProveedor = async (id, datos) => {
    const respuesta = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
        method: 'PUT',
        headers: obtenerHeaders(),
        body: JSON.stringify(datos),
    });

    return procesarRespuesta(respuesta);
};

/* Inactiva lógicamente un proveedor. */
export const inactivarProveedor = async (id) => {
    const respuesta = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
        method: 'DELETE',
        headers: obtenerHeaders(),
    });

    return procesarRespuesta(respuesta);
};

/* Función para crear un pedido */
export const crearPedido = async (datos) => {
    const respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
        method: 'POST',
        headers: obtenerHeaders(),
        body: JSON.stringify(datos),
    });

    return procesarRespuesta(respuesta);
};

/* Función para obtener la lista de pedidos */
export const obtenerPedidos = async () => {
    const respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
        method: 'GET',
        headers: obtenerHeaders(),
    });

    return procesarRespuesta(respuesta);
};

/* Reprograma la ventana y la cita de un pedido. */
export const reprogramarPedido = async (id, datos) => {
    const respuesta = await fetch(`${API_BASE_URL}/pedidos/${id}/reprogramar`, {
        method: 'PATCH',
        headers: obtenerHeaders(),
        body: JSON.stringify(datos),
    });

    return procesarRespuesta(respuesta);
};

/* Cancela un pedido mediante soft delete. */
export const cancelarPedido = async (id) => {
    const respuesta = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
        method: 'DELETE',
        headers: obtenerHeaders(),
    });

    return procesarRespuesta(respuesta);
};

/* Gateways */
export async function obtenerGateways() {
    const res = await fetch(`${API_BASE_URL}/gateways`, {
        method: 'GET',
        headers: obtenerHeaders(),
    });
    return procesarRespuesta(res);
}

/* Cambia el estado de un gateway (activo/inactivo) */
export async function actualizarGateway(id, datosGateway) {
    const res = await fetch(`${API_BASE_URL}/gateways/${id}`, {
        method: 'PUT',
        headers: obtenerHeaders(),
        body: JSON.stringify(datosGateway),
    });
    return procesarRespuesta(res);
}

/* Transacciones de Descarga */
export async function iniciarDescarga(pedidoId, gatewayId) {
    const res = await fetch(`${API_BASE_URL}/descargas/iniciar`, {
        method: 'POST',
        headers: obtenerHeaders(),
        body: JSON.stringify({ pedidoId, gatewayId }),
    });
    return procesarRespuesta(res);
}

/* Finaliza una descarga y actualiza su estado en el servidor */
export async function finalizarDescarga(descargasId) {
    const res = await fetch(`${API_BASE_URL}/descargas/finalizar`, {
        method: 'POST',
        headers: obtenerHeaders(),
        body: JSON.stringify({ descargasId }),
    });
    return procesarRespuesta(res);
}

export async function obtenerDescargasActivas() {
    const res = await fetch(`${API_BASE_URL}/descargas/activas`, {
        method: 'GET',
        headers: obtenerHeaders(),
    });
    return procesarRespuesta(res);
}

export async function obtenerKpis(desde, hasta) {
    const parametros = new URLSearchParams();
    if (desde) {
        const inicioLocal = new Date(`${desde}T00:00:00`);
        parametros.set('desde', inicioLocal.toISOString());
    }
    if (hasta) {
        const finExclusivo = new Date(`${hasta}T00:00:00`);
        finExclusivo.setDate(finExclusivo.getDate() + 1);
        const ahora = new Date();
        parametros.set('hasta', (finExclusivo > ahora ? ahora : finExclusivo).toISOString());
    }
    const query = parametros.toString();
    const res = await fetch(`${API_BASE_URL}/kpis${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: obtenerHeaders(),
    });
    return procesarRespuesta(res);
}