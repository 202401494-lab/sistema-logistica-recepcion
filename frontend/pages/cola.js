import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { obtenerCola, reevaluarCola } from '../lib/api';
import Sidebar from '../components/Sidebar';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/cola.module.css';

const etiquetaPuntualidad = (estado) => {
  if (String(estado).toLocaleLowerCase('es') === 'a tiempo') return 'A tiempo';
  if (String(estado).toLocaleLowerCase('es') === 'anticipado') return 'Anticipado';
  if (String(estado).toLocaleLowerCase('es') === 'tardío') return 'Tardío';
  return estado || 'Sin clasificar';
};

const clasePuntualidad = (estado) => {
  const normalizado = String(estado || '').toLocaleLowerCase('es');
  if (normalizado === 'a tiempo') return 'atiempo';
  if (normalizado === 'anticipado') return 'anticipado';
  if (normalizado === 'tardío') return 'tardio';
  return 'neutral';
};

export default function ColaPage() {
  const { rol, permisos, cargando } = useAuth();
  const [cola, setCola] = useState([]);
  const [cargandoCola, setCargandoCola] = useState(true);
  const [reevaluando, setReevaluando] = useState(false);
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarColapsado(true);
  }, []);

  const cargarCola = useCallback(async () => {
    try {
      const datos = await obtenerCola();
      setCola(Array.isArray(datos) ? datos : []);
      setError('');
      setUltimaActualizacion(new Date());
    } catch (errorCarga) {
      console.error(errorCarga);
      setError(errorCarga.message || 'No se pudo cargar la cola de espera.');
    } finally {
      setCargandoCola(false);
    }
  }, []);

  useEffect(() => {
    if (cargando || !rol) return undefined;
    cargarCola();
    const intervalo = window.setInterval(cargarCola, 15000);
    window.addEventListener('focus', cargarCola);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener('focus', cargarCola);
    };
  }, [cargando, rol, cargarCola]);

  const manejarReevaluacion = async () => {
    setReevaluando(true);
    setError('');
    try {
      const resultado = await reevaluarCola();
      setCola(Array.isArray(resultado.cola) ? resultado.cola : []);
      setUltimaActualizacion(new Date());
    } catch (errorReevaluacion) {
      console.error(errorReevaluacion);
      setError(errorReevaluacion.message || 'No se pudo reevaluar la cola.');
    } finally {
      setReevaluando(false);
      setCargandoCola(false);
    }
  };

  if (cargando) {
    return <main className={styles.loading}>Validando sesión...</main>;
  }

  const fondoPorRol = {
    administrador: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #1d4ed8 100%)',
    coordinador: 'linear-gradient(135deg, #064e3b 0%, #047857 52%, #0f766e 100%)',
    operador: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 52%, #ea580c 100%)',
  }[rol] || 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #1d4ed8 100%)';

  return (
    <div className={styles.layout} style={{ '--role-background': fondoPorRol }}>
      <Sidebar
        rol={rol}
        permisos={permisos}
        seccionActiva="cola"
        setSeccionActiva={() => {}}
        colapsado={sidebarColapsado}
        setColapsado={setSidebarColapsado}
      />
      <main
        className={`${styles.page} ${sidebarColapsado ? styles.sidebarCollapsed : ''}`}
        data-colapsado={sidebarColapsado}
      >
        <div className={styles.content}>
          <header className={styles.topbar}>
            <Link href="/dashboard" className={styles.dashboardButton}>
              <span aria-hidden="true">←</span> Volver al tablero
            </Link>
            <span className={styles.roleBadge}>{(rol || '').toUpperCase()}</span>
            <LogoutButton />
          </header>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>OPERACIONES DE RECEPCIÓN</span>
              <h1>Cola de espera</h1>
              <p>Una atención ordenada, transparente y en tiempo real.</p>
            </div>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={manejarReevaluacion}
              disabled={reevaluando || cargandoCola}
            >
              <span aria-hidden="true">⟳</span>
              {reevaluando ? 'Reevaluando...' : 'Reevaluar prioridad'}
            </button>
          </section>

          <section className={styles.stats} aria-live="polite">
            <article className={styles.statCard}>
              <span className={styles.statIcon}>🚛</span>
              <div><strong>{cola.length}</strong><span>En espera</span></div>
            </article>
            <article className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.clockIcon}`}>◷</span>
              <div>
                <strong>{cola[0]?.minutosEnEspera ?? 0}<small> min</small></strong>
                <span>Espera del siguiente</span>
              </div>
            </article>
            <article className={styles.statCard}>
              <span className={`${styles.liveDot}`} />
              <div>
                <strong className={styles.liveLabel}>En vivo</strong>
                <span>
                  {ultimaActualizacion
                    ? `Actualizado ${ultimaActualizacion.toLocaleTimeString()}`
                    : 'Sincronizando pedidos'}
                </span>
              </div>
            </article>
          </section>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <section className={styles.queuePanel}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.panelEyebrow}>ORDEN DE ATENCIÓN</span>
                <h2>Pedidos en fila</h2>
              </div>
              <span className={styles.countPill}>{cola.length} {cola.length === 1 ? 'pedido' : 'pedidos'}</span>
            </div>

            {cargandoCola ? (
              <div className={styles.empty}>
                <span className={styles.spinner} />
                <p>Cargando pedidos...</p>
              </div>
            ) : cola.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">✓</span>
                <h3>Todo al día</h3>
                <p>Cuando haya pedidos esperando, aparecerán aquí en orden de prioridad.</p>
                <Link href="/dashboard" className={styles.backLink}>Volver al panel principal</Link>
              </div>
            ) : (
              <ol className={styles.list} aria-label="Pedidos ordenados por prioridad">
                {cola.map((pedido, indice) => (
                  <li className={`${styles.card} ${indice === 0 ? styles.topCard : ''}`} key={pedido._id}>
                    <span className={`${styles.position} ${indice === 0 ? styles.firstPosition : ''}`}>
                      {indice === 0 ? '★' : String(indice + 1).padStart(2, '0')}
                    </span>
                    <div className={styles.details}>
                      <div className={styles.titleRow}>
                        <h3>{pedido.numeroPedido}</h3>
                        <span className={`${styles.badge} ${styles[clasePuntualidad(pedido.estadoPuntualidad)]}`}>
                          {etiquetaPuntualidad(pedido.estadoPuntualidad)}
                        </span>
                      </div>
                      <p className={styles.provider}>
                        {pedido.proveedorId?.razonSocial || 'Proveedor no disponible'}
                      </p>
                      <div className={styles.metadata}>
                        <span className={styles.category}>
                          <span aria-hidden="true">▦</span>
                          {pedido.tipoProducto || 'Carga sin categoría'}
                        </span>
                        <span><span aria-hidden="true">◷</span> {pedido.minutosEnEspera || 0} min en espera</span>
                      </div>
                    </div>
                    <div className={styles.priority}>
                      <span>PRIORIDAD</span>
                      <strong>{pedido.prioridadCalculada ?? 0}</strong>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <p className={styles.footerNote}>La cola se actualiza automáticamente cada 15 segundos.</p>
        </div>
      </main>
    </div>
  );
}
