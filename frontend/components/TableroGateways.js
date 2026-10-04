import { useState, useEffect } from 'react';
import { obtenerGateways, actualizarGateway, finalizarDescarga } from '../lib/api';
import ModalIniciarDescarga from './ModalIniciarDescarga';
import styles from '../styles/gateways.module.css';

/* Componente principal para el monitoreo y gestión de Gateways de descarga. */
export default function TableroGateways({ pedidosEnCola = [], onActualizarDatos, esAdmin = false }) {
    const [gateways, setGateways] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [gatewaySeleccionado, setGatewaySeleccionado] = useState(null);

    /* Carga los datos de los gateways desde la API y actualiza el estado del componente. */
    const cargarGateways = async () => {
        setCargando(true);
        try {
            const respuesta = await obtenerGateways();

            console.log('Respuesta de gateways desde la API:', respuesta);

            // Extrae el arreglo correctamente sin importar la envoltura
            const lista = Array.isArray(respuesta)
                ? respuesta
                : (respuesta.data || respuesta.gateways || []);

            setGateways(lista);
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
            alert(err.message);
        }
    };

    /* Finaliza la descarga activa de un gateway y recarga los datos. */
    const manejarFinalizar = async (descargasId) => {
        try {
            await finalizarDescarga(descargasId);
            await cargarGateways(); // CORREGIDO: antes decía cargarDatosGateways
            if (onActualizarDatos) onActualizarDatos();
        } catch (err) {
            alert(err.message);
        }
    };

    if (cargando) return <div className={styles.loading}>Cargando monitoreo de gateways...</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.titulo}>Monitoreo de Gateways de Descarga</h2>
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.grid}>
                {gateways.map((gw) => {
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
                                {esOcupado && gw.descargaActiva && (
                                    <div className={styles.infoDescarga}>
                                        <p><strong>Pedido:</strong> {gw.descargaActiva.numeroPedido}</p>
                                    </div>
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

                                {esOcupado && gw.descargaActiva && (
                                    <button
                                        type="button"
                                        className={styles.btnFinalizar}
                                        onClick={() => manejarFinalizar(gw.descargaActiva._id)}
                                    >
                                        ✓ Finalizar Descarga
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

                                {esFueraServicio && (
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