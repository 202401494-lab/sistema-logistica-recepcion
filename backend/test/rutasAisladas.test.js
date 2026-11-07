const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const rolesRoutes = require('../routes/rolesRoutes');
const colaRoutes = require('../routes/colaRoutes');

const verificarRutaNoProtegidaPorRutasHermanas = async (t, router) => {
  const app = express();
  app.use('/api', router);
  app.get('/api/estado', (_req, res) => res.sendStatus(204));
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const respuesta = await fetch(`http://127.0.0.1:${server.address().port}/api/estado`);
  assert.equal(respuesta.status, 204);
};

test('la autenticación de roles no protege rutas hermanas del API', async (t) => {
  await verificarRutaNoProtegidaPorRutasHermanas(t, rolesRoutes);
});

test('el permiso de cola solo se aplica a sus propios endpoints', async (t) => {
  await verificarRutaNoProtegidaPorRutasHermanas(t, colaRoutes);
});
