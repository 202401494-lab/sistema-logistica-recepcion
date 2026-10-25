const test = require('node:test');
const assert = require('node:assert/strict');
const Descarga = require('../models/Descarga');
const Pedido = require('../models/Pedido');
const { listarDescargasActivas } = require('../controllers/gatewaysController');

test('lista descargas abiertas y resuelve pedidos activos o inactivos para el tablero', async (t) => {
  const findOriginal = Descarga.find;
  const pedidoFindOriginal = Pedido.find;
  let filtroConsultado;
  let filtroPedidos;
  let proyeccionPedidos;
  let opcionesPedidos;
  const pedidoId = 'pedido-1';
  const cadena = {
    populate(referencia, campos) {
      this.referencias ||= [];
      this.referencias.push({ referencia, campos });
      return this;
    },
    sort(orden) {
      this.orden = orden;
      return this;
    },
    lean() {
      return this;
    },
    then(resolve) {
      return Promise.resolve([{
        _id: 'descarga-1',
        pedidoId,
        gatewayId: 'gateway-1',
      }]).then(resolve);
    },
  };
  const consultaPedidos = {
    setOptions(opciones) {
      opcionesPedidos = opciones;
      return this;
    },
    lean() {
      return Promise.resolve([{ _id: pedidoId, numeroPedido: 'PED-001', tipoProducto: 'general' }]);
    },
  };
  Descarga.find = (filtro) => {
    filtroConsultado = filtro;
    return cadena;
  };
  Pedido.find = (filtro, proyeccion) => {
    filtroPedidos = filtro;
    proyeccionPedidos = proyeccion;
    return consultaPedidos;
  };
  t.after(() => {
    Descarga.find = findOriginal;
    Pedido.find = pedidoFindOriginal;
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

  await listarDescargasActivas({}, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body[0]._id, 'descarga-1');
  assert.equal(respuesta.body[0].pedidoId.numeroPedido, 'PED-001');
  assert.equal(respuesta.body[0].pedidoIdReferencia, pedidoId);
  assert.deepEqual(filtroConsultado, { activo: true, fechaHoraFin: { $exists: false } });
  assert.deepEqual(cadena.orden, { fechaHoraInicio: -1 });
  assert.deepEqual(cadena.referencias, [{ referencia: 'gatewayId', campos: 'numeroGateway estado' }]);
  assert.deepEqual(filtroPedidos, { _id: { $in: [pedidoId] } });
  assert.equal(proyeccionPedidos, 'numeroPedido tipoProducto');
  assert.deepEqual(opcionesPedidos, { incluirInactivos: true });
});

test('lista descargas incluso si no existe el pedido asociado', async (t) => {
  const findOriginal = Descarga.find;
  const pedidoFindOriginal = Pedido.find;
  Descarga.find = () => ({
    populate() { return this; },
    sort() { return this; },
    lean() { return Promise.resolve([{ _id: 'descarga-1', pedidoId: 'pedido-ausente' }]); },
  });
  Pedido.find = () => ({
    setOptions() { return this; },
    lean() { return Promise.resolve([]); },
  });
  t.after(() => {
    Descarga.find = findOriginal;
    Pedido.find = pedidoFindOriginal;
  });
  const respuesta = {
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(contenido) {
      this.body = contenido;
      return this;
    },
  };

  await listarDescargasActivas({}, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body[0].pedidoId, null);
});