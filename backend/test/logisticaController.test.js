const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Evento = require('../models/Evento');
const {
  registrarLlegada,
  crearPedido,
  cancelarPedido,
} = require('../controllers/logisticaController');

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

test('rechaza un numeroPedido enviado manualmente', async () => {
  const respuesta = {
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
  };

  await crearPedido({ body: { numeroPedido: 'PED-MANUAL-001' } }, respuesta);

  assert.equal(respuesta.statusCode, 400);
  assert.match(respuesta.body.mensaje, /generado automáticamente/);
});

test('impide cancelar un pedido mientras está descargándose', async (t) => {
  const pedidoFindOriginal = Pedido.findOne;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  Pedido.findOne = async () => ({ _id: new mongoose.Types.ObjectId(), estado: 'DESCARGANDO' });
  Pedido.findOneAndUpdate = async () => assert.fail('No debe cancelar un pedido que está descargándose');
  t.after(() => {
    Pedido.findOne = pedidoFindOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
  });
  const respuesta = crearRespuesta();

  await cancelarPedido({ params: { id: new mongoose.Types.ObjectId().toString() } }, respuesta);

  assert.equal(respuesta.statusCode, 409);
  assert.match(respuesta.body.mensaje, /descarga está activa/);
});

test('impide cancelar un pedido con una descarga abierta aunque su estado no coincida', async (t) => {
  const pedidoFindOriginal = Pedido.findOne;
  const pedidoUpdateOriginal = Pedido.findOneAndUpdate;
  const descargaFindOriginal = Descarga.findOne;
  Pedido.findOne = async () => ({ _id: new mongoose.Types.ObjectId(), estado: 'EN COLA' });
  Pedido.findOneAndUpdate = async () => assert.fail('No debe cancelar un pedido con una descarga abierta');
  Descarga.findOne = async () => ({ _id: new mongoose.Types.ObjectId() });
  t.after(() => {
    Pedido.findOne = pedidoFindOriginal;
    Pedido.findOneAndUpdate = pedidoUpdateOriginal;
    Descarga.findOne = descargaFindOriginal;
  });
  const respuesta = crearRespuesta();

  await cancelarPedido({ params: { id: new mongoose.Types.ObjectId().toString() } }, respuesta);

  assert.equal(respuesta.statusCode, 409);
  assert.match(respuesta.body.mensaje, /descarga está activa/);
});

test('rechaza una hora de llegada futura antes de consultar el pedido', async (t) => {
  const findOneOriginal = Pedido.findOne;
  let consultoPedido = false;
  Pedido.findOne = async () => {
    consultoPedido = true;
    return null;
  };
  t.after(() => {
    Pedido.findOne = findOneOriginal;
  });

  const respuesta = {
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
  };
  const fechaFutura = new Date(Date.now() + 60_000).toISOString();

  await registrarLlegada({
    params: { id: new mongoose.Types.ObjectId().toString() },
    body: { fechaHoraLlegadaReal: fechaFutura },
    usuario: { rol: 'operador' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 400);
  assert.match(respuesta.body.mensaje, /no futura/);
  assert.equal(consultoPedido, false);
});

test('registra una llegada anticipada y la deja en espera antes de la ventana', async (t) => {
  const findOneOriginal = Pedido.findOne;
  const findOneAndUpdateOriginal = Pedido.findOneAndUpdate;
  const gatewayFindOriginal = Gateway.findOne;
  const eventoSaveOriginal = Evento.prototype.save;
  const startSessionOriginal = mongoose.startSession;
  const id = new mongoose.Types.ObjectId().toString();
  const usuarioId = new mongoose.Types.ObjectId().toString();
  const inicioVentana = new Date(Date.now() + 10 * 60 * 1000);
  const finVentana = new Date(inicioVentana.getTime() + 60 * 60 * 1000);
  let filtroActualizacion;
  let cambiosAplicados;

  Pedido.findOne = async () => ({
    estado: 'PROGRAMADO',
    inicioVentana,
    finVentana,
  });
  Pedido.findOneAndUpdate = async (filtro, cambios) => {
    filtroActualizacion = filtro;
    cambiosAplicados = cambios.$set;
    return { _id: id, ...cambios.$set };
  };
  Gateway.findOne = async () => ({ _id: new mongoose.Types.ObjectId() });
  Evento.prototype.save = async function guardarEventoPrueba() { return this; };
  mongoose.startSession = async () => ({
    withTransaction: async (operacion) => operacion({}),
    endSession: async () => {},
  });
  t.after(() => {
    Pedido.findOne = findOneOriginal;
    Pedido.findOneAndUpdate = findOneAndUpdateOriginal;
    Gateway.findOne = gatewayFindOriginal;
    Evento.prototype.save = eventoSaveOriginal;
    mongoose.startSession = startSessionOriginal;
  });

  const respuesta = {
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
  };

  await registrarLlegada({ params: { id }, body: {}, usuario: { id: usuarioId, rol: 'operador' } }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.estadoPuntualidad, 'Anticipado');
  assert.equal(respuesta.body.enEspera, true);
  assert.equal(cambiosAplicados.fechaHoraLlegadaReal instanceof Date, true);
  assert.equal(filtroActualizacion.fechaHoraLlegadaReal.$exists, false);
});