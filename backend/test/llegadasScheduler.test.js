const test = require('node:test');
const assert = require('node:assert/strict');
const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');
const actualizarEstadosLlegadas = require('../services/llegadasScheduler');
const { CLAVE_TOLERANCIA_LLEGADA, ESTADOS_PUNTUALIDAD } = require('../services/clasificacionLlegada');

test('libera anticipados y marca ausentes al cumplirse la tolerancia', async (t) => {
  const updateManyOriginal = Pedido.updateMany;
  const findOneOriginal = Parametro.findOne;
  const llamadas = [];
  const ahora = new Date('2026-01-01T12:00:00.000Z');

  Pedido.updateMany = async (...args) => {
    llamadas.push(args);
    return { modifiedCount: 1 };
  };
  Parametro.findOne = async (filtro) => {
    assert.deepEqual(filtro, { clave: CLAVE_TOLERANCIA_LLEGADA });
    return { valor: 15 };
  };
  t.after(() => {
    Pedido.updateMany = updateManyOriginal;
    Parametro.findOne = findOneOriginal;
  });

  await actualizarEstadosLlegadas(ahora);

  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[0][0].enEspera, true);
  assert.equal(llamadas[0][1].$set.enEspera, false);
  assert.equal(llamadas[1][0].fechaHoraLlegadaReal.$exists, false);
  assert.equal(llamadas[1][0].finVentana.$lte.toISOString(), '2026-01-01T11:45:00.000Z');
  assert.equal(llamadas[1][1].$set.estadoPuntualidad, ESTADOS_PUNTUALIDAD.AUSENTE);
});

test('no marca ausencias automáticamente sin una tolerancia configurada', async (t) => {
  const updateManyOriginal = Pedido.updateMany;
  const findOneOriginal = Parametro.findOne;
  let cantidadActualizaciones = 0;

  Pedido.updateMany = async () => {
    cantidadActualizaciones += 1;
    return { modifiedCount: 0 };
  };
  Parametro.findOne = async () => null;
  t.after(() => {
    Pedido.updateMany = updateManyOriginal;
    Parametro.findOne = findOneOriginal;
  });

  await actualizarEstadosLlegadas(new Date('2026-01-01T12:00:00.000Z'));

  assert.equal(cantidadActualizaciones, 1);
});