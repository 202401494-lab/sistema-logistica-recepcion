const test = require('node:test');
const assert = require('node:assert/strict');
const Descarga = require('../models/Descarga');
const { listarDescargasActivas } = require('../controllers/gatewaysController');

test('lista descargas abiertas con pedido y gateway para el tablero', async (t) => {
  const findOriginal = Descarga.find;
  let filtroConsultado;
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
    then(resolve) {
      return Promise.resolve([{ _id: 'descarga-1' }]).then(resolve);
    },
  };
  Descarga.find = (filtro) => {
    filtroConsultado = filtro;
    return cadena;
  };
  t.after(() => {
    Descarga.find = findOriginal;
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
  assert.deepEqual(filtroConsultado, { activo: true, fechaHoraFin: { $exists: false } });
  assert.deepEqual(cadena.referencias.map(({ referencia }) => referencia), ['pedidoId', 'gatewayId']);
});