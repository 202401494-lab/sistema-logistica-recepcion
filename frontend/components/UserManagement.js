import { useCallback, useEffect, useState } from 'react';
import { actualizarMfaObligatorio, obtenerUsuarios } from '../lib/api';
import styles from '../styles/userManagement.module.css';

const LIMITE_POR_PAGINA = 8;

const iniciales = (usuario) => `${usuario.nombres?.[0] || ''}${usuario.apellidosCompleto?.[0] || ''}`.toUpperCase();

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [usuarioActualizando, setUsuarioActualizando] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarUsuarios = useCallback(async (paginaSolicitada) => {
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

  useEffect(() => {
    cargarUsuarios(1);
  }, [cargarUsuarios]);

  const cambiarRequisitoMfa = async (usuario) => {
    setUsuarioActualizando(usuario._id);
    setError('');
    setMensaje('');
    try {
      const resultado = await actualizarMfaObligatorio(usuario._id, !usuario.mfaObligatorio);
      setUsuarios((actuales) => actuales.map((actual) => (
        actual._id === usuario._id
          ? { ...actual, mfaObligatorio: resultado.usuario.mfaObligatorio }
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

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas || cargando) return;
    cargarUsuarios(nuevaPagina);
  };

  return (
    <section className={styles.management} aria-label="Usuarios del sistema">
      <header className={styles.managementHeader}>
        <div>
          <span className={styles.sectionEyebrow}>DIRECTORIO DE CUENTAS</span>
          <h2>Usuarios registrados</h2>
          <p>El requisito de MFA se puede cambiar sin revelar datos de autenticación.</p>
        </div>
        <span className={styles.totalBadge}>{totalUsuarios} cuentas</span>
      </header>

      <div className={styles.mfaLegend}>
        <span><i className={styles.legendConfigured} /> MFA configurado</span>
        <span><i className={styles.legendRequired} /> MFA obligatorio</span>
      </div>

      {mensaje && <div className={styles.successMessage} role="status">{mensaje}</div>}
      {error && <div className={styles.errorMessage} role="alert">{error}</div>}

      {cargando ? (
        <div className={styles.tableMessage}>
          <span className={styles.spinner} />
          <span>Cargando usuarios...</span>
        </div>
      ) : usuarios.length === 0 ? (
        <div className={styles.tableMessage}>No hay usuarios registrados.</div>
      ) : (
        <div className={styles.tableScroller}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Rol</th>
                <th scope="col">Cuenta</th>
                <th scope="col">Estado MFA</th>
                <th scope="col">Requisito</th>
              </tr>
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
                  <td>
                    <div className={styles.roles}>
                      {(usuario.roles || []).map((rol) => (
                        <span className={styles.roleBadge} key={rol._id || rol.nombre}>{rol.nombre}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${usuario.estado === 'activo' ? styles.statusActive : styles.statusInactive}`}>
                      <i />
                      {usuario.estado || 'Sin estado'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${usuario.twoFactorEnabled ? styles.statusActive : styles.statusNeutral}`}>
                      <i />
                      {usuario.twoFactorEnabled ? 'Configurado' : 'Sin configurar'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.requirementCell}>
                      <span className={`${styles.statusBadge} ${usuario.mfaObligatorio ? styles.statusRequired : styles.statusNeutral}`}>
                        <i />
                        {usuario.mfaObligatorio ? 'Obligatorio' : 'Opcional'}
                      </span>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${usuario.mfaObligatorio ? styles.toggleOn : ''}`}
                        onClick={() => cambiarRequisitoMfa(usuario)}
                        disabled={usuarioActualizando === usuario._id}
                        aria-label={`${usuario.mfaObligatorio ? 'Quitar requisito de MFA para' : 'Requerir MFA para'} ${usuario.email}`}
                      >
                        {usuarioActualizando === usuario._id
                          ? 'Guardando...'
                          : usuario.mfaObligatorio ? 'Hacer opcional' : 'Requerir MFA'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className={styles.pagination}>
        <span>
          {totalUsuarios === 0
            ? 'Sin resultados'
            : `Página ${pagina} de ${Math.max(totalPaginas, 1)} · ${totalUsuarios} usuarios`}
        </span>
        <div className={styles.paginationControls}>
          <button type="button" onClick={() => cambiarPagina(pagina - 1)} disabled={pagina <= 1 || cargando}>
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => cambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas || cargando}
          >
            Siguiente →
          </button>
        </div>
      </footer>
    </section>
  );
}
