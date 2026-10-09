import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Caseta.module.css';

const API_BASE_URL = 'http://localhost:4000/api';

const COLOR_ROL = {
    administrador: { bg: '#0b192c', btn: '#1e3a8a', accent: '#3b82f6' },
    coordinador: { bg: '#064e3b', btn: '#047857', accent: '#10b981' },
    operador: { bg: '#7c2d12', btn: '#c2410c', accent: '#f97316' },
};

export default function Caseta() {
    const router = useRouter();
    const [rolUsuario, setRolUsuario] = useState('coordinador');
    const [codigoInput, setCodigoInput] = useState('');
    const [cargando, setCargando] = useState(false);
    const [modalInfo, setModalInfo] = useState(null);

    // Obtener el rol desde el token JWT
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.rol) {
                    setRolUsuario(payload.rol.toLowerCase());
                }
            } catch (err) {
                console.error('Error al decodificar token:', err);
            }
        }
    }, []);

    const colores = COLOR_ROL[rolUsuario] || COLOR_ROL.coordinador;

    // Manejo del registro de llegada
    const handleRegistrarLlegada = async (e) => {
        e.preventDefault();
        if (!codigoInput.trim()) return;

        setCargando(true);
        try {
            let targetId = codigoInput.trim();

            // Si no es un ObjectId de 24 caracteres, buscamos el pedido por su código
            const esObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);
            if (!esObjectId) {
                // CORREGIDO: Apunta a http://localhost:4000/api/pedidos
                const resList = await fetch(`${API_BASE_URL}/pedidos`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (resList.ok) {
                    const pedidos = await resList.json();
                    const encontrado = pedidos.find(
                        (p) =>
                            p.codigo === targetId ||
                            p.numeroPedido === targetId ||
                            p._id === targetId
                    );

                    if (encontrado) {
                        targetId = encontrado._id;
                    } else {
                        alert('No se encontró ningún pedido con ese código.');
                        setCargando(false);
                        return;
                    }
                } else {
                    throw new Error('Error al consultar lista de pedidos');
                }
            }

            // CORREGIDO: Apunta a http://localhost:4000/api/pedidos/:id/llegada
            const res = await fetch(`${API_BASE_URL}/pedidos/${targetId}/llegada`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ fechaLlegada: new Date().toISOString() }),
            });

            const data = await res.json();

            if (res.ok) {
                setModalInfo(data);
                setCodigoInput('');
            } else {
                alert(data.mensaje || data.message || 'Error al registrar la llegada.');
            }
        } catch (error) {
            console.error('Error al registrar llegada:', error);
            alert('Ocurrió un error al conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className={styles.container} style={{ backgroundColor: colores.bg }}>
            <header className={styles.header}>
                <h1>Recepción de Arribos - Caseta</h1>
                <div className={styles.navLinks}>
                    <Link href="/casetas-registradas" className={styles.linkButton}>
                        Ver Arribos Registrados
                    </Link>
                    <Link href="/dashboard" className={styles.linkButton}>
                        Volver al Dashboard
                    </Link>
                </div>
            </header>

            <main className={styles.main}>
                <section className={styles.card}>
                    <h2>Registrar Entrada de Pedido</h2>
                    <form onSubmit={handleRegistrarLlegada} className={styles.form}>
                        <div className={styles.field}>
                            <label htmlFor="codigo">Código o Número de Pedido:</label>
                            <input
                                id="codigo"
                                type="text"
                                value={codigoInput}
                                onChange={(e) => setCodigoInput(e.target.value)}
                                placeholder="Ej. PED-1002 o ID..."
                                disabled={cargando}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            style={{ backgroundColor: colores.btn }}
                            disabled={cargando || !codigoInput.trim()}
                        >
                            {cargando ? 'Registrando...' : 'Confirmar Llegada'}
                        </button>
                    </form>
                </section>
            </main>

            {/* Modal de resultado tras el registro */}
            {modalInfo && (
                <div className={styles.modalOverlay} onClick={() => setModalInfo(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>¡Arribo Registrado!</h3>
                        <p><strong>Pedido:</strong> {modalInfo.codigo || modalInfo.numeroPedido || modalInfo._id}</p>
                        <p><strong>Estatus de Puntualidad:</strong> {modalInfo.estatusPuntualidad || modalInfo.estado}</p>
                        <p><strong>Hora de Llegada:</strong> {new Date().toLocaleTimeString()}</p>

                        <button
                            className={styles.closeBtn}
                            style={{ backgroundColor: colores.btn }}
                            onClick={() => setModalInfo(null)}
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}