import styles from '../styles/dashboard.module.css';

/* Función para formatear la fecha y hora en formato corto para la visualización */
const formatearFecha = (fecha) => (
    new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(fecha))
);

/* Componente de lista de pedidos programados */
export default function PedidoList({
    pedidos,
    cargando,
    onActualizar,
}) {
    return (
        <section className={styles.ordersCard}>
            <div className={styles.sectionHeading}>
                <div>
                    <span className={styles.cardLabel}>Agenda logística</span>
                    <h2>Pedidos programados</h2>
                </div>

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onActualizar}
                    disabled={cargando}
                >
                    {cargando ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            {pedidos.length === 0 ? (
                <div className={styles.emptyState}>
                    <span>🗂️</span>
                    <p>No hay pedidos programados todavía.</p>
                </div>
            ) : (
                <div className={styles.ordersList}>
                    {pedidos.map((pedido) => (
                        <article
                            className={styles.orderItem}
                            key={pedido._id || pedido.numeroPedido}
                        >
                            <div>
                                <strong>{pedido.numeroPedido}</strong>
                                <span>
                                    {pedido.proveedorId?.razonSocial
                                        || 'Proveedor registrado'}
                                </span>
                            </div>

                            <div className={styles.orderDetails}>
                                <span>{pedido.tipoProducto}</span>
                                <span>{formatearFecha(pedido.inicioVentana)}</span>
                                <span className={styles.statusBadge}>
                                    {pedido.estado}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}