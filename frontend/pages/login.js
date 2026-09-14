import { useState } from 'react';
import { useRouter } from 'next/router';
import { guardarSesion, decodeJWT } from '../lib/auth';

const API_URL = 'http://localhost:4000/api/auth/login';

export default function Login() {
  const router = useRouter();
  const [formulario, setFormulario] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje || 'Error al iniciar sesión');
        return;
      }

      guardarSesion(datos.token);
      const payload = decodeJWT(datos.token);

      // Redirección dinámica según el rol contenido en el token
      if (payload?.rol === 'administrador') router.replace('/admin');
      else if (payload?.rol === 'coordinador') router.replace('/coordinador');
      else if (payload?.rol === 'operador') router.replace('/operador');
      else router.replace('/');
    } catch (err) {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: '380px' }}>
        <h3 className="text-center mb-4">Iniciar sesión</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={manejarEnvio}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formulario.email}
              onChange={manejarCambio}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formulario.password}
              onChange={manejarCambio}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
