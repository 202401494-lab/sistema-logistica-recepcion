import { useState } from 'react';
import { useRouter } from 'next/router';
import { guardarSesion, decodeJWT } from '../lib/auth';
import styles from '../styles/login.module.css';

const API_URL = 'http://localhost:4000/api/auth/login';

/* Componente de inicio de sesión */
export default function Login() {
  const router = useRouter();
  const [formulario, setFormulario] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  /* Maneja los cambios en los campos del formulario */
  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  /* Alterna la visibilidad de la contraseña */
  const togglePassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  /* Maneja el envío del formulario */
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    /* Realiza la solicitud de inicio de sesión al backend */
    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario),
      });

      /* Procesa la respuesta del backend */
      const datos = await respuesta.json();

      /* Maneja errores de autenticación */
      if (!respuesta.ok) {
        setError(datos.mensaje || 'Error al iniciar sesión');
        return;
      }

      /* Guarda el token en el almacenamiento local y redirige según el rol */
      guardarSesion(datos.token);
      const payload = decodeJWT(datos.token);

      // Todos los roles usan la misma pantalla; el dashboard adapta color y acciones.
      if (payload?.rol) router.replace('/dashboard');
      else router.replace('/login');
    } catch (err) {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    } finally {
      setCargando(false);
    }
  };

  /* Renderiza el formulario de inicio de sesión */
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* SECCIÓN IZQUIERDA: FORMULARIO */}
        <div className={styles.formSection}>
          {/* Logo/Branding del equipo */}
          <div className={styles.header}>
            <h1 className={styles.title}>Recepción de Proveedores</h1>
            <p className={styles.subtitle}>Sistema Logístico</p>
          </div>

          {/* Formulario de inicio de sesión */}
          <form onSubmit={manejarEnvio} className={styles.form}>
            {error && (
              <div className={`alert alert-danger ${styles.errorAlert}`} role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* Campo de correo electrónico */}
            <div className={styles.formGroup}>
              <label className={`form-label ${styles.label}`}>Correo electrónico</label>
              <div className={styles.inputGroup}>
                <span className={styles.inputEmoji}>📧</span>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${styles.input}`}
                  value={formulario.email}
                  onChange={manejarCambio}
                  placeholder="tu@test.com"
                  required
                  disabled={cargando}
                />
              </div>
            </div>

            {/* Campo de contraseña con ojito */}
            <div className={styles.formGroup}>
              <label className={`form-label ${styles.label}`}>Contraseña</label>
              <div className={styles.passwordWrapper}>
                <span className={styles.inputEmoji}>🔐</span>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-control ${styles.input}`}
                  value={formulario.password}
                  onChange={manejarCambio}
                  placeholder="********"
                  required
                  disabled={cargando}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={togglePassword}
                  disabled={cargando}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Botón de envío del formulario */}
            <button
              type="submit"
              className={`btn btn-primary w-100 ${styles.submitBtn}`}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Ingresando...
                </>
              ) : (
                'Ingresar 🔓'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}