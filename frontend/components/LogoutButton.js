import { useRouter } from 'next/router';
import { cerrarSesion } from '../lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  const manejarLogout = () => {
    cerrarSesion();
    // replace() en lugar de push() para no dejar la página protegida
    // en el historial del navegador
    router.replace('/login');
  };

  return (
    <button className="btn btn-outline-danger" onClick={manejarLogout}>
      Cerrar sesión
    </button>
  );
}
