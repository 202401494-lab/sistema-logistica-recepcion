const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Descarga = require('../models/Descarga');
const Evento = require('../models/Evento');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const reevaluarCola = require('../services/reevaluarCola');

test('promueve el siguiente pedido compatible e inserta eventos de asignación e inicio', async (t) => {
  const pedidoFindOriginal = Pedido.findOne;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const descargaCreateOriginal = Descarga.create;
  const eventoSaveOriginal = Evento.prototype.save;
  const pedidoId = new mongoose.Types.ObjectId();
  const gatewayId = new mongoose.Types.ObjectId();
  const usuarioId = new mongoose.Types.ObjectId();
  const eventos = [];
  const pedidoEnCola = { _id: pedidoId, estado: 'EN COLA' };

  Pedido.findOne = () => ({
    sort() { return this; },
    session: async () => pedidoEnCola,
  });
  Pedido.findOneAndUpdate = async () => ({ ...pedidoEnCola, estado: 'DESCARGANDO' });
  Gateway.findOneAndUpdate = async () => ({
    _id: gatewayId,
    estado: 'OCUPADO',
    tipoCargaPermitida: 'general',
  });
  Descarga.create = async ([datos]) => [{ ...datos, _id: new mongoose.Types.ObjectId() }];
  Evento.prototype.save = async function guardarEventoPrueba() {
    eventos.push(this.accion);
    return this;
  };
  t.after(() => {
    Pedido.findOne = pedidoFindOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
    Descarga.create = descargaCreateOriginal;
    Evento.prototype.save = eventoSaveOriginal;
  });

  const resultado = await reevaluarCola({
    gateway: { _id: gatewayId, tipoCargaPermitida: 'general' },
    usuarioId,
    usuario: 'Operador',
    session: {},
  });

  assert.equal(resultado.pedido.estado, 'DESCARGANDO');
  assert.equal(resultado.gateway.estado, 'OCUPADO');
  assert.equal(resultado.descarga.pedidoId, pedidoId);
  assert.deepEqual(eventos, ['GATEWAY_ASIGNADO', 'DESCARGADA_INICIADA']);
});