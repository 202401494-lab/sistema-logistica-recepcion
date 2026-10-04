import { useState } from 'react';
import { createPortal } from 'react-dom';
import { iniciarDescarga } from '../lib/api';
import styles from '../styles/modal.module.css';

/* Modal para iniciar la descarga de un pedido a través de un gateway. */
export default function ModalIniciarDescarga({ gateway, pedidos, onClose, onExito }) {
    const [pedidoId, setPedidoId] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    /* Filtrar pedidos cuya categoría coincida exactamente con la permitida por el Gateway */
    const pedidosElegibles = pedidos.filter(
        (p) => p.tipoProducto === gateway.tipoCargaPermitida
    );

    /* Maneja el envío del formulario para iniciar la descarga. */
    const manejarEnvio = async (e) => {
        e.preventDefault();
        if (!pedidoId) return setError('Selecciona un pedido');

        setCargando(true);
        setError('');
        try {
            await iniciarDescarga(pedidoId, gateway._id);
            onExito();
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>Asignar Pedido a Gateway {gateway.numeroGateway}</h3>
                <p><strong>Carga Permitida:</strong> {gateway.tipoCargaPermitida}</p>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={manejarEnvio}>
                    <label>Pedidos compatibles en espera:</label>
                    <select value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} required>
                        <option value="">-- Selecciona un pedido --</option>
                        {pedidosElegibles.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.numeroPedido} - {p.proveedorId?.nombreEmpresa || 'Proveedor'} ({p.tipoProducto})
                            </option>
                        ))}
                    </select>

                    {pedidosElegibles.length === 0 && (
                        <p className={styles.warning}>No hay pedidos disponibles con carga de tipo "{gateway.tipoCargaPermitida}".</p>
                    )}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} disabled={cargando}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando || pedidosElegibles.length === 0}>
                            {cargando ? 'Procesando...' : 'Confirmar Inicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}