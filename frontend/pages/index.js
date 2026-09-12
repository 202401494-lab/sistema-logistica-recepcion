import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { obtenerToken, decodeJWT, tokenExpirado } from '../lib/auth';

// Página raíz: solo decide a dónde mandar al usuario según su sesión
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = obtenerToken();
    const payload = token ? decodeJWT(token) : null;

    if (!token || !payload || tokenExpirado(payload)) {
      router.replace('/login');
      return;
    }

    router.replace(`/${payload.rol}`);
  }, [router]);

  return null;
}
