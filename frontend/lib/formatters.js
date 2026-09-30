// lib/formatters.js

/* Obtiene el nombre del proveedor manejando diferentes formatos de backend */
export const obtenerNombreProveedor = (p, proveedores = []) => {
    if (!p) return 'No especificado';

    // 1. Si viene como objeto poblado por Mongoose { _id, nombre, razonSocial }
    if (typeof p.proveedorId === 'object' && p.proveedorId !== null) {
        return p.proveedorId.nombre || p.proveedorId.razonSocial || p.proveedorId.empresa || 'No especificado';
    }
    if (typeof p.proveedor === 'object' && p.proveedor !== null) {
        return p.proveedor.nombre || p.proveedor.razonSocial || p.proveedor.empresa || 'No especificado';
    }

    // 2. Si viene como texto plano directo en el pedido
    if (typeof p.proveedorNombre === 'string' && p.proveedorNombre.trim()) return p.proveedorNombre;
    if (typeof p.proveedor === 'string' && p.proveedor.trim().length > 0 && !p.proveedor.startsWith('6')) {
        return p.proveedor;
    }

    // 3. Si el ID de MongoDB está guardado en proveedorId, proveedor o id
    const idBuscado = String(p.proveedorId?._id || p.proveedorId || p.proveedor || '');
    if (idBuscado && Array.isArray(proveedores) && proveedores.length > 0) {
        const encontrado = proveedores.find((prov) => String(prov._id || prov.id) === idBuscado);
        if (encontrado) {
            return encontrado.nombre || encontrado.razonSocial || encontrado.nombreEmpresa || encontrado.categoria || 'No especificado';
        }
    }

    // 4. Si el pedido trae una categoría o descripción directa
    if (p.categoria) return p.categoria;
    if (p.descripcion) return p.descripcion;

    return 'No especificado';
};

/* Formatea la fecha y hora de un pedido */
export const obtenerFechaFormateada = (p) => {
    const fechaBase = p.fechaHoraProgramada || p.fecha || p.createdAt;
    if (!fechaBase) return 'Sin fecha';
    try {
        const date = new Date(fechaBase);
        return `${date.toLocaleDateString()} ${p.horario ? '— ' + p.horario : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
        return p.fecha || 'Sin fecha';
    }
};