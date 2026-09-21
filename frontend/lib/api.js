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