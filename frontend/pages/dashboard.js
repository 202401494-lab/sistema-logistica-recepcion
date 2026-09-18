import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/rolePages.module.css';

// Configuración de la única pantalla principal del sistema.
// El rol cambia el tema visual y las acciones disponibles, pero no crea otra página.
const configuracionPorRol = {
  administrador: {
    titulo: 'Centro de Administración',
    descripcion: 'Acceso total al sistema',
    acciones: ['Gestionar usuarios', 'Configurar sistema'],
    clase: 'containerAdmin',
  },
  coordinador: {
    titulo: 'Centro de Coordinación',
    descripcion: 'Supervisión de operaciones',
    acciones: ['Gestionar citas', 'Consultar proveedores'],
    clase: 'containerCoordinador',
  },
  operador: {
    titulo: 'Centro Operativo',
    descripcion: 'Ejecución de tareas operativas',
    acciones: ['Registrar llegada', 'Consultar cola'],
    clase: 'containerOperador',
  },
};

export default function Dashboard() {
  // useAuth valida el token guardado en el navegador antes de mostrar información protegida.
  const { rol, cargando } = useAuth();

  // El fallback evita errores visuales si el token contiene un rol no configurado todavía.
  const configuracion = configuracionPorRol[rol] || configuracionPorRol.operador;

  // Mientras se valida la sesión se muestra un indicador y no el contenido del dashboard.
  if (cargando) {
    return (
      <div className={`${styles.loadingContainer} ${styles[configuracion.clase]}`}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Las acciones son botones visuales preparados para conectar después con los módulos reales.
  return (
    <main className={`${styles.container} ${styles[configuracion.clase]}`}>
      <section className={styles.card}>
        <span className={styles.badge} aria-hidden="true">{rol === 'administrador' ? 'A' : rol === 'coordinador' ? 'C' : 'O'}</span>
        <h1 className={styles.title}>Bienvenido, {rol.toUpperCase()}</h1>
        <p className={styles.subtitle}>{configuracion.titulo}</p>

        <div className={styles.content}>
          <p>{configuracion.descripcion}</p>
          <div className={styles.actions}>
            {configuracion.acciones.map((accion) => (
              // La clave permite que React identifique cada botón dentro de la lista.
              <button type="button" className={styles.actionButton} key={accion}>
                {accion}
              </button>
            ))}
          </div>
        </div>

        <LogoutButton />
      </section>
    </main>
  );
}
