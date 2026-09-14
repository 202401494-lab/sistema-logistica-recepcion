import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/rolePages.module.css';

/* Página de administración */
export default function Admin() {
  const { rol, cargando } = useAuth('administrador'); /* Protege la ruta para que solo administradores puedan acceder */

  /* Muestra un mensaje de carga mientras se verifica la sesión y el rol */
  if (cargando) {
    return (
      <div className={`${styles.loadingContainer} ${styles.containerAdmin}`}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  /* Renderiza el contenido de la página de administración si el usuario tiene el rol adecuado */
  return (
    <div className={`${styles.container} ${styles.containerAdmin}`}>
      <div className={styles.card}>
        <h2 className={styles.title}>Bienvenido, {rol.toUpperCase()} 😊</h2>
        <p className={styles.subtitle}>Centro de Administración</p>
        <div className={styles.content}>
          <p>Acceso total al sistema</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}