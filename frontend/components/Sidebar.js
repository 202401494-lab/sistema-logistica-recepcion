import styles from '../styles/sidebar.module.css';

export default function Sidebar({ rol, seccionActiva, setSeccionActiva, colapsado, setColapsado }) {
    const cerrarEnMovil = () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setColapsado(true);
        }
    };

    const estilosPorRol = {
        administrador: {
            background: '#0f172a',
            colorTextoActivo: '#1e293b'
        },
        coordinador: {
            background: '#064e3b',
            colorTextoActivo: '#064e3b'
        },
        operador: {
            background: '#7c2d12',
            colorTextoActivo: '#7c2d12'
        }
    };

    const estiloActual = estilosPorRol[rol] || estilosPorRol.coordinador;

    return (
        <>
            {!colapsado && (
                <div
                    className={styles.overlay}
                    onClick={() => setColapsado(true)}
                />
            )}

            <aside
                className={`${styles.sidebar} ${colapsado ? styles.colapsado : ''}`}
                style={{ background: estiloActual.background }}
            >
                <div className={styles.brand}>
                    <span className={styles.logoIcon}>📦</span>
                    {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                        <span className={styles.logoText}>Logística</span>
                    )}

                    <button
                        type="button"
                        className={styles.toggleBtn}
                        onClick={() => setColapsado(!colapsado)}
                        title={colapsado ? 'Abrir menú' : 'Cerrar menú'}
                    >
                        {colapsado ? '☰' : '✕'}
                    </button>
                </div>

                <nav className={styles.menu}>
                    {rol === 'coordinador' && (
                        <>
                            <button
                                type="button"
                                className={seccionActiva === 'resumen' ? styles.itemActivo : styles.item}
                                style={seccionActiva === 'resumen' ? { color: estiloActual.colorTextoActivo } : {}}
                                onClick={() => { setSeccionActiva('resumen'); cerrarEnMovil(); }}
                            >
                                <span className={styles.icon}>📊</span>
                                {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                                    <span className={styles.label}>Resumen</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={seccionActiva === 'proveedor' ? styles.itemActivo : styles.item}
                                style={seccionActiva === 'proveedor' ? { color: estiloActual.colorTextoActivo } : {}}
                                onClick={() => { setSeccionActiva('proveedor'); cerrarEnMovil(); }}
                            >
                                <span className={styles.icon}>🏭</span>
                                {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                                    <span className={styles.label}>Registrar proveedor</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={seccionActiva === 'listaProveedores' ? styles.itemActivo : styles.item}
                                style={seccionActiva === 'listaProveedores' ? { color: estiloActual.colorTextoActivo } : {}}
                                onClick={() => { setSeccionActiva('listaProveedores'); cerrarEnMovil(); }}
                            >
                                <span className={styles.icon}>🏢</span>
                                {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                                    <span className={styles.label}>Proveedores</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={seccionActiva === 'pedido' ? styles.itemActivo : styles.item}
                                style={seccionActiva === 'pedido' ? { color: estiloActual.colorTextoActivo } : {}}
                                onClick={() => { setSeccionActiva('pedido'); cerrarEnMovil(); }}
                            >
                                <span className={styles.icon}>📅</span>
                                {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                                    <span className={styles.label}>Agendar pedido</span>
                                )}
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        className={styles.item}
                        onClick={() => window.location.href = '/caseta'}
                    >
                        <span className={styles.icon}>🚪</span>
                        {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                            <span className={styles.label}>Caseta</span>
                        )}
                    </button>
                </nav>

                {(!colapsado || (typeof window !== 'undefined' && window.innerWidth <= 768)) && (
                    <div className={styles.footer}>
                        <span className={styles.userRoleBadge}>{(rol || '').toUpperCase()}</span>
                    </div>
                )}
            </aside>
        </>
    );
}