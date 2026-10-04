import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import ProveedorForm from '../components/ProveedorForm';
import ProveedorList from '../components/ProveedorList';
import PedidoForm from '../components/PedidoForm';
import PedidoList from '../components/PedidoList';
import ResumenPedidosCard from '../components/ResumenPedidosCard';
import ModalTodosPedidos from '../components/ModalTodosPedidos';
import TableroGateways from '../components/TableroGateways'; // <-- IMPORTACIÓN AGREGADA
import Sidebar from '../components/Sidebar';
import { obtenerPedidos, obtenerProveedores } from '../lib/api';
import styles from '../styles/dashboard.module.css';
import roleStyles from '../styles/rolePages.module.css';

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
  const { rol, cargando } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState('resumen');
  const [proveedores, setProveedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [mostrarModalTodos, setMostrarModalTodos] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);

  // Detectar si estamos en móvil para iniciar colapsado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarColapsado(true);
    }
  }, []);

  const configuracion = configuracionPorRol[rol] || configuracionPorRol.operador;

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

  const manejarProveedorCreado = (proveedorNuevo) => {
    setProveedores((actuales) => [...actuales, proveedorNuevo]);
  };

  const manejarPedidoCreado = async () => {
    await cargarPedidos();
    setSeccionActiva('resumen');
  };

  if (cargando) {
    return (
      <main className={`${roleStyles.loadingContainer} ${roleStyles[configuracion.clase]}`}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <p>Validando sesión...</p>
        </div>
      </main>
    );
  }

  const rolesPermitidos = ['coordinador', 'administrador', 'operador'];

  if (!rolesPermitidos.includes(rol)) {
    return (
      <main className={`${roleStyles.container} ${roleStyles[configuracion.clase]}`}>
        <section className={styles.restrictedCard}>
          <span className={styles.restrictedIcon}>🚫</span>
          <h2>Acceso restringido</h2>
          <p>No tienes los permisos necesarios para acceder a este módulo.</p>
          <LogoutButton />
        </section>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
      <Sidebar
        rol={rol}
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        colapsado={sidebarColapsado}
        setColapsado={setSidebarColapsado}
      />

      <main
        className={`${roleStyles.container} ${roleStyles[configuracion.clase]} ${styles.mainContent}`}
        data-colapsado={sidebarColapsado}
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

          {seccionActiva === 'resumen' && (
            <>
              <ResumenPedidosCard
                pedidos={pedidos}
                proveedores={proveedores}
                onVerTodos={() => setMostrarModalTodos(true)}
              />

              <PedidoList
                pedidos={pedidos}
                proveedores={proveedores}
                cargando={cargandoPedidos}
                onActualizar={cargarPedidos}
              />
            </>
          )}

          {seccionActiva === 'proveedor' && (
            <ProveedorForm onProveedorCreado={manejarProveedorCreado} />
          )}

          {seccionActiva === 'listaProveedores' && (
            <ProveedorList
              proveedores={proveedores}
              onActualizar={cargarProveedores}
            />
          )}

          {seccionActiva === 'pedido' && (
            <PedidoForm
              proveedores={proveedores}
              onPedidoCreado={manejarPedidoCreado}
            />
          )}

          {/* Tablero de Gateways */}
          {seccionActiva === 'gateways' && (
            <TableroGateways
              pedidosEnCola={pedidos}
              onActualizarDatos={cargarPedidos}
              esAdmin={rol === 'administrador'}
            />
          )}
        </section>

        {mostrarModalTodos && (
          <ModalTodosPedidos
            pedidos={pedidos}
            proveedores={proveedores}
            onClose={() => setMostrarModalTodos(false)}
          />
        )}
      </main>
    </div>
  );
}