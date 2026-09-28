import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Caseta.module.css';

/* Componente para el registro de llegadas en la caseta con modal emergente */
export default function Caseta() {
    const router = useRouter();
    const [numeroPedido, setNumeroPedido] = useState('');
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);

    const handleRegistrarLlegada = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No has iniciado sesión o la sesión ha expirado.');
            }

            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const inputLimpio = numeroPedido.trim();

            let idParaEnvio = inputLimpio;

            // Si no parece un ObjectId de 24 caracteres hex, consultamos los pedidos
            if (!/^[0-9a-fA-F]{24}$/.test(inputLimpio)) {
                const resPedidos = await fetch(`${BACKEND_URL}/api/pedidos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resPedidos.ok) {
                    const pedidos = await resPedidos.json();
                    const pedidoEncontrado = pedidos.find(p =>
                        (p.numeroPedido && p.numeroPedido.toLowerCase() === inputLimpio.toLowerCase()) ||
                        (p.codigo && p.codigo.toLowerCase() === inputLimpio.toLowerCase())
                    );

                    if (pedidoEncontrado) {
                        idParaEnvio = pedidoEncontrado._id || pedidoEncontrado.id;
                    } else {
                        throw new Error(`No se encontró ningún pedido registrado con el número "${inputLimpio}".`);
                    }
                }
            }

            /* 2. Enviar el registro de llegada */
            const res = await fetch(`${BACKEND_URL}/api/pedidos/${idParaEnvio}/llegada`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    horaRealLlegada: new Date().toISOString()
                })
            });

            const textResponse = await res.text();
            let data;

            try {
                data = JSON.parse(textResponse);
            } catch (jsonErr) {
                throw new Error(`Error ${res.status}: Respuesta no válida del servidor.`);
            }

            if (!res.ok) {
                throw new Error(data.mensaje || data.error || 'Error al registrar la llegada');
            }

            setResultado(data);
            setMostrarModal(true);
            setNumeroPedido(''); /* Limpia el campo */
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.topNav}>
                <Link href="/dashboard" className={styles.backBtn}>
                    Volver al Dashboard
                </Link>
            </div>

            <div className={styles.casetaContainer}>
                <header className={styles.header}>
                    <h2>Recepción en Caseta</h2>
                    <p>Control de Arribos</p>
                </header>

                <form onSubmit={handleRegistrarLlegada} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="pedido">Número de Pedido</label>
                        <input
                            id="pedido"
                            type="text"
                            placeholder="Ej. PED-12345"
                            value={numeroPedido}
                            onChange={(e) => setNumeroPedido(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar Arribo'}
                    </button>
                </form>

                {error && <div className={styles.errorCard}>{error}</div>}
            </div>

            {/* Modal emergente de confirmación */}
            {mostrarModal && resultado && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        color: '#1e293b'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>
                            ¡Arribo Registrado!
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>
                            La confirmación de recepción ha sido procesada con éxito.
                        </p>

                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'left',
                            marginBottom: '24px'
                        }}>
                            <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                                <strong>Pedido:</strong> {resultado.numeroPedido || numeroPedido || resultado._id}
                            </p>
                            <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                                <strong>Estado:</strong>{' '}
                                <span style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}>
                                    {resultado.clasificacion || resultado.estado || 'REGISTRADO'}
                                </span>
                            </p>
                            {resultado.horaRealLlegada && (
                                <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                                    <strong>Hora Real:</strong> {new Date(resultado.horaRealLlegada).toLocaleTimeString()}
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                            <button
                                onClick={() => router.push('/dashboard')}
                                style={{
                                    backgroundColor: '#047857',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Volver al Dashboard
                            </button>

                            <button
                                onClick={() => setMostrarModal(false)}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Registrar otro pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}