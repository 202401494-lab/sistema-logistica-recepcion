import styles from '../styles/resumenCard.module.css';
import { obtenerNombreProveedor, obtenerFechaFormateada } from '../lib/formatters';

export default function ResumenPedidosCard({ pedidos, proveedores, onVerTodos }) {
    return (
        <section className={styles.heroCard}>
            <div style={{ width: '100%' }}>
                <div className={styles.sectionHeading}>
                    <div>
                        <span className={styles.cardLabel}>PANEL GENERAL</span>
                        <h2>Últimos pedidos programados</h2>
                    </div>
                    {pedidos && pedidos.length > 0 && (
                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={onVerTodos}
                        >
                            Ver todos ({pedidos.length})
                        </button>
                    )}
                </div>

                {pedidos && pedidos.length > 0 ? (
                    <div className={styles.ordersList}>
                        {pedidos.slice(0, 3).map((pedido) => (
                            <div key={pedido.id || pedido._id} className={styles.orderItem}>
                                <div>
                                    <strong>Pedido #{pedido.numeroPedido || pedido.codigo || pedido._id}</strong>
                                    <div className={styles.orderMeta}>
                                        <span className={styles.orderVendorName}>
                                            {obtenerNombreProveedor(pedido, proveedores)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.orderDetails}>
                                    <span className={styles.orderDateText}>
                                        {obtenerFechaFormateada(pedido)}
                                    </span>
                                    <span className={styles.statusBadge}>
                                        {pedido.estado || 'PROGRAMADO'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.orderMeta}>
                        No hay actividad reciente. Los pedidos que se agenden aparecerán aquí.
                    </p>
                )}
            </div>
        </section>
    );
}