import { useState, useEffect } from 'react';
import Link from 'next/link';

const COLOR_ROL = {
    administrador: { bg: '#0b192c', accent: '#3b82f6' },
    coordinador: { bg: '#064e3b', accent: '#10b981' },
    operador: { bg: '#7c2d12', accent: '#f97316' }
};

export default function CasetasRegistradas() {
    const [rolUsuario, setRolUsuario] = useState('coordinador');
    const [historialArribos, setHistorialArribos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payloadBase64 = token.split('.')[1];
                const decodedJson = atob(payloadBase64);
                const decoded = JSON.parse(decodedJson);
                if (decoded && decoded.rol) {
                    setRolUsuario(decoded.rol.toLowerCase());
                }
            } catch (e) {
                console.error("Error al decodificar token", e);
            }
        }
        cargarArribos();
    }, []);

    const cargarArribos = async () => {
        try {
            setCargando(true);
            const token = localStorage.getItem('token');
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            const res = await fetch(`${BACKEND_URL}/api/pedidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const pedidos = await res.json();
                const recibidos = pedidos.filter(p => p.horaRealLlegada || p.fechaHoraLlegadaReal || p.estado === 'RECIBIDO' || p.estado === 'COMPLETADO');
                setHistorialArribos(recibidos);
            }
        } catch (err) {
            console.error("Error al cargar arribos:", err);
        } finally {
            setCargando(false);
        }
    };

    const obtenerEstiloPuntualidad = (estado) => {
        const estadoNormalizado = (estado || '').toLowerCase();
        if (estadoNormalizado.includes('tiempo') || estadoNormalizado.includes('programado')) {
            return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
        }
        if (estadoNormalizado.includes('anticipado')) {
            return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
        }
        if (estadoNormalizado.includes('tard') || estadoNormalizado.includes('atraso')) {
            return { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde047' };
        }
        if (estadoNormalizado.includes('ausente') || estadoNormalizado.includes('cancel')) {
            return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
        }
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
    };

    const tema = COLOR_ROL[rolUsuario] || COLOR_ROL.coordinador;

    return (
        <div style={{ backgroundColor: tema.bg, minHeight: '100vh', padding: '20px', transition: 'background 0.3s ease' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto 20px auto' }}>
                <Link href="/dashboard" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
                    ← Volver al Dashboard
                </Link>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>📋 Casetas Registradas</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Historial y control de arribos recibidos en caseta</p>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', backgroundColor: '#f1f5f9', padding: '6px 16px', borderRadius: '20px' }}>
                        Total: {historialArribos.length}
                    </span>
                </div>

                {cargando ? (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>Cargando arribos...</p>
                ) : historialArribos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>No hay arribos registrados en el sistema.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                                    <th style={{ padding: '12px 10px' }}>Pedido</th>
                                    <th style={{ padding: '12px 10px' }}>Proveedor / Cliente</th>
                                    <th style={{ padding: '12px 10px' }}>Hora Arribo</th>
                                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialArribos.map((item, idx) => (
                                    <tr key={item._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 10px', fontWeight: '700', color: '#0f172a' }}>
                                            {item.numeroPedido || item.codigo || item._id}
                                        </td>
                                        <td style={{ padding: '14px 10px', color: '#475569' }}>
                                            {item.proveedor || item.cliente || 'General'}
                                        </td>
                                        <td style={{ padding: '14px 10px', color: '#475569' }}>
                                            {item.horaRealLlegada || item.fechaHoraLlegadaReal ? new Date(item.horaRealLlegada || item.fechaHoraLlegadaReal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recientemente'}
                                        </td>
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '5px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                ...obtenerEstiloPuntualidad(item.estadoPuntualidad || item.clasificacion || item.estado)
                                            }}>
                                                {(item.estadoPuntualidad || item.clasificacion || item.estado || 'RECIBIDO').toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}