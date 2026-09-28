import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Sidebar.module.css';

/* Componente Sidebar */
/* Permite la navegación entre módulos ajustándose según el rol del usuario */
export default function Sidebar({ userRole = 'COORDINADOR', onLogout }) {
    /* Estado para controlar la expansión / contracción del menú lateral */
    const [expanded, setExpanded] = useState(true);
    const router = useRouter();

    /* Cambia el estado entre expandido y colapsado */
    const toggleSidebar = () => setExpanded(!expanded);

    /* Lista de rutas y opciones del sistema con sus permisos de acceso por rol */
    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['COORDINADOR', 'ADMIN'] },
        { label: 'Caseta (Llegadas)', path: '/caseta', icon: '🚛', roles: ['CASETA', 'COORDINADOR', 'ADMIN'] },
        { label: 'Proveedores', path: '/proveedores', icon: '🏭', roles: ['COORDINADOR', 'ADMIN'] },
        { label: 'Pedidos', path: '/pedidos', icon: '📋', roles: ['COORDINADOR', 'ADMIN'] },
        { label: 'Parámetros', path: '/parametros', icon: '⚙️', roles: ['ADMIN'] },
    ];

    return (
        <aside className={`${styles.sidebar} ${expanded ? styles.expanded : styles.collapsed}`}>
            {/* Encabezado del menú con botón de conmutación */}
            <div className={styles.header}>
                <button onClick={toggleSidebar} className={styles.toggleBtn} title="Expandir/Contraer">
                    {expanded ? '◀' : '▶'}
                </button>
                {expanded && <span className={styles.brandTitle}>SISTEMA LOGÍSTICO</span>}
            </div>

            {/* Navegación principal filtrada dinámicamente por rol */}
            <nav className={styles.nav}>
                {navItems
                    .filter(item => item.roles.includes(userRole))
                    .map((item) => {
                        const isActive = router.pathname === item.path;
                        return (
                            <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                                <span className={styles.icon}>{item.icon}</span>
                                {expanded && <span className={styles.label}>{item.label}</span>}
                            </Link>
                        );
                    })}
            </nav>

            {/* Pie de página del sidebar con información de usuario y botón salir */}
            {expanded && (
                <div className={styles.footer}>
                    <div className={styles.userInfo}>
                        <span className={styles.roleBadge}>{userRole}</span>
                    </div>
                    <button onClick={onLogout} className={styles.logoutBtn}>
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </aside>
    );
}