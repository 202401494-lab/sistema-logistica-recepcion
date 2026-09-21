import { useRouter } from 'next/router';
import { cerrarSesion } from '../lib/auth';
import styles from '../styles/LogoutButton.module.css';

/* Componente de botón de cierre de sesión */
export default function LogoutButton() {
  const router = useRouter();

  /* Maneja el cierre de sesión y redirige al usuario a la página de inicio de sesión */
  const manejarLogout = () => {
    cerrarSesion();
    // replace() en lugar de push() para no dejar la página protegida
    // en el historial del navegador
    router.replace('/login');
  };

  /* Renderiza el botón de cierre de sesión */
  return (
    <button 
      className={`btn btn-outline-danger ${styles.logoutBtn}`} 
      onClick={manejarLogout}
    >
      Cerrar sesión 🔐
    </button>
  );
}