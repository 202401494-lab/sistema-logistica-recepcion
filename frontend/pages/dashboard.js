import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import ProveedorForm from '../components/ProveedorForm';
import PedidoForm from '../components/PedidoForm';
import PedidoList from '../components/PedidoList';
import { obtenerPedidos } from '../lib/api';
import styles from '../styles/dashboard.module.css';
import roleStyles from '../styles/rolePages.module.css';

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

/* Componente principal del dashboard que renderiza la interfaz según el rol del usuario */
export default function Dashboard() {
  const { rol, cargando } = useAuth();

  /* Estados para manejar la sección activa, proveedores, pedidos y carga de datos */
  const [seccionActiva, setSeccionActiva] = useState('resumen');
  const [proveedores, setProveedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const configuracion = configuracionPorRol[rol]
    || configuracionPorRol.operador;

  /* Función para cargar los pedidos desde el backend y actualizar el estado */
  const cargarPedidos = async () => {
    setCargandoPedidos(true);
    /* Llama a la función obtenerPedidos para traer los pedidos desde el backend */
    try {
      const datos = await obtenerPedidos();
      setPedidos(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoPedidos(false);
    }
  };

  useEffect(() => {
    if (rol === 'coordinador') {
      cargarPedidos();
    }
  }, [rol]);

  /* Función para manejar la creación de un nuevo proveedor y actualizar la lista de proveedores */
  const manejarProveedorCreado = (proveedorNuevo) => {
    setProveedores((actuales) => [
      ...actuales,
      proveedorNuevo,
    ]);
  };

  /* Función para manejar la creación de un nuevo pedido y actualizar la lista de pedidos */
  const manejarPedidoCreado = async () => {
    await cargarPedidos();
    setSeccionActiva('resumen');
  };

  /* Renderiza la interfaz de usuario según el estado de carga y el rol del usuario */
  if (cargando) {
    return (
      <main className={`
        ${roleStyles.loadingContainer}
        ${roleStyles[configuracion.clase]}
      `}
      >
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <p>Validando sesión...</p>
        </div>
      </main>
    );
  }

  /* Renderiza un mensaje de acceso restringido si el rol del usuario no es coordinador */
  if (rol !== 'coordinador') {
    return (
      <main className={`
        ${roleStyles.container}
        ${roleStyles[configuracion.clase]}
      `}
      >
        <section className={styles.restrictedCard}>
          <span className={styles.restrictedIcon}>🚫</span>
          <h2>Acceso restringido</h2>
          <p>
            Este módulo está disponible para el Coordinador Logístico.
          </p>
          <LogoutButton />
        </section>
      </main>
    );
  }

  /* Renderiza la interfaz principal del dashboard para el rol de coordinador */
  return (
    <main className={`
      ${roleStyles.container}
      ${roleStyles[configuracion.clase]}
    `}
    >
      <section className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <div>
            <span className={styles.eyebrow}>SISTEMA LOGÍSTICO</span>
            <h1>Centro de Coordinación</h1>
            <p>
              Gestiona proveedores y programa pedidos desde un solo lugar.
            </p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.roleBadge}>
              {rol.toUpperCase()}
            </span>
            <LogoutButton />
          </div>
        </header>

        <nav className={styles.navigation}>
          <button
            type="button"
            className={seccionActiva === 'resumen'
              ? styles.activeTab
              : styles.tab}
            onClick={() => setSeccionActiva('resumen')}
          >
            Resumen
          </button>

          <button
            type="button"
            className={seccionActiva === 'proveedor'
              ? styles.activeTab
              : styles.tab}
            onClick={() => setSeccionActiva('proveedor')}
          >
            Registrar proveedor
          </button>

          <button
            type="button"
            className={seccionActiva === 'pedido'
              ? styles.activeTab
              : styles.tab}
            onClick={() => setSeccionActiva('pedido')}
          >
            Agendar pedido
          </button>
        </nav>

        {seccionActiva === 'resumen' && (
          <>
            <section className={styles.heroCard}>
              <div style={{ width: '100%' }}>
                <div className={styles.sectionHeading} style={{ marginBottom: '16px' }}>
                  <div>
                    <span className={styles.cardLabel}>PANEL DEL COORDINADOR</span>
                    <h2>Últimos pedidos programados</h2>
                  </div>
                  {/* Puedes colocar un enlace o botón rápido para ir a la pestaña completa */}
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setPestanaActiva('pedidos')}
                  >
                    Ver todos
                  </button>
                </div>

                {/* Si hay pedidos, muestra los últimos 2 o 3 */}
                {pedidos && pedidos.length > 0 ? (
                  <div className={styles.ordersList}>
                    {pedidos.slice(0, 3).map((pedido) => (
                      <div key={pedido.id || pedido._id} className={styles.orderItem}>
                        <div>
                          <strong>Pedido #{pedido.numeroPedido || pedido.id}</strong>
                          <span>Proveedor: {pedido.proveedorNombre || pedido.proveedor}</span>
                        </div>
                        <div className={styles.orderDetails}>
                          <span>{pedido.fecha} — {pedido.horario}</span>
                          <span className={styles.statusBadge}>Programado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                    No hay actividad reciente. Los pedidos que agendes aparecerán aquí.
                  </p>
                )}
              </div>
            </section>

            <PedidoList
              pedidos={pedidos}
              cargando={cargandoPedidos}
              onActualizar={cargarPedidos}
            />
          </>
        )}

        {seccionActiva === 'proveedor' && (
          <ProveedorForm
            onProveedorCreado={manejarProveedorCreado}
          />
        )}

        {seccionActiva === 'pedido' && (
          <PedidoForm
            proveedores={proveedores}
            onPedidoCreado={manejarPedidoCreado}
          />
        )}
      </section>
    </main>
  );
}