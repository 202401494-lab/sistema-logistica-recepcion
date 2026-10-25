import { useState } from 'react';
import { actualizarMfaObligatorio } from '../lib/api';
import styles from '../styles/userManagement.module.css';

const ID_MONGODB = /^[a-f\d]{24}$/i;

export default function UserForm() {
  const [usuarioId, setUsuarioId] = useState('');
  const [mfaObligatorio, setMfaObligatorio] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setMensaje('');
    setError('');

    if (!ID_MONGODB.test(usuarioId.trim())) {
      setError('Ingresa un identificador de usuario válido de MongoDB (24 caracteres hexadecimales).');
      return;
    }

    setCargando(true);
    try {
      const resultado = await actualizarMfaObligatorio(usuarioId.trim(), mfaObligatorio);
      const usuario = resultado.usuario;
      setMensaje(
        `Requisito actualizado para ${usuario.email}: MFA ${usuario.mfaObligatorio ? 'obligatorio' : 'no obligatorio'}.`,
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el requisito de MFA.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={manejarEnvio}>
      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="mb-3">
        <label htmlFor="usuario-id" className="form-label fw-semibold">ID de usuario (MongoDB)</label>
        <input
          id="usuario-id"
          className="form-control"
          type="text"
          value={usuarioId}
          onChange={(event) => setUsuarioId(event.target.value.trim())}
          placeholder="Ej. 66f..."
          pattern="[a-fA-F0-9]{24}"
          maxLength={24}
          required
          disabled={cargando}
        />
      </div>

      <div className="form-check form-switch mb-4">
        <input
          id="mfa-obligatorio"
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={mfaObligatorio}
          onChange={(event) => setMfaObligatorio(event.target.checked)}
          disabled={cargando}
        />
        <label className="form-check-label fw-semibold" htmlFor="mfa-obligatorio">
          Requerir Autenticación Multifactor (MFA)
        </label>
        <div className="form-text">
          Al activarlo, la persona deberá registrar una aplicación de autenticación si todavía no tiene MFA configurado.
        </div>
      </div>

      <button className={`btn btn-primary ${styles.saveButton}`} type="submit" disabled={cargando || !ID_MONGODB.test(usuarioId.trim())}>
        {cargando ? 'Guardando...' : 'Guardar requisito MFA'}
      </button>
    </form>
  );
}
