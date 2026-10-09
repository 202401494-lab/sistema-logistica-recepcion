import { useEffect } from 'react';
import styles from '../styles/ModalTodosPedidos.module.css';
import { obtenerNombreProveedor, obtenerFechaFormateada } from '../lib/formatters';
import { obtenerUltimosPedidos } from '../lib/pedidos';

export default function ModalTodosPedidos({ pedidos, onClose, proveedores }) {
    const pedidosRecientes = obtenerUltimosPedidos(pedidos);

    useEffect(() => {
        const manejarEscape = (event) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', manejarEscape);
        return () => window.removeEventListener('keydown', manejarEscape);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <section
                className={styles.content}
                role="dialog"
                aria-modal="true"
                aria-labelledby="todos-pedidos-titulo"
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>PANEL GENERAL</span>
                        <h2 id="todos-pedidos-titulo">Últimos 3 pedidos agregados</h2>
                        <p>Mostrando {pedidosRecientes.length} de {pedidos.length} pedidos</p>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Cerrar lista de pedidos"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.list}>
                        {pedidosRecientes.map((pedido) => (
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
                        Volver al resumen
                    </button>
                </div>
            </section>
        </div>
    );
}