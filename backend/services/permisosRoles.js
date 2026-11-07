const MODULOS = [
  'usuarios',
  'roles',
  'proveedores',
  'pedidos',
  'gateways',
  'descargas',
  'cola',
  'kpis',
];

const PERMISOS_PREDETERMINADOS = {
  administrador: [...MODULOS],
  coordinador: ['proveedores', 'pedidos', 'gateways', 'descargas', 'cola', 'kpis'],
  operador: ['pedidos', 'gateways', 'descargas', 'cola'],
};

const obtenerNombreRol = (rol) => rol?.nombreRol || rol?.nombre || '';

const obtenerPermisosRol = (rol) => {
  const predeterminados = PERMISOS_PREDETERMINADOS[obtenerNombreRol(rol)];
  if (Array.isArray(rol?.permisos) && rol.permisos.length > 0) return rol.permisos;
  if (!Array.isArray(rol?.permisos) || rol?.$isDefault?.('permisos')) return predeterminados || [];
  return rol.permisos;
};

const obtenerPermisosUsuario = (usuario) => [...new Set(
  (usuario?.roles || []).filter((rol) => rol && rol.activo !== false).flatMap(obtenerPermisosRol),
)];

module.exports = {
  MODULOS,
  PERMISOS_PREDETERMINADOS,
  obtenerNombreRol,
  obtenerPermisosRol,
  obtenerPermisosUsuario,
};
