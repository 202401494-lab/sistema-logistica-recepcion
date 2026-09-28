import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import ProveedorForm from '../components/ProveedorForm';
import PedidoForm from '../components/PedidoForm';
import PedidoList from '../components/PedidoList';
import { obtenerPedidos, obtenerProveedores } from '../lib/api';
import styles from '../styles/dashboard.module.css';
import roleStyles from '../styles/rolePages.module.css';

// Configuración de la única pantalla principal del sistema.
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
  const [mostrarModalTodos, setMostrarModalTodos] = useState(false);

  const configuracion = configuracionPorRol[rol] || configuracionPorRol.operador;

  /* Función para cargar los pedidos desde el backend y actualizar el estado */
  const cargarPedidos = async () => {
    setCargandoPedidos(true);
    try {
      const datos = await obtenerPedidos();
      setPedidos(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoPedidos(false);
    }
  };

  /* Carga los proveedores desde MongoDB al abrir el módulo. */
  const cargarProveedores = async () => {
    try {
      const datos = await obtenerProveedores();
      setProveedores(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (rol === 'coordinador' || rol === 'administrador' || rol === 'operador') {
      cargarProveedores();
      cargarPedidos();
    }
  }, [rol]);

  /* Función para manejar la creación de un nuevo proveedor */
  const manejarProveedorCreado = (proveedorNuevo) => {
    setProveedores((actuales) => [
      ...actuales,
      proveedorNuevo,
    ]);
  };

  /* Función para manejar la creación de un nuevo pedido */
  const manejarPedidoCreado = async () => {
    await cargarPedidos();
    setSeccionActiva('resumen');
  };

  /* Función para obtener el nombre del proveedor de un pedido */
  const obtenerNombreProveedor = (p) => {
    if (!p) return 'No especificado';

    // 1. Si viene como objeto poblado por Mongoose { _id, nombre, razonSocial }
    if (typeof p.proveedorId === 'object' && p.proveedorId !== null) {
      return p.proveedorId.nombre || p.proveedorId.razonSocial || p.proveedorId.empresa || 'No especificado';
    }
    if (typeof p.proveedor === 'object' && p.proveedor !== null) {
      return p.proveedor.nombre || p.proveedor.razonSocial || p.proveedor.empresa || 'No especificado';
    }

    // 2. Si viene como texto plano directo en el pedido
    if (typeof p.proveedorNombre === 'string' && p.proveedorNombre.trim()) return p.proveedorNombre;
    if (typeof p.proveedor === 'string' && p.proveedor.trim().length > 0 && !p.proveedor.startsWith('6')) {
      return p.proveedor;
    }

    // 3. Si el ID de MongoDB está guardado en proveedorId, proveedor o id
    const idBuscado = String(p.proveedorId?._id || p.proveedorId || p.proveedor || '');
    if (idBuscado && Array.isArray(proveedores) && proveedores.length > 0) {
      const encontrado = proveedores.find((prov) => String(prov._id || prov.id) === idBuscado);
      if (encontrado) {
        return encontrado.nombre || encontrado.razonSocial || encontrado.nombreEmpresa || encontrado.categoria || 'No especificado';
      }
    }

    // 4. Si el pedido trae una categoría o descripción directa
    if (p.categoria) return p.categoria;
    if (p.descripcion) return p.descripcion;

    return 'No especificado';
  };

  /* Función para formatear la fecha y hora de un pedido, considerando diferentes campos posibles */
  const obtenerFechaFormateada = (p) => {
    const fechaBase = p.fechaHoraProgramada || p.fecha || p.createdAt;
    if (!fechaBase) return 'Sin fecha';
    try {
      const date = new Date(fechaBase);
      return `${date.toLocaleDateString()} ${p.horario ? '— ' + p.horario : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return p.fecha || 'Sin fecha';
    }
  };

  /* Renderiza la interfaz según el estado de carga */
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

  /* Roles con acceso al Dashboard */
  const rolesPermitidos = ['coordinador', 'administrador', 'operador'];

  /* Muestra mensaje de restricción únicamente si el rol no pertenece a los permitidos */
  if (!rolesPermitidos.includes(rol)) {
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
            No tienes los permisos necesarios para acceder a este módulo.
          </p>
          <LogoutButton />
        </section>
      </main>
    );
  }

  /* Renderiza la interfaz principal del dashboard */
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
            <h1>{configuracion.titulo}</h1>
            <p>{configuracion.descripcion}</p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.roleBadge}>
              {(rol || '').toUpperCase()}
            </span>
            <LogoutButton />
          </div>
        </header>

        <nav className={styles.navigation}>
          {rol === 'coordinador' && (
            <>
              <button
                type="button"
                className={seccionActiva === 'resumen' ? styles.activeTab : styles.tab}
                onClick={() => setSeccionActiva('resumen')}
              >
                Resumen
              </button>

              <button
                type="button"
                className={seccionActiva === 'proveedor' ? styles.activeTab : styles.tab}
                onClick={() => setSeccionActiva('proveedor')}
              >
                Registrar proveedor
              </button>

              <button
                type="button"
                className={seccionActiva === 'pedido' ? styles.activeTab : styles.tab}
                onClick={() => setSeccionActiva('pedido')}
              >
                Agendar pedido
              </button>
            </>
          )}

          {/* Botón de caseta visible para Operador y Administrador (y Coordinador si navega) */}
          <button
            type="button"
            className={styles.tab}
            onClick={() => window.location.href = '/caseta'}
          >
            Caseta
          </button>
        </nav>

        {seccionActiva === 'resumen' && (
          <>
            <section className={styles.heroCard}>
              <div style={{ width: '100%' }}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.cardLabel}>PANEL GENERAL</span>
                    <h2>Últimos pedidos programados</h2>
                  </div>
                  {pedidos && pedidos.length > 0 && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setMostrarModalTodos(true)}
                    >
                      Ver todos ({pedidos.length})
                    </button>
                  )}
                </div>

                {pedidos && pedidos.length > 0 ? (
                  <div className={styles.ordersList}>
                    {pedidos.slice(0, 3).map((pedido) => (
                      <div key={pedido.id || pedido._id} className={styles.orderItem}>
                        <div>
                          <strong>Pedido #{pedido.numeroPedido || pedido.codigo || pedido._id}</strong>
                          <div className={styles.orderMeta}>
                            <span className={styles.orderVendorName}>
                              {obtenerNombreProveedor(pedido)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.orderDetails}>
                          <span className={styles.orderDateText}>
                            {obtenerFechaFormateada(pedido)}
                          </span>
                          <span className={styles.statusBadge}>
                            {pedido.estado || 'PROGRAMADO'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.orderMeta}>
                    No hay actividad reciente. Los pedidos que se agenden aparecerán aquí.
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

      {/* Modal Emergente con la lista completa de pedidos */}
      {mostrarModalTodos && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Todos los pedidos programados</h3>
                <p>Total de registros: {pedidos.length}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setMostrarModalTodos(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalList}>
                {pedidos.map((pedido) => (
                  <div key={pedido.id || pedido._id} className={styles.modalCard}>
                    <div>
                      <strong className={styles.modalCardTitle}>
                        Pedido #{pedido.numeroPedido || pedido.codigo || pedido._id}
                      </strong>
                      <div className={styles.modalCardSub}>
                        <span className={styles.orderVendorName}>{obtenerNombreProveedor(pedido)}</span>
                      </div>
                      <div className={styles.modalCardDate}>
                        {obtenerFechaFormateada(pedido)}
                      </div>
                    </div>

                    <span className={styles.modalBadge}>
                      {pedido.estado || 'PROGRAMADO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.primaryButton}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => setMostrarModalTodos(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}