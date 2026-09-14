import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/rolePages.module.css';

/* Página de operador */
export default function Operador() {
  const { rol, cargando } = useAuth('operador'); /* Verifica el rol del usuario */

  /* Muestra un mensaje de carga mientras se verifica la sesión y el rol */
  if (cargando) {
    return (
      <div className={`${styles.loadingContainer} ${styles.containerOperador}`}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  /* Renderiza el contenido de la página de operador si el usuario tiene el rol adecuado */
  return (
    <div className={`${styles.container} ${styles.containerOperador}`}>
      <div className={styles.card}>
        <h2 className={styles.title}>Bienvenido, {rol.toUpperCase()} 😊</h2>
        <p className={styles.subtitle}>Centro Operativo</p>
        <div className={styles.content}>
          <p>Ejecución de tareas operativas</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}