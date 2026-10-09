const obtenerFechaCreacion = (pedido) => {
    const fechaCreacion = Date.parse(pedido.createdAt);
    if (!Number.isNaN(fechaCreacion)) return fechaCreacion;

    const id = pedido._id || pedido.id;
    return typeof id === 'string' && /^[\da-f]{24}$/i.test(id)
        ? Number.parseInt(id.slice(0, 8), 16) * 1000
        : 0;
};

export const obtenerUltimosPedidos = (pedidos, limite = 3) => [...(pedidos || [])]
    .sort((a, b) => obtenerFechaCreacion(b) - obtenerFechaCreacion(a))
    .slice(0, limite);
