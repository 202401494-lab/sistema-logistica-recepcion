import { useState } from 'react';
import { cancelarPedido, reprogramarPedido } from '../lib/api';
import styles from '../styles/pedidoList.module.css';

export default function PedidoList({ pedidos = [], proveedores = [], cargando, onActualizar }) {
    const [pedidoAEditar, setPedidoAEditar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    // Paginación: Mostrar los primeros 5 pedidos por página
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 5;

    // Formulario para modal de edición
    const [formEditar, setFormEditar] = useState({
        numeroPedido: '',
        proveedorId: '',
        tipoProducto: 'general',
        fechaHoraProgramada: '',
        inicioVentana: '',
        finVentana: '',
        duracionEstimadaMinutos: 60,
        estado: 'PROGRAMADO'
    });

    // Cálculos de paginación
    const totalPaginas = Math.ceil(pedidos.length / elementosPorPagina) || 1;
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const pedidosPaginados = pedidos.slice(indiceInicio, indiceInicio + elementosPorPagina);

    const irAPaginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const irAPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    // Extraer nombre del proveedor
    const obtenerNombreProveedor = (pedido) => {
        if (pedido.proveedorId && typeof pedido.proveedorId === 'object') {
            return pedido.proveedorId.razonSocial || pedido.proveedorId.nombre || 'Sin proveedor';
        }
        if (typeof pedido.proveedorId === 'string') {
            const encontrado = proveedores.find((p) => (p._id || p.id) === pedido.proveedorId);
            if (encontrado) return encontrado.razonSocial || encontrado.nombre;
        }
        return pedido.proveedorNombre || 'Sin proveedor';
    };

    // Formatear la fecha
    const formatearFecha = (fechaRaw) => {
        if (!fechaRaw) return 'Sin fecha';
        try {
            const d = new Date(fechaRaw);
            if (isNaN(d.getTime())) return String(fechaRaw);

            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const anio = d.getFullYear();
            const hora = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');

            return `${dia}/${mes}/${anio} ${hora}:${min}`;
        } catch {
            return String(fechaRaw);
        }
    };

    const abrirEdicion = (pedido) => {
        setPedidoAEditar(pedido);

        const fProg = pedido.fechaHoraProgramada ? new Date(pedido.fechaHoraProgramada).toISOString().slice(0, 16) : '';
        const fIni = pedido.inicioVentana ? new Date(pedido.inicioVentana).toISOString().slice(0, 16) : '';
        const fFin = pedido.finVentana ? new Date(pedido.finVentana).toISOString().slice(0, 16) : '';

        setFormEditar({
            numeroPedido: pedido.numeroPedido || '',
            proveedorId: typeof pedido.proveedorId === 'object' ? (pedido.proveedorId._id || pedido.proveedorId.id) : (pedido.proveedorId || ''),
            tipoProducto: pedido.tipoProducto || 'general',
            fechaHoraProgramada: fProg,
            inicioVentana: fIni,
            finVentana: fFin,
            duracionEstimadaMinutos: pedido.duracionEstimadaMinutos || 60,
            estado: pedido.estado || 'PROGRAMADO'
        });
    };

    const manejarCancelar = async (id, numero) => {
        if (!window.confirm(`¿Estás segura de que deseas cancelar el pedido ${numero || ''}?`)) return;

        setProcesando(true);
        try {
            await cancelarPedido(id);
            if (onActualizar) await onActualizar();
        } catch (error) {
            alert(error.message || 'Error al cancelar el pedido');
        } finally {
            setProcesando(false);
        }
    };

    const manejarGuardarEdicion = async (e) => {
        e.preventDefault();
        setProcesando(true);
        try {
            const id = pedidoAEditar._id || pedidoAEditar.id;
            await reprogramarPedido(id, formEditar);
            setPedidoAEditar(null);
            if (onActualizar) await onActualizar();
        } catch (error) {
            alert(error.message || 'Error al guardar los cambios');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className={styles.card}>
            {/* Encabezado */}
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>AGENDA LOGÍSTICA</span>
                    <h2 className={styles.title}>Pedidos programados</h2>
                </div>

                {/* Indicador superior de total de pedidos */}
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '12px' }}>
                    Total: {pedidos.length} pedidos
                </span>
            </div>

            {/* Lista de Pedidos (Máximo 5 por página) */}
            <div className={styles.list}>
                {pedidosPaginados.length === 0 ? (
                    <p className={styles.empty}>No hay pedidos registrados.</p>
                ) : (
                    pedidosPaginados.map((pedido) => {
                        const id = pedido._id || pedido.id;
                        const numeroMostrado = pedido.numeroPedido ? `#${pedido.numeroPedido}` : `PED-${id.slice(-4)}`;
                        const proveedorTexto = obtenerNombreProveedor(pedido);
                        const fechaTexto = formatearFecha(pedido.fechaHoraProgramada || pedido.inicioVentana);
                        const tipoTexto = pedido.tipoProducto || 'General';
                        const estadoTexto = pedido.estado || 'PROGRAMADO';

                        return (
                            <div key={id} className={styles.itemCard}>
                                <div className={styles.itemMain}>
                                    <div>
                                        <h3 className={styles.codigo}>{numeroMostrado}</h3>
                                        <p className={styles.proveedor}>{proveedorTexto}</p>
                                    </div>

                                    <div className={styles.itemMeta}>
                                        <span className={styles.area}>{tipoTexto}</span>
                                        <span className={styles.fecha}>{fechaTexto}</span>
                                        <span className={styles.badgeState}>{estadoTexto}</span>

                                        <div className={styles.actions}>
                                            <button
                                                type="button"
                                                className={styles.btnIcon}
                                                onClick={() => abrirEdicion(pedido)}
                                                title="Editar pedido"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.btnIcon} ${styles.btnDelete}`}
                                                onClick={() => manejarCancelar(id, pedido.numeroPedido)}
                                                title="Cancelar pedido"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Controles de Paginación ABAJO de los pedidos */}
            {pedidos.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={irAPaginaAnterior}
                            disabled={paginaActual === 1}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: paginaActual === 1 ? '#f9fafb' : '#ffffff',
                                color: paginaActual === 1 ? '#9ca3af' : '#374151',
                                cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            ← Anterior
                        </button>
                        <button
                            type="button"
                            onClick={irAPaginaSiguiente}
                            disabled={paginaActual === totalPaginas}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: paginaActual === totalPaginas ? '#f9fafb' : '#ffffff',
                                color: paginaActual === totalPaginas ? '#9ca3af' : '#374151',
                                cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
            {pedidoAEditar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Reprogramar / Editar Pedido</h3>
                        <form onSubmit={manejarGuardarEdicion} className={styles.formModal}>
                            <label>
                                Número de Pedido:
                                <input
                                    type="text"
                                    value={formEditar.numeroPedido}
                                    disabled
                                />
                            </label>

                            <label>
                                Fecha y Hora Programada:
                                <input
                                    type="datetime-local"
                                    value={formEditar.fechaHoraProgramada}
                                    onChange={(e) => setFormEditar({ ...formEditar, fechaHoraProgramada: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Inicio Ventana:
                                <input
                                    type="datetime-local"
                                    value={formEditar.inicioVentana}
                                    onChange={(e) => setFormEditar({ ...formEditar, inicioVentana: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Fin Ventana:
                                <input
                                    type="datetime-local"
                                    value={formEditar.finVentana}
                                    onChange={(e) => setFormEditar({ ...formEditar, finVentana: e.target.value })}
                                    required
                                />
                            </label>

                            <div className={styles.modalButtons}>
                                <button
                                    type="button"
                                    onClick={() => setPedidoAEditar(null)}
                                    className={styles.btnCancel}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={procesando}
                                    className={styles.btnSave}
                                >
                                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}