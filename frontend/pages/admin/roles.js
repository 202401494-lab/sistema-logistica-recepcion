import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { actualizarRol, crearRol, desactivarRol, obtenerRoles } from '../../lib/api';
import styles from '../../styles/roles.module.css';

const MODULOS = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'roles', label: 'Roles' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'gateways', label: 'Gateways' },
  { id: 'descargas', label: 'Descargas' },
  { id: 'cola', label: 'Cola' },
  { id: 'kpis', label: 'KPIs' },
];

const FORMULARIO_VACIO = { nombreRol: '', descripcion: '', permisos: [] };

export default function GestionRoles() {
  const { rol, cargando: validandoSesion } = useAuth();
  const [roles, setRoles] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('true');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [vistaFormulario, setVistaFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarRoles = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const resultado = await obtenerRoles(filtroActivo === 'all' ? undefined : filtroActivo === 'true');
      setRoles(Array.isArray(resultado) ? resultado : []);
    } catch (errorCarga) {
      console.error(errorCarga);
      setError(errorCarga.message || 'No se pudieron cargar los perfiles.');
    } finally {
      setCargando(false);
    }
  }, [filtroActivo]);

  useEffect(() => { cargarRoles(); }, [cargarRoles]);

  if (validandoSesion) return <main className={styles.loading}>Validando sesión...</main>;
  if (rol !== 'administrador') {
    return (
      <main className={styles.denied}>
        <h1>Acceso restringido</h1>
        <p>Solo un administrador puede gestionar el catálogo de roles.</p>
        <Link href="/dashboard">Volver al tablero</Link>
      </main>
    );
  }

  const iniciarCreacion = () => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setVistaFormulario(true);
    setError('');
    setMensaje('');
  };

  const iniciarEdicion = (perfil) => {
    setEditando(perfil);
    setFormulario({
      nombreRol: perfil.nombreRol || perfil.nombre || '',
      descripcion: perfil.descripcion || '',
      permisos: perfil.permisos || [],
    });
    setVistaFormulario(true);
    setError('');
    setMensaje('');
  };

  const volverAlCatalogo = () => {
    setVistaFormulario(false);
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const cambiarPermiso = (permiso) => {
    setFormulario((actual) => ({
      ...actual,
      permisos: actual.permisos.includes(permiso)
        ? actual.permisos.filter((item) => item !== permiso)
        : [...actual.permisos, permiso],
    }));
  };

  const guardarRol = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      if (editando) await actualizarRol(editando._id, formulario);
      else await crearRol(formulario);
      setMensaje(editando ? 'Perfil actualizado correctamente.' : 'Perfil creado correctamente.');
      setFormulario(FORMULARIO_VACIO);
      setEditando(null);
      await cargarRoles();
      setVistaFormulario(false);
    } catch (errorGuardar) {
      console.error(errorGuardar);
      setError(errorGuardar.message || 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarDesactivacion = async (perfil) => {
    const nombre = perfil.nombreRol || perfil.nombre;
    if (!window.confirm(`¿Desactivar el perfil "${nombre}"?`)) return;
    setError('');
    setMensaje('');
    try {
      const resultado = await desactivarRol(perfil._id);
      setMensaje(resultado.mensaje || `El perfil ${nombre} fue desactivado.`);
      await cargarRoles();
    } catch (errorDesactivacion) {
      setError(errorDesactivacion.message || 'No se pudo desactivar el perfil.');
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <Link href="/dashboard" className={styles.backLink}>← Volver al tablero</Link>
          <span className={styles.adminBadge}>ADMINISTRADOR</span>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>GOBERNANZA Y ACCESOS</span>
            <h1>{vistaFormulario ? (editando ? 'Editar perfil' : 'Crear perfil') : 'Catálogo de roles'}</h1>
            <p>
              {vistaFormulario
                ? 'Configura el nombre, la descripción y los permisos del perfil.'
                : 'Define los perfiles y módulos que cada equipo puede utilizar.'}
            </p>
          </div>
          {vistaFormulario ? (
            <button type="button" className={styles.primaryButton} onClick={volverAlCatalogo}>
              ← Volver al catálogo
            </button>
          ) : (
            <button type="button" className={styles.primaryButton} onClick={iniciarCreacion}>
              <span aria-hidden="true">＋</span> Crear perfil
            </button>
          )}
        </section>

        {(error || mensaje) && (
          <div className={error ? styles.error : styles.success} role={error ? 'alert' : 'status'}>
            {error || mensaje}
          </div>
        )}

        {!vistaFormulario && <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>PERFILES DEL SISTEMA</span>
              <h2>Roles y permisos</h2>
            </div>
            <label className={styles.filter}>
              <span>Mostrar</span>
              <select value={filtroActivo} onChange={(event) => setFiltroActivo(event.target.value)}>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
                <option value="all">Todos</option>
              </select>
            </label>
          </div>

          {cargando ? (
            <div className={styles.empty}>Cargando perfiles...</div>
          ) : roles.length === 0 ? (
            <div className={styles.empty}>No hay roles en este filtro. Crea un perfil para comenzar.</div>
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Perfil</th><th>Permisos habilitados</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {roles.map((perfil) => (
                    <tr key={perfil._id}>
                      <td>
                        <strong>{perfil.nombreRol || perfil.nombre}</strong>
                        <span className={styles.description}>{perfil.descripcion || 'Sin descripción'}</span>
                      </td>
                      <td>
                        <div className={styles.permissionTags}>
                          {(perfil.permisos || []).length === 0
                            ? <span className={styles.noPermissions}>Sin permisos asignados</span>
                            : perfil.permisos.map((permiso) => (
                              <span className={styles.permissionTag} key={permiso}>{permiso}</span>
                            ))}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.status} ${perfil.activo !== false ? styles.active : styles.inactive}`}>
                          <i /> {perfil.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {perfil.activo !== false && (
                            <button type="button" className={styles.editButton} onClick={() => iniciarEdicion(perfil)}>
                              Editar
                            </button>
                          )}
                          {perfil.activo !== false && (
                            <button
                              type="button"
                              className={styles.deactivateButton}
                              onClick={() => manejarDesactivacion(perfil)}
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>}

        {vistaFormulario && <section className={styles.formPanel} aria-labelledby="form-title">
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>{editando ? 'ACTUALIZAR PERFIL' : 'NUEVO PERFIL'}</span>
              <h2 id="form-title">{editando ? `Editar ${editando.nombreRol || editando.nombre}` : 'Crear un rol'}</h2>
            </div>
            <button type="button" className={styles.cancelButton} onClick={volverAlCatalogo} disabled={guardando}>
              ← Volver al catálogo
            </button>
          </div>
          <form onSubmit={guardarRol}>
            <div className={styles.fields}>
              <label>
                Nombre del rol
                <input
                  value={formulario.nombreRol}
                  onChange={(event) => setFormulario({ ...formulario, nombreRol: event.target.value })}
                  minLength={2}
                  maxLength={60}
                  placeholder="Ej. Supervisor de Bahía"
                  required
                  disabled={guardando}
                />
              </label>
              <label>
                Descripción funcional
                <input
                  value={formulario.descripcion}
                  onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })}
                  maxLength={300}
                  placeholder="Describe las responsabilidades de este perfil"
                  disabled={guardando}
                />
              </label>
            </div>
            <fieldset className={styles.permissions}>
              <legend>Permisos por módulo</legend>
              <div className={styles.permissionOptions}>
                {MODULOS.map((modulo) => (
                  <label key={modulo.id} className={styles.permissionOption}>
                    <input
                      type="checkbox"
                      checked={formulario.permisos.includes(modulo.id)}
                      onChange={() => cambiarPermiso(modulo.id)}
                      disabled={guardando}
                    />
                    <span>{modulo.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className={styles.primaryButton} disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear perfil'}
            </button>
          </form>
        </section>}
      </div>
    </main>
  );
}
