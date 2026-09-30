import { useState } from 'react';
import { actualizarProveedor, inactivarProveedor } from '../lib/api';
import styles from '../styles/pedidoList.module.css';

export default function ProveedorList({ proveedores = [], onActualizar }) {
    const [proveedorAEditar, setProveedorAEditar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    // Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('activos');

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 5;

    // Formulario para editar
    const [formEditar, setFormEditar] = useState({
        razonSocial: '',
        identificacionTributaria: '',
        categoria: 'general',
        contactoNombre: '',
        telefono: '',
        emailContacto: ''
    });

    // Filtrado de proveedores
    const proveedoresFiltrados = proveedores.filter((prov) => {
        // Filtro por Estado (activo: true/false)
        const estaActivo = prov.activo !== false;
        if (filtroEstado === 'activos' && !estaActivo) return false;
        if (filtroEstado === 'inactivos' && estaActivo) return false;

        // Filtro por Categoría
        if (filtroCategoria !== 'todos' && prov.categoria !== filtroCategoria) return false;

        return true;
    });

    // Cálculo de Paginación
    const totalPaginas = Math.ceil(proveedoresFiltrados.length / elementosPorPagina) || 1;
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const proveedoresPaginados = proveedoresFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

    const irAPaginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const irAPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    const abrirEdicion = (prov) => {
        setProveedorAEditar(prov);
        setFormEditar({
            razonSocial: prov.razonSocial || '',
            identificacionTributaria: prov.identificacionTributaria || '',
            categoria: prov.categoria || 'general',
            contactoNombre: prov.contactoNombre || '',
            telefono: prov.telefono || '',
            emailContacto: prov.emailContacto || ''
        });
    };

    const manejarInactivar = async (id, razonSocial) => {
        if (!window.confirm(`¿Estás segura de que deseas inactivar al proveedor "${razonSocial}"?`)) return;

        setProcesando(true);
        try {
            await inactivarProveedor(id);
            if (onActualizar) await onActualizar();
        } catch (error) {
            alert(error.message || 'Error al inactivar el proveedor');
        } finally {
            setProcesando(false);
        }
    };

    const manejarGuardarEdicion = async (e) => {
        e.preventDefault();
        setProcesando(true);
        try {
            const id = proveedorAEditar._id || proveedorAEditar.id;
            await actualizarProveedor(id, formEditar);
            setProveedorAEditar(null);
            if (onActualizar) await onActualizar();
        } catch (error) {
            alert(error.message || 'Error al actualizar el proveedor');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className={styles.card} style={{ marginTop: '24px' }}>
            {/* Encabezado */}
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>CATÁLOGO LOGÍSTICO</span>
                    <h2 className={styles.title}>Gestión de Proveedores</h2>
                </div>

                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '12px' }}>
                    Total: {proveedoresFiltrados.length}
                </span>
            </div>

            {/* Barra de Filtros */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Estado:
                    </label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    >
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Categoría:
                    </label>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaActual(1); }}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    >
                        <option value="todos">Todas las categorías</option>
                        <option value="construcción">Construcción</option>
                        <option value="general">General</option>
                    </select>
                </div>
            </div>

            {/* Lista de Proveedores */}
            <div className={styles.list}>
                {proveedoresPaginados.length === 0 ? (
                    <p className={styles.empty}>No se encontraron proveedores.</p>
                ) : (
                    proveedoresPaginados.map((prov) => {
                        const id = prov._id || prov.id;
                        const esActivo = prov.activo !== false;

                        return (
                            <div key={id} className={styles.itemCard}>
                                <div className={styles.itemMain}>
                                    <div>
                                        <h3 className={styles.codigo}>{prov.razonSocial}</h3>
                                        <p className={styles.proveedor}>
                                            NIT / Identificación: <strong>{prov.identificacionTributaria}</strong> | Contacto: {prov.contactoNombre || 'N/A'} ({prov.telefono || 'Sin tel.'})
                                        </p>
                                    </div>

                                    <div className={styles.itemMeta}>
                                        <span className={styles.area} style={{ textTransform: 'capitalize' }}>
                                            {prov.categoria || 'General'}
                                        </span>

                                        <span
                                            className={styles.badgeState}
                                            style={{
                                                backgroundColor: esActivo ? '#dcfce7' : '#fee2e2',
                                                color: esActivo ? '#166534' : '#991b1b'
                                            }}
                                        >
                                            {esActivo ? 'ACTIVO' : 'INACTIVO'}
                                        </span>

                                        <div className={styles.actions}>
                                            <button
                                                type="button"
                                                className={styles.btnIcon}
                                                onClick={() => abrirEdicion(prov)}
                                                title="Editar proveedor"
                                            >
                                                ✏️
                                            </button>

                                            {esActivo && (
                                                <button
                                                    type="button"
                                                    className={`${styles.btnIcon} ${styles.btnDelete}`}
                                                    onClick={() => manejarInactivar(id, prov.razonSocial)}
                                                    title="Inactivar proveedor"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Paginación */}
            {proveedoresFiltrados.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={irAPaginaAnterior}
                            disabled={paginaActual === 1}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: paginaActual === 1 ? '#f9fafb' : '#ffffff',
                                color: paginaActual === 1 ? '#9ca3af' : '#374151',
                                cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            ← Anterior
                        </button>
                        <button
                            type="button"
                            onClick={irAPaginaSiguiente}
                            disabled={paginaActual === totalPaginas}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: paginaActual === totalPaginas ? '#f9fafb' : '#ffffff',
                                color: paginaActual === totalPaginas ? '#9ca3af' : '#374151',
                                cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Edición de Proveedor */}
            {proveedorAEditar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Editar Proveedor</h3>
                        <form onSubmit={manejarGuardarEdicion} className={styles.formModal}>
                            <label>
                                Razón Social:
                                <input
                                    type="text"
                                    value={formEditar.razonSocial}
                                    onChange={(e) => setFormEditar({ ...formEditar, razonSocial: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Identificación Tributaria (NIT):
                                <input
                                    type="text"
                                    value={formEditar.identificacionTributaria}
                                    onChange={(e) => setFormEditar({ ...formEditar, identificacionTributaria: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Categoría:
                                <select
                                    value={formEditar.categoria}
                                    onChange={(e) => setFormEditar({ ...formEditar, categoria: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="construcción">Construcción</option>
                                </select>
                            </label>

                            <label>
                                Nombre de Contacto:
                                <input
                                    type="text"
                                    value={formEditar.contactoNombre}
                                    onChange={(e) => setFormEditar({ ...formEditar, contactoNombre: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Teléfono:
                                <input
                                    type="text"
                                    value={formEditar.telefono}
                                    onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Email de Contacto:
                                <input
                                    type="email"
                                    value={formEditar.emailContacto}
                                    onChange={(e) => setFormEditar({ ...formEditar, emailContacto: e.target.value })}
                                    required
                                />
                            </label>

                            <div className={styles.modalButtons}>
                                <button
                                    type="button"
                                    onClick={() => setProveedorAEditar(null)}
                                    className={styles.btnCancel}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={procesando}
                                    className={styles.btnSave}
                                >
                                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}