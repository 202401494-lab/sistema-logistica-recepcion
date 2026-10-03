const test = require('node:test');
const assert = require('node:assert/strict');
const Contador = require('../models/Contador');
const Parametro = require('../models/Parametro');
const Pedido = require('../models/Pedido');
const generarNumeroPedido = require('../services/numeroPedido');

test('genera el numero de pedido con el equipo y el correlativo de nueve digitos', async (t) => {
  const findOneOriginal = Parametro.findOne;
  const aggregateOriginal = Pedido.aggregate;
  const updateOneOriginal = Contador.updateOne;
  const findOneAndUpdateOriginal = Contador.findOneAndUpdate;
  Parametro.findOne = async (filtro) => {
    assert.equal(filtro.clave.test('NUMERO_EQUIPO'), true);
    return { valor: '04' };
  };
  Pedido.aggregate = async () => [{ ultimo: 8 }];
  Contador.updateOne = async (filtro, cambios, opciones) => {
    assert.equal(filtro.clave, 'PED-EQUI04');
    assert.equal(cambios.$setOnInsert.secuencia, 8);
    assert.equal(opciones.upsert, true);
  };
  Contador.findOneAndUpdate = async (filtro, cambios) => {
    assert.equal(filtro.clave, 'PED-EQUI04');
    assert.equal(cambios.$inc.secuencia, 1);
    return { secuencia: 9 };
  };
  t.after(() => {
    Parametro.findOne = findOneOriginal;
    Pedido.aggregate = aggregateOriginal;
    Contador.updateOne = updateOneOriginal;
    Contador.findOneAndUpdate = findOneAndUpdateOriginal;
  });

  assert.equal(await generarNumeroPedido(), 'PED-EQUI04-000000009');
});

test('rechaza generar pedidos si numero_equipo no está configurado', async (t) => {
  const findOneOriginal = Parametro.findOne;
  Parametro.findOne = async () => null;
  t.after(() => {
    Parametro.findOne = findOneOriginal;
  });

  await assert.rejects(generarNumeroPedido(), { status: 500 });
});