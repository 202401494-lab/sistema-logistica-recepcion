const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Evento = require('../models/Evento');

test('valida campos obligatorios y acciones permitidas para eventos', async () => {
  const evento = new Evento({
    usuarioId: new mongoose.Types.ObjectId(),
    usuarioCreacion: 'Operador',
    accion: 'LLEGADA_REGISTRADA',
  });

  await assert.doesNotReject(evento.validate());
  evento.accion = 'ACCION_NO_PERMITIDA';
  await assert.rejects(evento.validate(), { name: 'ValidationError' });
});

test('registra middleware para impedir actualizaciones y borrados físicos', () => {
  const hooks = Evento.schema.s.hooks._pres;

  assert.ok(hooks.has('findOneAndUpdate'));
  assert.ok(hooks.has('deleteMany'));
  assert.equal(Evento.collection.collectionName, 'eventos');
});