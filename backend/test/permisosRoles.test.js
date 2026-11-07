const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MODULOS,
  PERMISOS_PREDETERMINADOS,
  obtenerPermisosRol,
  obtenerPermisosUsuario,
} = require('../services/permisosRoles');

test('solo acepta los módulos declarados y agrega permisos de roles activos', () => {
  const usuario = {
    roles: [
      { nombreRol: 'coordinador', permisos: ['pedidos', 'cola'] },
      { nombreRol: 'personalizado', permisos: ['roles', 'usuarios'] },
      { nombreRol: 'otro', permisos: ['gateways'], activo: false },
    ],
  };

  assert.deepEqual(obtenerPermisosUsuario(usuario), ['pedidos', 'cola', 'roles', 'usuarios']);
  assert.deepEqual(PERMISOS_PREDETERMINADOS.administrador, MODULOS);
});

test('mantiene los permisos vacíos de roles personalizados y aplica defaults a roles legacy', () => {
  assert.deepEqual(obtenerPermisosRol({ nombre: 'operador' }), PERMISOS_PREDETERMINADOS.operador);
  assert.deepEqual(obtenerPermisosRol({ nombreRol: 'personalizado', permisos: [] }), []);
});
