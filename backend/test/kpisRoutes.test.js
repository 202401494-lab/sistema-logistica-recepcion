const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../routes/kpisRoutes');
const Usuario = require('../models/Usuario');

test('restringe el endpoint KPI según los permisos activos del usuario', async (t) => {
  const ruta = router.stack.find((capa) => capa.route?.path === '/kpis');
  assert.ok(ruta);
  assert.equal(ruta.route.methods.get, true);
  const autorizarKpis = ruta.route.stack[1].handle;

  const findOneOriginal = Usuario.findOne;
  t.after(() => { Usuario.findOne = findOneOriginal; });
  let rolesUsuario = [];
  Usuario.findOne = () => ({
    populate: async () => ({ roles: rolesUsuario }),
  });
  const crearRespuesta = () => ({
    statusCode: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  });

  rolesUsuario = [{ nombreRol: 'operador', permisos: ['pedidos'] }];
  const respuestaDenegada = crearRespuesta();
  let continuo = false;
  await autorizarKpis(
    { usuario: { id: 'usuario-1' } },
    respuestaDenegada,
    () => { continuo = true; },
  );
  assert.equal(respuestaDenegada.statusCode, 403);
  assert.equal(continuo, false);

  rolesUsuario = [{ nombreRol: 'auditor', permisos: ['kpis'] }];
  const respuestaPermitida = crearRespuesta();
  await autorizarKpis(
    { usuario: { id: 'usuario-1' } },
    respuestaPermitida,
    () => { continuo = true; },
  );
  assert.equal(respuestaPermitida.statusCode, null);
  assert.equal(continuo, true);
});