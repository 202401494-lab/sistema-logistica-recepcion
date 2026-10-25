const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const Evento = require('../models/Evento');
const {
  crearGateway,
  actualizarGateway,
  inactivarGateway,
  iniciarDescarga,
  finalizarDescarga,
} = require('../controllers/gatewaysController');

const crearRespuesta = () => ({
  statusCode: null,
  body: null,
  status(codigo) {
    this.statusCode = codigo;
    return this;
  },
  json(contenido) {
    this.body = contenido;
    return this;
  },
});

test('rechaza asignar carga general al gateway 5', async (t) => {
  const createOriginal = Gateway.create;
  Gateway.create = async () => assert.fail('No debe crear un gateway incompatible');
  t.after(() => {
    Gateway.create = createOriginal;
  });
  const respuesta = crearRespuesta();

  await crearGateway({ body: { numeroGateway: 5, tipoCargaPermitida: 'general' } }, respuesta);

  assert.equal(respuesta.statusCode, 400);
});

test('rechaza cambiar el estado de un gateway ocupado', async (t) => {
  const findOneOriginal = Gateway.findOne;
  const findOneAndUpdateOriginal = Gateway.findOneAndUpdate;
  Gateway.findOne = async () => ({
    estado: 'OCUPADO',
    numeroGateway: 1,
    tipoCargaPermitida: 'general',
  });
  Gateway.findOneAndUpdate = async () => assert.fail('No debe actualizar un gateway ocupado');
  t.after(() => {
    Gateway.findOne = findOneOriginal;
    Gateway.findOneAndUpdate = findOneAndUpdateOriginal;
  });
  const respuesta = crearRespuesta();

  await actualizarGateway({
    params: { id: new mongoose.Types.ObjectId().toString() },
    body: { estado: 'FUERA DE SERVICIO' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 400);
});

test('rechaza el borrado lógico de un gateway ocupado', async (t) => {
  const findOneOriginal = Gateway.findOne;
  const findOneAndUpdateOriginal = Gateway.findOneAndUpdate;
  Gateway.findOneAndUpdate = async () => null;
  Gateway.findOne = async () => ({ estado: 'OCUPADO' });
  t.after(() => {
    Gateway.findOne = findOneOriginal;
    Gateway.findOneAndUpdate = findOneAndUpdateOriginal;
  });
  const respuesta = crearRespuesta();

  await inactivarGateway({
    params: { id: new mongoose.Types.ObjectId().toString() },
    usuario: { nombreCompleto: 'Admin' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 400);
});

test('rechaza iniciar una descarga con tipo de producto incompatible', async (t) => {
  const pedidoFindOriginal = Pedido.findOne;
  const gatewayFindOriginal = Gateway.findOne;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const pedidoId = new mongoose.Types.ObjectId().toString();
  const gatewayId = new mongoose.Types.ObjectId().toString();
  Pedido.findOne = async () => ({ estado: 'EN COLA', tipoProducto: 'construcción' });
  Gateway.findOne = async () => ({
    numeroGateway: 1,
    tipoCargaPermitida: 'general',
    estado: 'LIBRE',
  });
  Gateway.findOneAndUpdate = async () => assert.fail('No debe ocupar un gateway incompatible');
  t.after(() => {
    Pedido.findOne = pedidoFindOriginal;
    Gateway.findOne = gatewayFindOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
  });
  const respuesta = crearRespuesta();

  await iniciarDescarga({
    body: { pedidoId, gatewayId },
    usuario: { id: new mongoose.Types.ObjectId().toString() },
  }, respuesta);

  assert.equal(respuesta.statusCode, 400);
});

test('ocupa el gateway y registra la descarga para un pedido compatible', async (t) => {
  const pedidoFindOriginal = Pedido.findOne;
  const gatewayFindOriginal = Gateway.findOne;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const descargaCreateOriginal = Descarga.create;
  const eventoSaveOriginal = Evento.prototype.save;
  const startSessionOriginal = mongoose.startSession;
  const pedidoId = new mongoose.Types.ObjectId().toString();
  const gatewayId = new mongoose.Types.ObjectId().toString();
  const operadorId = new mongoose.Types.ObjectId().toString();
  let datosDescarga;
  Pedido.findOne = async () => ({ estado: 'EN COLA', tipoProducto: 'general' });
  Gateway.findOne = async () => ({
    numeroGateway: 1,
    tipoCargaPermitida: 'general',
    estado: 'LIBRE',
  });
  Gateway.findOneAndUpdate = async () => ({ _id: gatewayId, estado: 'OCUPADO' });
  Pedido.findOneAndUpdate = async () => ({ _id: pedidoId, estado: 'DESCARGANDO' });
  Descarga.create = async (datos) => {
    datosDescarga = datos[0];
    return [{ ...datos[0], _id: 'descarga-id' }];
  };
  Evento.prototype.save = async function guardarEventoPrueba() { return this; };
  mongoose.startSession = async () => ({
    withTransaction: async (operacion) => operacion({}),
    endSession: async () => {},
  });
  t.after(() => {
    Pedido.findOne = pedidoFindOriginal;
    Gateway.findOne = gatewayFindOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Descarga.create = descargaCreateOriginal;
    Evento.prototype.save = eventoSaveOriginal;
    mongoose.startSession = startSessionOriginal;
  });
  const respuesta = crearRespuesta();

  await iniciarDescarga({
    body: { pedidoId, gatewayId },
    usuario: { id: operadorId, nombreCompleto: 'Operador' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 201);
  assert.equal(datosDescarga.gatewayId, gatewayId);
  assert.equal(datosDescarga.pedidoId, pedidoId);
  assert.equal(datosDescarga.operadorId, operadorId);
  assert.equal(datosDescarga.fechaHoraInicio instanceof Date, true);
});

test('finaliza la descarga, calcula su duración y libera el gateway', async (t) => {
  const descargaFindOriginal = Descarga.findOne;
  const descargaUpdateOriginal = Descarga.findOneAndUpdate;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const pedidoFindOriginal = Pedido.findOne;
  const eventoSaveOriginal = Evento.prototype.save;
  const startSessionOriginal = mongoose.startSession;
  const descargaId = new mongoose.Types.ObjectId().toString();
  const inicio = new Date(Date.now() - 5 * 60 * 1000);
  let cambiosDescarga;
  let cambiosPedido;
  let cambiosGateway;
  const descargaActiva = {
    _id: descargaId,
    pedidoId: 'pedido-id',
    gatewayId: 'gateway-id',
    fechaHoraInicio: inicio,
  };
  Descarga.findOne = (filtro) => (filtro._id === descargaId
    ? Promise.resolve(descargaActiva)
    : { session: async () => null });
  Descarga.findOneAndUpdate = async (_filtro, cambios) => {
    cambiosDescarga = cambios.$set;
    return { ...cambios.$set, _id: descargaId, pedidoId: 'pedido-id', gatewayId: 'gateway-id' };
  };
  Pedido.findOneAndUpdate = async (_filtro, cambios) => {
    cambiosPedido = cambios.$set;
    return { _id: 'pedido-id', estado: cambios.$set.estado };
  };
  Gateway.findOneAndUpdate = async (_filtro, cambios) => {
    cambiosGateway = cambios.$set;
    return {
      _id: 'gateway-id',
      estado: cambios.$set.estado,
      tipoCargaPermitida: 'general',
    };
  };
  Pedido.findOne = () => ({
    sort() { return this; },
    session: async () => null,
  });
  Evento.prototype.save = async function guardarEventoPrueba() { return this; };
  mongoose.startSession = async () => ({
    withTransaction: async (operacion) => operacion({}),
    endSession: async () => {},
  });
  t.after(() => {
    Descarga.findOne = descargaFindOriginal;
    Descarga.findOneAndUpdate = descargaUpdateOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Pedido.findOne = pedidoFindOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
    Evento.prototype.save = eventoSaveOriginal;
    mongoose.startSession = startSessionOriginal;
  });
  const respuesta = crearRespuesta();

  await finalizarDescarga({
    body: { descargasId: descargaId },
    usuario: { id: new mongoose.Types.ObjectId().toString(), nombreCompleto: 'Operador' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(cambiosDescarga.fechaHoraFin instanceof Date, true);
  assert.equal(cambiosDescarga.duracionMinutos >= 4, true);
  assert.equal(cambiosPedido.estado, 'FINALIZADO');
  assert.equal(cambiosGateway.estado, 'LIBRE');
});

test('mantiene ocupado el gateway si tiene otra descarga activa', async (t) => {
  const descargaFindOriginal = Descarga.findOne;
  const descargaUpdateOriginal = Descarga.findOneAndUpdate;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const pedidoFindOriginal = Pedido.findOne;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const eventoSaveOriginal = Evento.prototype.save;
  const startSessionOriginal = mongoose.startSession;
  const descargaId = new mongoose.Types.ObjectId().toString();
  const descargaActiva = {
    _id: descargaId,
    pedidoId: new mongoose.Types.ObjectId(),
    gatewayId: new mongoose.Types.ObjectId(),
    fechaHoraInicio: new Date(Date.now() - 5 * 60 * 1000),
  };
  let filtroGateway;
  let cambiosGateway;
  Descarga.findOne = (filtro) => (filtro._id === descargaId
    ? Promise.resolve(descargaActiva)
    : { session: async () => ({ _id: new mongoose.Types.ObjectId() }) });
  Descarga.findOneAndUpdate = async (_filtro, cambios) => ({
    ...cambios.$set,
    ...descargaActiva,
  });
  Pedido.findOneAndUpdate = async (_filtro, cambios) => ({
    _id: descargaActiva.pedidoId,
    ...cambios.$set,
  });
  Pedido.findOne = () => ({
    sort() { return this; },
    session: async () => null,
  });
  Gateway.findOneAndUpdate = async (filtro, cambios) => {
    filtroGateway = filtro;
    cambiosGateway = cambios.$set;
    return {
      _id: descargaActiva.gatewayId,
      estado: cambios.$set.estado,
      tipoCargaPermitida: 'general',
    };
  };
  Evento.prototype.save = async function guardarEventoPrueba() { return this; };
  mongoose.startSession = async () => ({
    withTransaction: async (operacion) => operacion({}),
    endSession: async () => {},
  });
  t.after(() => {
    Descarga.findOne = descargaFindOriginal;
    Descarga.findOneAndUpdate = descargaUpdateOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Pedido.findOne = pedidoFindOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
    Evento.prototype.save = eventoSaveOriginal;
    mongoose.startSession = startSessionOriginal;
  });
  const respuesta = crearRespuesta();

  await finalizarDescarga({
    body: { descargasId: descargaId },
    usuario: { id: new mongoose.Types.ObjectId().toString(), nombreCompleto: 'Operador' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.deepEqual(filtroGateway.estado, { $in: ['LIBRE', 'OCUPADO'] });
  assert.equal(cambiosGateway.estado, 'OCUPADO');
  assert.equal(respuesta.body.gateway.estado, 'OCUPADO');
});

test('finaliza una descarga y marca FINALIZADO el pedido aunque esté inactivo', async (t) => {
  const descargaFindOriginal = Descarga.findOne;
  const descargaUpdateOriginal = Descarga.findOneAndUpdate;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const pedidoFindOriginal = Pedido.findOne;
  const gatewayUpdateOriginal = Gateway.findOneAndUpdate;
  const eventoSaveOriginal = Evento.prototype.save;
  const startSessionOriginal = mongoose.startSession;
  const descargaId = new mongoose.Types.ObjectId().toString();
  let cambiosGateway;
  let detallesEvento;
  let opcionesPedido;
  const pedidoId = new mongoose.Types.ObjectId();
  const gatewayId = new mongoose.Types.ObjectId();
  const descargaActiva = {
    _id: descargaId,
    pedidoId,
    gatewayId,
    fechaHoraInicio: new Date(Date.now() - 5 * 60 * 1000),
  };
  Descarga.findOne = (filtro) => (filtro._id === descargaId
    ? Promise.resolve(descargaActiva)
    : { session: async () => null });
  Descarga.findOneAndUpdate = async (_filtro, cambios) => ({
    ...cambios.$set,
    _id: descargaId,
    pedidoId,
    gatewayId,
  });
  Pedido.findOneAndUpdate = async (_filtro, cambios, opciones) => {
    opcionesPedido = opciones;
    return { _id: pedidoId, activo: false, ...cambios.$set };
  };
  Pedido.findOne = () => ({
    sort() { return this; },
    session: async () => null,
  });
  Gateway.findOneAndUpdate = async (_filtro, cambios) => {
    cambiosGateway = cambios.$set;
    return { _id: gatewayId, estado: cambios.$set.estado };
  };
  Evento.prototype.save = async function guardarEventoPrueba() {
    detallesEvento = this.detalles;
    return this;
  };
  mongoose.startSession = async () => ({
    withTransaction: async (operacion) => operacion({}),
    endSession: async () => {},
  });
  t.after(() => {
    Descarga.findOne = descargaFindOriginal;
    Descarga.findOneAndUpdate = descargaUpdateOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Pedido.findOne = pedidoFindOriginal;
    Gateway.findOneAndUpdate = gatewayUpdateOriginal;
    Evento.prototype.save = eventoSaveOriginal;
    mongoose.startSession = startSessionOriginal;
  });
  const respuesta = crearRespuesta();

  await finalizarDescarga({
    body: { descargasId: descargaId },
    usuario: { id: new mongoose.Types.ObjectId().toString(), nombreCompleto: 'Operador' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.pedido.estado, 'FINALIZADO');
  assert.equal(respuesta.body.descarga.fechaHoraFin instanceof Date, true);
  assert.equal(cambiosGateway.estado, 'LIBRE');
  assert.equal(opcionesPedido.incluirInactivos, true);
  assert.equal(detallesEvento.pedidoActualizado, true);
});