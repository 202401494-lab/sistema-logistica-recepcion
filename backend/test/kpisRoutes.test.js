const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../routes/kpisRoutes');

test('restringe el endpoint KPI a coordinador y administrador', () => {
  const ruta = router.stack.find((capa) => capa.route?.path === '/kpis');
  assert.ok(ruta);
  assert.equal(ruta.route.methods.get, true);

  const autorizar = ruta.route.stack[1].handle;
  const respuesta = {
    statusCode: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let continuo = false;

  autorizar({ usuario: { rol: 'operador' } }, respuesta, () => { continuo = true; });
  assert.equal(respuesta.statusCode, 403);
  assert.equal(continuo, false);

  autorizar({ usuario: { rol: 'coordinador' } }, respuesta, () => { continuo = true; });
  assert.equal(continuo, true);
});