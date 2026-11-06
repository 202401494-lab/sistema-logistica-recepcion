const test = require('node:test');
const assert = require('node:assert/strict');
const Evento = require('../models/Evento');
const Parametro = require('../models/Parametro');
const Pedido = require('../models/Pedido');
const actualizarColaPrioridad = require('../services/actualizarColaPrioridad');
const {
  ColaPrioridad,
  calcularPrioridad,
} = require('../services/colaPrioridad');

test('el heap ordena por puntualidad y hora programada', () => {
  const cola = new ColaPrioridad([
    { _id: 'tardio', estadoPuntualidad: 'Tardío', prioridadCalculada: 100, fechaHoraProgramada: '2026-01-01' },
    { _id: 'anticipado', estadoPuntualidad: 'Anticipado', prioridadCalculada: 200, fechaHoraProgramada: '2026-01-01' },
    { _id: 'puntual-tarde', estadoPuntualidad: 'A tiempo', prioridadCalculada: 300, fechaHoraProgramada: '2026-01-02' },
    { _id: 'puntual-temprano', estadoPuntualidad: 'A tiempo', prioridadCalculada: 300, fechaHoraProgramada: '2026-01-01' },
  ]);

  assert.deepEqual(
    cola.obtenerOrdenados().map((pedido) => pedido._id),
    ['puntual-temprano', 'puntual-tarde', 'anticipado', 'tardio'],
  );
});

test('el Aging incrementa la prioridad y registra el intervalo aplicado', async (t) => {
  const fechaHoraIngresoCola = new Date('2026-01-01T00:00:00.000Z');
  const ahora = new Date(fechaHoraIngresoCola.getTime() + 31 * 60 * 1000);
  const pedido = {
    _id: 'pedido-tardio',
    estado: 'EN COLA',
    estadoPuntualidad: 'Tardío',
    prioridadCalculada: 300,
    minutosEnEspera: 29,
    fechaHoraIngresoCola,
    fechaHoraProgramada: new Date('2026-01-01T00:00:00.000Z'),
  };
  const findParametroOriginal = Parametro.findOne;
  const findPedidosOriginal = Pedido.find;
  const updatePedidoOriginal = Pedido.findOneAndUpdate;
  const guardarEventoOriginal = Evento.prototype.save;
  const eventos = [];

  Parametro.findOne = async () => ({ valor: 10 });
  Pedido.find = async () => [pedido];
  Pedido.findOneAndUpdate = async (_filtro, cambios) => ({ ...pedido, ...cambios.$set });
  Evento.prototype.save = async function guardarEvento() {
    eventos.push(this);
    return this;
  };
  t.after(() => {
    Parametro.findOne = findParametroOriginal;
    Pedido.find = findPedidosOriginal;
    Pedido.findOneAndUpdate = updatePedidoOriginal;
    Evento.prototype.save = guardarEventoOriginal;
  });

  const resultado = await actualizarColaPrioridad({
    usuarioId: 'usuario',
    usuario: 'Operador',
    ahora,
  });

  assert.equal(calcularPrioridad(pedido, 31, 10), 400);
  assert.equal(resultado.cola[0].prioridadCalculada, 400);
  assert.equal(resultado.cola[0].minutosEnEspera, 31);
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].accion, 'AGING_APLICADO');
  assert.equal(eventos[0].detalles.incremento, 100);
});
