import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { obtenerToken, decodeJWT, tokenExpirado } from '../lib/auth';
import LogoutButton from '../components/LogoutButton';

export default function Admin() {
  const router = useRouter();
  const [rol, setRol] = useState(null);

  useEffect(() => {
    const token = obtenerToken();
    const payload = token ? decodeJWT(token) : null;

    // Verificación de sesión: sin token, token vencido o rol incorrecto -> fuera
    if (!token || !payload || tokenExpirado(payload) || payload.rol !== 'administrador') {
      router.replace('/login');
      return;
    }

    setRol(payload.rol);
  }, [router]);

  if (!rol) return null; // evita parpadeo de contenido antes de validar

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">Rol: {rol}</h2>
      <LogoutButton />
    </div>
  );
}
