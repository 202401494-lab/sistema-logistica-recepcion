import { useCallback, useEffect, useState } from 'react';
import {
  actualizarMfaObligatorio,
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  obtenerRoles,
  obtenerUsuarios,
} from '../lib/api';
import styles from '../styles/userManagement.module.css';

const LIMITE_POR_PAGINA = 8;
const FORMULARIO_VACIO = {
  nombres: '',
  apellidosCompleto: '',
  email: '',
  password: '',
  roles: [],
  estado: 'activo',
  mfaObligatorio: false,
};

const iniciales = (usuario) => `${usuario.nombres?.[0] || ''}${usuario.apellidosCompleto?.[0] || ''}`.toUpperCase();
const idRol = (rol) => String(rol?._id || rol);
const nombreRol = (rol) => rol?.nombreRol || rol?.nombre || '';

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuarioActualizando, setUsuarioActualizando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarUsuarios = useCallback(async (paginaSolicitada = 1) => {
    setCargando(true);
    setError('');
    try {
      const resultado = await obtenerUsuarios(paginaSolicitada, LIMITE_POR_PAGINA);
      setUsuarios(resultado.usuarios);
      setPagina(resultado.paginacion.pagina);
      setTotalPaginas(resultado.paginacion.paginas);
      setTotalUsuarios(resultado.paginacion.total);
    } catch (errorCarga) {
      console.error(errorCarga);
      setError(errorCarga.message || 'No se pudieron cargar las cuentas de usuario.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarRoles = useCallback(async () => {
    try {
      const resultado = await obtenerRoles(true);
      setRoles(Array.isArray(resultado) ? resultado : []);
    } catch (errorCarga) {
      console.error(errorCarga);
      setError(errorCarga.message || 'No se pudieron cargar los roles activos.');
    }
  }, []);

  useEffect(() => {
    cargarUsuarios(1);
    cargarRoles();
  }, [cargarUsuarios, cargarRoles]);

  const abrirCreacion = () => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
    setError('');
    setMensaje('');
  };

  const volverAGestion = () => {
    setMostrarFormulario(false);
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const abrirEdicion = (usuario) => {
    setEditando(usuario);
    setFormulario({
      nombres: usuario.nombres || '',
      apellidosCompleto: usuario.apellidosCompleto || '',
      email: usuario.email || '',
      password: '',
      roles: (usuario.roles || []).map(idRol).filter((id) => roles.some((rol) => String(rol._id) === id)),
      estado: usuario.estado || 'activo',
      mfaObligatorio: Boolean(usuario.mfaObligatorio),
    });
    setMostrarFormulario(true);
    setError('');
    setMensaje('');
  };

  const cambiarRol = (id) => {
    setFormulario((actual) => ({
      ...actual,
      roles: actual.roles.includes(id)
        ? actual.roles.filter((actualId) => actualId !== id)
        : [...actual.roles, id],
    }));
  };

  const guardarUsuario = async (event) => {
    event.preventDefault();
    if (formulario.roles.length === 0) {
      setError('Selecciona al menos un rol activo para la cuenta.');
      return;
    }
    if (!editando && formulario.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const datos = { ...formulario };
      if (!datos.password) delete datos.password;
      if (editando) {
        if (datos.mfaObligatorio === Boolean(editando.mfaObligatorio)) {
          delete datos.mfaObligatorio;
        } else if (!datos.mfaObligatorio && editando.twoFactorEnabled
          && !window.confirm('Al quitar el requisito también se eliminará el autenticador MFA configurado para esta cuenta. ¿Continuar?')) {
          return;
        }
        await actualizarUsuario(editando._id, datos);
        setMensaje(`Se actualizaron los datos de ${datos.email}.`);
      } else {
        await crearUsuario(datos);
        setMensaje(`Se creó la cuenta de ${datos.email}.`);
      }
      setMostrarFormulario(false);
      setEditando(null);
      await cargarUsuarios(pagina);
    } catch (errorGuardar) {
      console.error(errorGuardar);
      setError(errorGuardar.message || 'No se pudo guardar la cuenta.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRequisitoMfa = async (usuario) => {
    const nuevoValor = !usuario.mfaObligatorio;
    if (!nuevoValor && usuario.twoFactorEnabled
      && !window.confirm('Al quitar el requisito también se eliminará el autenticador MFA configurado para esta cuenta. ¿Continuar?')) {
      return;
    }
    setUsuarioActualizando(usuario._id);
    setError('');
    setMensaje('');
    try {
      const resultado = await actualizarMfaObligatorio(usuario._id, nuevoValor);
      setUsuarios((actuales) => actuales.map((actual) => (
        actual._id === usuario._id
          ? {
            ...actual,
            mfaObligatorio: resultado.usuario.mfaObligatorio,
            twoFactorEnabled: resultado.usuario.twoFactorEnabled,
          }
          : actual
      )));
      setMensaje(
        `MFA ${resultado.usuario.mfaObligatorio ? 'requerido' : 'opcional'} para ${resultado.usuario.email}.`,
      );
    } catch (errorActualizacion) {
      console.error(errorActualizacion);
      setError(errorActualizacion.message || 'No se pudo actualizar el requisito de MFA.');
    } finally {
      setUsuarioActualizando(null);
    }
  };

  const cambiarEstadoCuenta = async (usuario) => {
    setUsuarioActualizando(usuario._id);
    setError('');
    setMensaje('');
    try {
      if (usuario.estado === 'activo') {
        await desactivarUsuario(usuario._id);
        setMensaje(`Se desactivó la cuenta ${usuario.email}.`);
      } else {
        await actualizarUsuario(usuario._id, {
          nombres: usuario.nombres,
          apellidosCompleto: usuario.apellidosCompleto,
          email: usuario.email,
          roles: (usuario.roles || []).map(idRol),
          estado: 'activo',
        });
        setMensaje(`Se reactivó la cuenta ${usuario.email}.`);
      }
      await cargarUsuarios(pagina);
    } catch (errorEstado) {
      console.error(errorEstado);
      setError(errorEstado.message || 'No se pudo cambiar el estado de la cuenta.');
    } finally {
      setUsuarioActualizando(null);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas || cargando) return;
    cargarUsuarios(nuevaPagina);
  };

  return (
    <section className={styles.management} aria-label="Usuarios del sistema">
      <header className={styles.managementHeader}>
        <div>
          <span className={styles.sectionEyebrow}>
            {mostrarFormulario ? 'GESTIÓN DE CUENTAS' : 'DIRECTORIO DE CUENTAS'}
          </span>
          <h2>
            {mostrarFormulario
              ? (editando ? `Editar ${editando.email}` : 'Crear cuenta de usuario')
              : 'Usuarios registrados'}
          </h2>
          <p>
            {mostrarFormulario
              ? 'Completa los datos de la cuenta, asigna roles y configura su requisito MFA.'
              : 'Administra perfiles, acceso de cuenta y seguridad MFA.'}
          </p>
        </div>
        {mostrarFormulario ? (
          <button type="button" className={styles.createUserButton} onClick={volverAGestion} disabled={guardando}>
            ← Volver a gestión de usuarios
          </button>
        ) : (
          <button type="button" className={styles.createUserButton} onClick={abrirCreacion}>
            + Nuevo usuario
          </button>
        )}
      </header>

      {!mostrarFormulario && (
        <div className={styles.mfaLegend}>
          <span><i className={styles.legendConfigured} /> MFA configurado</span>
          <span><i className={styles.legendRequired} /> MFA obligatorio</span>
        </div>
      )}

      {mensaje && <div className={styles.successMessage} role="status">{mensaje}</div>}
      {error && <div className={styles.errorMessage} role="alert">{error}</div>}

      {mostrarFormulario && (
        <form className={styles.userForm} onSubmit={guardarUsuario}>
          <div className={styles.userFields}>
            <label>Nombres
              <input value={formulario.nombres} onChange={(event) => setFormulario({ ...formulario, nombres: event.target.value })} required disabled={guardando} />
            </label>
            <label>Apellidos
              <input value={formulario.apellidosCompleto} onChange={(event) => setFormulario({ ...formulario, apellidosCompleto: event.target.value })} required disabled={guardando} />
            </label>
            <label>Correo electrónico
              <input type="email" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} required disabled={guardando} />
            </label>
            <label>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              <input type="password" value={formulario.password} onChange={(event) => setFormulario({ ...formulario, password: event.target.value })} minLength={8} required={!editando} autoComplete="new-password" disabled={guardando} />
            </label>
            <label>Estado de cuenta
              <select value={formulario.estado} onChange={(event) => setFormulario({ ...formulario, estado: event.target.value })} disabled={guardando}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          </div>
          <fieldset className={styles.roleSelector}>
            <legend>Roles activos asignados</legend>
            {roles.length === 0 ? (
              <p>No hay roles activos. Crea o activa un rol antes de registrar usuarios.</p>
            ) : roles.map((role) => (
              <label key={role._id}>
                <input type="checkbox" checked={formulario.roles.includes(String(role._id))} onChange={() => cambiarRol(String(role._id))} disabled={guardando} />
                <span>{nombreRol(role)}</span>
              </label>
            ))}
          </fieldset>
          <label className={styles.mfaFormSwitch}>
            <input type="checkbox" checked={formulario.mfaObligatorio} onChange={(event) => setFormulario({ ...formulario, mfaObligatorio: event.target.checked })} disabled={guardando} />
            Requerir MFA al iniciar sesión
          </label>
          <button type="submit" className={styles.saveUserButton} disabled={guardando || roles.length === 0}>
            {guardando ? 'Guardando...' : editando ? 'Guardar usuario' : 'Crear usuario'}
          </button>
        </form>
      )}

      {!mostrarFormulario && (cargando ? (
        <div className={styles.tableMessage}><span className={styles.spinner} /> Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className={styles.tableMessage}>No hay usuarios registrados.</div>
      ) : (
        <div className={styles.tableScroller}>
          <table className={styles.userTable}>
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Cuenta</th><th>Estado MFA</th><th>Requisito</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario._id}>
                  <td>
                    <div className={styles.userIdentity}>
                      <span className={styles.avatar}>{iniciales(usuario) || 'U'}</span>
                      <span className={styles.userText}>
                        <strong>{usuario.nombres} {usuario.apellidosCompleto}</strong>
                        <span>{usuario.email}</span>
                      </span>
                    </div>
                  </td>
                  <td><div className={styles.roles}>
                    {(usuario.roles || []).map((role) => (
                      <span className={styles.roleBadge} key={idRol(role)}>{nombreRol(role)}</span>
                    ))}
                  </div></td>
                  <td><span className={`${styles.statusBadge} ${usuario.estado === 'activo' ? styles.statusActive : styles.statusInactive}`}><i />{usuario.estado || 'Sin estado'}</span></td>
                  <td><span className={`${styles.statusBadge} ${usuario.twoFactorEnabled ? styles.statusActive : styles.statusNeutral}`}><i />{usuario.twoFactorEnabled ? 'Configurado' : 'Sin configurar'}</span></td>
                  <td>
                    <div className={styles.requirementCell}>
                      <span className={`${styles.statusBadge} ${usuario.mfaObligatorio ? styles.statusRequired : styles.statusNeutral}`}><i />{usuario.mfaObligatorio ? 'Obligatorio' : 'Opcional'}</span>
                      <button type="button" className={styles.toggleButton} onClick={() => cambiarRequisitoMfa(usuario)} disabled={usuarioActualizando === usuario._id || usuario.estado !== 'activo'}>
                        {usuario.mfaObligatorio ? 'Quitar requisito' : 'Requerir MFA'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className={styles.userActions}>
                      <button type="button" className={styles.editUserButton} onClick={() => abrirEdicion(usuario)}>Editar</button>
                      <button type="button" className={usuario.estado === 'activo' ? styles.deactivateUserButton : styles.activateUserButton} onClick={() => cambiarEstadoCuenta(usuario)} disabled={usuarioActualizando === usuario._id}>
                        {usuarioActualizando === usuario._id ? 'Guardando...' : usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {!mostrarFormulario && <footer className={styles.pagination}>
        <span>{totalUsuarios === 0 ? 'Sin resultados' : `Página ${pagina} de ${Math.max(totalPaginas, 1)} · ${totalUsuarios} usuarios`}</span>
        <div className={styles.paginationControls}>
          <button type="button" onClick={() => cambiarPagina(pagina - 1)} disabled={pagina <= 1 || cargando}>← Anterior</button>
          <button type="button" onClick={() => cambiarPagina(pagina + 1)} disabled={pagina >= totalPaginas || cargando}>Siguiente →</button>
        </div>
      </footer>}
    </section>
  );
}
