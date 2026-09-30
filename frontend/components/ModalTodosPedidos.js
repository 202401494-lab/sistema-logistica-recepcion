import styles from '../styles/modal.module.css';
import { obtenerNombreProveedor, obtenerFechaFormateada } from '../lib/formatters';

export default function ModalTodosPedidos({ pedidos, onClose, proveedores }) {
    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div>
                        <h3>Todos los pedidos programados</h3>
                        <p>Total de registros: {pedidos.length}</p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.list}>
                        {pedidos.map((pedido) => (
                            <div key={pedido.id || pedido._id} className={styles.card}>
                                <div>
                                    <strong className={styles.cardTitle}>
                                        Pedido #{pedido.numeroPedido || pedido.codigo || pedido._id}
                                    </strong>
                                    <div className={styles.cardSub}>
                                        <span>{obtenerNombreProveedor(pedido, proveedores)}</span>
                                    </div>
                                    <div className={styles.cardDate}>
                                        {obtenerFechaFormateada(pedido)}
                                    </div>
                                </div>

                                <span className={styles.badge}>
                                    {pedido.estado || 'PROGRAMADO'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}