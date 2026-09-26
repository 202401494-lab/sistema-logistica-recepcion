const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const { registrarLlegada } = require('../controllers/logisticaController');

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
  const id = new mongoose.Types.ObjectId().toString();
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
  t.after(() => {
    Pedido.findOne = findOneOriginal;
    Pedido.findOneAndUpdate = findOneAndUpdateOriginal;
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

  await registrarLlegada({ params: { id }, body: {}, usuario: { rol: 'operador' } }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.estadoPuntualidad, 'Anticipado');
  assert.equal(respuesta.body.enEspera, true);
  assert.equal(cambiosAplicados.fechaHoraLlegadaReal instanceof Date, true);
  assert.equal(filtroActualizacion.fechaHoraLlegadaReal.$exists, false);
});