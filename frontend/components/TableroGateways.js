import { useState, useEffect } from 'react';
import {
    obtenerGateways,
    obtenerDescargasActivas,
    actualizarGateway,
    finalizarDescarga,
} from '../lib/api';
import ModalIniciarDescarga from './ModalIniciarDescarga';
import styles from '../styles/gateways.module.css';

/* Componente principal para el monitoreo y gestión de Gateways de descarga. */
export default function TableroGateways({ pedidosEnCola = [], onActualizarDatos, esAdmin = false }) {
    const [gateways, setGateways] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [gatewaySeleccionado, setGatewaySeleccionado] = useState(null);
    const [descargaProcesando, setDescargaProcesando] = useState('');

    /* Carga los datos de los gateways desde la API y actualiza el estado del componente. */
    const cargarGateways = async () => {
        setCargando(true);
        try {
            const [respuestaGateways, respuestaDescargas] = await Promise.all([
                obtenerGateways(),
                obtenerDescargasActivas(),
            ]);
            const listaGateways = Array.isArray(respuestaGateways)
                ? respuestaGateways
                : (respuestaGateways.data || respuestaGateways.gateways || []);
            const listaDescargas = Array.isArray(respuestaDescargas) ? respuestaDescargas : [];
            setGateways(listaGateways.map((gateway) => ({
                ...gateway,
                descargaActiva: listaDescargas.find((descarga) => {
                    const gatewayDescargaId = descarga.gatewayId?._id || descarga.gatewayId;
                    return String(gatewayDescargaId) === String(gateway._id);
                }) || null,
            })));
            setErrorMsg('');
        } catch (error) {
            console.error('Error al cargar gateways:', error);
            setErrorMsg(error.message || 'Error al cargar gateways');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarGateways();
    }, []);

    /* Cambia el estado de un gateway (activo/inactivo) y recarga los datos. */
    const cambiarEstado = async (gateway, nuevoEstado) => {
        try {
            await actualizarGateway(gateway._id, {
                numeroGateway: gateway.numeroGateway,
                tipoCargaPermitida: gateway.tipoCargaPermitida,
                estado: nuevoEstado,
            });
            await cargarGateways();
            if (onActualizarDatos) onActualizarDatos();
        } catch (err) {
            setErrorMsg(err.message || 'No fue posible actualizar el gateway.');
        }
    };

    /* Finaliza la descarga activa de un gateway y recarga los datos. */
    const manejarFinalizar = async (descargasId) => {
        if (!descargasId || descargaProcesando) return;
        setDescargaProcesando(descargasId);
        setErrorMsg('');
        try {
            await finalizarDescarga(descargasId);
            await cargarGateways();
            if (onActualizarDatos) await onActualizarDatos();
        } catch (err) {
            setErrorMsg(err.message || 'No fue posible finalizar la descarga.');
        } finally {
            setDescargaProcesando('');
        }
    };

    if (cargando) return <div className={styles.loading}>Cargando monitoreo de gateways...</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.titulo}>Monitoreo de Gateways de Descarga</h2>
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.grid}>
                {gateways.map((gw) => {
                    const descargaActiva = gw.descargaActiva;
                    const pedidoActivo = descargaActiva?.pedidoId;
                    const esLibre = gw.estado === 'LIBRE';
                    const esOcupado = gw.estado === 'OCUPADO';
                    const esFueraServicio = gw.estado === 'FUERA DE SERVICIO';

                    let colorClass = styles.tarjetaLibre;
                    if (esOcupado) colorClass = styles.tarjetaOcupado;
                    if (esFueraServicio) colorClass = styles.tarjetaFueraServicio;

                    return (
                        <div key={gw._id || gw.numeroGateway} className={`${styles.card} ${colorClass}`}>
                            <div className={styles.cardHeader}>
                                <h3>Gateway {gw.numeroGateway}</h3>
                                <span className={styles.badgeEstado}>{gw.estado}</span>
                            </div>

                            <div className={styles.cardBody}>
                                <p>
                                    <strong>Carga Permitida:</strong>{' '}
                                    <br />
                                    {gw.tipoCargaPermitida ? gw.tipoCargaPermitida.toUpperCase() : 'GENERAL'}
                                </p>
                                {esOcupado && descargaActiva && (
                                    <div className={styles.infoDescarga}>
                                        <p><strong>Pedido:</strong> {pedidoActivo?.numeroPedido || 'Descarga activa'}</p>
                                        <p><strong>Inicio:</strong> {new Date(descargaActiva.fechaHoraInicio).toLocaleString('es-SV')}</p>
                                    </div>
                                )}
                                {esOcupado && !descargaActiva && (
                                    <p className={styles.avisoDescarga}>No se encontró la descarga activa de este gateway.</p>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                {esLibre && (
                                    <button
                                        type="button"
                                        className={styles.btnIniciar}
                                        onClick={() => setGatewaySeleccionado(gw)}
                                    >
                                        ▶ Iniciar Descarga
                                    </button>
                                )}

                                {esOcupado && descargaActiva && (
                                    <button
                                        type="button"
                                        className={styles.btnFinalizar}
                                        onClick={() => manejarFinalizar(descargaActiva._id)}
                                        disabled={descargaProcesando === descargaActiva._id}
                                    >
                                        {descargaProcesando === descargaActiva._id ? 'Finalizando…' : '✓ Finalizar descarga'}
                                    </button>
                                )}

                                {esLibre && esAdmin && (
                                    <button
                                        type="button"
                                        className={styles.btnMantenimiento}
                                        onClick={() => cambiarEstado(gw, 'FUERA DE SERVICIO')}
                                    >
                                        Fuera de Servicio
                                    </button>
                                )}

                                {esFueraServicio && esAdmin && (
                                    <button
                                        type="button"
                                        className={styles.btnHabilitar}
                                        onClick={() => cambiarEstado(gw, 'LIBRE')}
                                    >
                                        Habilitar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {gatewaySeleccionado && (
                <ModalIniciarDescarga
                    gateway={gatewaySeleccionado}
                    pedidos={pedidosEnCola}
                    onClose={() => setGatewaySeleccionado(null)}
                    onExito={() => {
                        setGatewaySeleccionado(null);
                        cargarGateways(); // CORREGIDO: antes decía cargarDatosGateways
                        if (onActualizarDatos) onActualizarDatos();
                    }}
                />
            )}
        </div>
    );
}