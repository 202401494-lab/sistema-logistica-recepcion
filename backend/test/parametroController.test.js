const test = require('node:test');
const assert = require('node:assert/strict');
const Parametro = require('../models/Parametro');
const { crearParametro } = require('../controllers/parametroController');

test('reactiva una clave inactiva y actualiza su valor', async (t) => {
  const findOneOriginal = Parametro.findOne;
  const findOneAndUpdateOriginal = Parametro.findOneAndUpdate;
  const existente = { _id: 'parametro-id', clave: 'TOLERANCIA_LLEGADA_MINUTOS', activo: false };
  const reactivado = { ...existente, valor: 20, activo: true };
  let filtroActualizacion;
  let cambiosAplicados;
  let opcionesActualizacion;

  Parametro.findOne = (filtro) => ({
    setOptions(opciones) {
      assert.deepEqual(filtro, { clave: 'TOLERANCIA_LLEGADA_MINUTOS' });
      assert.deepEqual(opciones, { incluirInactivos: true });
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(existente).then(resolve, reject);
    },
  });
  Parametro.findOneAndUpdate = async (filtro, cambios, opciones) => {
    filtroActualizacion = filtro;
    cambiosAplicados = cambios;
    opcionesActualizacion = opciones;
    return reactivado;
  };
  t.after(() => {
    Parametro.findOne = findOneOriginal;
    Parametro.findOneAndUpdate = findOneAndUpdateOriginal;
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

  await crearParametro({
    body: { clave: 'tolerancia_llegada_minutos', valor: 20 },
    usuario: { email: 'admin@test.com' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.activo, true);
  assert.deepEqual(filtroActualizacion, { _id: 'parametro-id', activo: false });
  assert.equal(cambiosAplicados.$set.valor, 20);
  assert.equal(cambiosAplicados.$set.activo, true);
  assert.equal(opcionesActualizacion.incluirInactivos, true);
});

test('rechaza crear una clave que ya está activa', async (t) => {
  const findOneOriginal = Parametro.findOne;
  const findOneAndUpdateOriginal = Parametro.findOneAndUpdate;
  Parametro.findOne = () => ({
    setOptions() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve({ activo: true }).then(resolve, reject);
    },
  });
  Parametro.findOneAndUpdate = async () => {
    assert.fail('No debe actualizar un parámetro activo durante la creación');
  };
  t.after(() => {
    Parametro.findOne = findOneOriginal;
    Parametro.findOneAndUpdate = findOneAndUpdateOriginal;
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

  await crearParametro({
    body: { clave: 'TOLERANCIA_LLEGADA_MINUTOS', valor: 20 },
    usuario: { email: 'admin@test.com' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 409);
  assert.match(respuesta.body.mensaje, /ya existe/);
});