import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MfaSetupModal from '../../components/MfaSetupModal';
import { activarMfa, configurarMfa, verificarCodigoMfa } from '../../lib/api';
import {
  guardarSesion,
  limpiarTokenTemporal,
  obtenerTokenTemporal,
} from '../../lib/auth';

export default function MfaLogin() {
  const router = useRouter();
  const [inicializado, setInicializado] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoQr, setCargandoQr] = useState(false);

  useEffect(() => {
    const tempToken = obtenerTokenTemporal();
    if (!tempToken) {
      router.replace('/login');
      return;
    }

    const requiereConfiguracion = sessionStorage.getItem('mfaSetupRequired') === 'true';
    setSetupRequired(requiereConfiguracion);
    setInicializado(true);

    if (requiereConfiguracion) {
      let cancelado = false;
      setCargandoQr(true);
      configurarMfa()
        .then((datos) => {
          if (!cancelado) setOtpauthUrl(datos.otpauthUrl || '');
        })
        .catch((err) => {
          if (!cancelado) setError(err.message || 'No se pudo generar la configuración MFA.');
        })
        .finally(() => {
          if (!cancelado) setCargandoQr(false);
        });

      return () => {
        cancelado = true;
      };
    }
  }, [router]);

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (setupRequired) {
        await activarMfa(code);
        setSetupRequired(false);
        sessionStorage.setItem('mfaSetupRequired', 'false');
      }

      const datos = await verificarCodigoMfa(code);
      if (!datos.token) throw new Error('El servidor no devolvió el token de acceso.');

      guardarSesion(datos.token);
      limpiarTokenTemporal();
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo verificar el código de autenticación.');
    } finally {
      setCargando(false);
    }
  };

  const volverAlLogin = () => {
    limpiarTokenTemporal();
    router.replace('/login');
  };

  if (!inicializado) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status" aria-label="Validando sesión temporal" />
      </main>
    );
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="w-100" style={{ maxWidth: 520 }}>
        <MfaSetupModal
          setupRequired={setupRequired}
          otpauthUrl={otpauthUrl}
          code={code}
          error={error}
          cargando={cargando}
          cargandoQr={cargandoQr}
          onCodeChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          onSubmit={manejarEnvio}
          onCancel={volverAlLogin}
        />
      </div>
    </main>
  );
}
