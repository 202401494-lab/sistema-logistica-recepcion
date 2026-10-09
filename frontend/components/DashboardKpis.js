import { useEffect, useState } from 'react';
import { obtenerKpis } from '../lib/api';
import styles from '../styles/dashboardKpis.module.css';

const fechaLocalInput = (fecha) => {
    const ajustada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return ajustada.toISOString().slice(0, 10);
};

const fechaDeHaceDias = (dias) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fechaLocalInput(fecha);
};

const porcentaje = (valor) => `${Number(valor || 0).toLocaleString('es-SV', { maximumFractionDigits: 1 })}%`;
const minutos = (valor) => (valor === null || valor === undefined
    ? 'Sin datos'
    : `${Number(valor).toLocaleString('es-SV', { maximumFractionDigits: 1 })} min`);

const ESTADOS = [
    { clave: 'A TIEMPO', etiqueta: 'A tiempo', color: 'verde' },
    { clave: 'ANTICIPADO', etiqueta: 'Anticipado', color: 'azul' },
    { clave: 'TARDÍO', etiqueta: 'Tardío', color: 'naranja' },
    { clave: 'AUSENTE', etiqueta: 'Ausente', color: 'rojo' },
];

export default function DashboardKpis() {
    const [desde, setDesde] = useState(() => fechaDeHaceDias(29));
    const [hasta, setHasta] = useState(() => fechaLocalInput(new Date()));
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarDatos = async (evento) => {
        evento?.preventDefault();
        if (!desde || !hasta || desde > hasta) {
            setError('Selecciona un período válido.');
            return;
        }
        setCargando(true);
        setError('');
        try {
            setDatos(await obtenerKpis(desde, hasta));
        } catch (fallo) {
            setError(fallo.message || 'No fue posible cargar los indicadores.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cumplimiento = datos?.nivelCumplimiento || {};

    return (
        <section className={styles.dashboard} aria-labelledby="kpis-title">
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>ANÁLISIS OPERATIVO</span>
                    <h2 id="kpis-title">Indicadores logísticos</h2>
                </div>
                <form className={styles.filtros} onSubmit={cargarDatos}>
                    <label>
                        Desde
                        <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
                    </label>
                    <label>
                        Hasta
                        <input type="date" value={hasta} max={fechaLocalInput(new Date())} onChange={(e) => setHasta(e.target.value)} />
                    </label>
                    <button type="submit" disabled={cargando} aria-label="Actualizar indicadores" title="Actualizar indicadores">
                        {cargando ? <span className={styles.spinner} aria-label="Cargando" /> : '↻'}
                    </button>
                </form>
            </header>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <div className={styles.metricas} aria-live="polite">
                <article className={`${styles.metrica} ${styles.metricaEspera}`}>
                    <span>Espera promedio</span>
                    <strong>{minutos(datos?.tiempoPromedioEsperaMinutos)}</strong>
                    <small>Desde caseta hasta inicio de descarga</small>
                </article>
                <article className={`${styles.metrica} ${styles.metricaGeneral}`}>
                    <span>Descarga · general</span>
                    <strong>{minutos(datos?.tiempoPromedioDescargaMinutos?.general)}</strong>
                    <small>Promedio del período seleccionado</small>
                </article>
                <article className={`${styles.metrica} ${styles.metricaConstruccion}`}>
                    <span>Descarga · construcción</span>
                    <strong>{minutos(datos?.tiempoPromedioDescargaMinutos?.['construcción'])}</strong>
                    <small>Promedio del período seleccionado</small>
                </article>
            </div>

            <div className={styles.visualizaciones}>
                <section className={styles.panel} aria-labelledby="cumplimiento-title">
                    <div className={styles.panelHeading}>
                        <div>
                            <h3 id="cumplimiento-title">Cumplimiento de citas</h3>
                            <p>Distribución de arribos registrados</p>
                        </div>
                    </div>
                    <div className={styles.estados}>
                        {ESTADOS.map((estado) => (
                            <div className={styles.estado} key={estado.clave}>
                                <div className={styles.estadoMeta}>
                                    <span><i className={styles[estado.color]} />{estado.etiqueta}</span>
                                    <strong>{porcentaje(cumplimiento[estado.clave])}</strong>
                                </div>
                                <div className={styles.barra}>
                                    <span className={styles[estado.color]} style={{ width: porcentaje(cumplimiento[estado.clave]) }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.panel} aria-labelledby="ocupacion-title">
                    <div className={styles.panelHeading}>
                        <div>
                            <h3 id="ocupacion-title">Ocupación por muelle</h3>
                            <p>Porcentaje del tiempo dentro del período</p>
                        </div>
                    </div>
                    <div className={styles.gateways}>
                        {(datos?.ocupacionPorGateway || Array.from({ length: 5 }, (_, index) => ({ numeroGateway: index + 1, porcentaje: 0, estado: 'Cargando' }))).map((gateway) => (
                            <div className={styles.gateway} key={gateway.numeroGateway}>
                                <div className={styles.gatewayMeta}>
                                    <strong>Gateway {gateway.numeroGateway}</strong>
                                    <span>{porcentaje(gateway.porcentaje)}</span>
                                </div>
                                <div className={styles.barra}>
                                    <span className={styles.ocupacion} style={{ width: porcentaje(gateway.porcentaje) }} />
                                </div>
                                <small>{gateway.estado}</small>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className={`${styles.panel} ${styles.volumen}`} aria-labelledby="volumen-title">
                <div className={styles.panelHeading}>
                    <div>
                        <h3 id="volumen-title">Volumen diario de recepción</h3>
                        <p>Pedidos atendidos y descargas finalizadas por fecha</p>
                    </div>
                </div>
                <div className={styles.tablaContenedor}>
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Atendidos</th><th>Finalizados</th></tr>
                        </thead>
                        <tbody>
                            {(datos?.volumenDiario || []).map((dia) => (
                                <tr key={dia.fecha}>
                                    <td>{new Date(`${dia.fecha}T00:00:00`).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td>{dia.atendidos}</td>
                                    <td>{dia.finalizados}</td>
                                </tr>
                            ))}
                            {!cargando && datos?.volumenDiario?.length === 0 && (
                                <tr><td colSpan="3" className={styles.vacio}>Sin actividad en el período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );
}