const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const { login } = require('../controllers/authController');
const {
  configurarMfa,
  activarMfa,
  verificarCodigoLogin,
} = require('../controllers/mfaController');
const { actualizarMfaObligatorio } = require('../controllers/usuarioController');
const { verificarToken, verificarTempToken } = require('../middleware/authMiddleware');
const usuarioRoutes = require('../routes/usuarioRoutes');

const crearRespuesta = () => ({
  statusCode: null,
  body: null,
  status(codigo) {
    this.statusCode = codigo;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const crearConsultaUsuario = (usuario) => ({
  select() {
    return this;
  },
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(usuario).then(resolve, reject);
  },
});

const restaurarMetodos = (t, originales) => {
  t.after(() => {
    for (const [metodo, original] of Object.entries(originales)) {
      Usuario[metodo] = original;
    }
  });
};

test('login exige enrolamiento y el token temporal no autoriza rutas operativas', async (t) => {
  const secretoJwtAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  t.after(() => {
    if (secretoJwtAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoJwtAnterior;
  });

  const findOneOriginal = Usuario.findOne;
  const compareOriginal = bcrypt.compare;
  restaurarMetodos(t, { findOne: findOneOriginal });
  bcrypt.compare = async () => true;
  t.after(() => { bcrypt.compare = compareOriginal; });

  const usuario = {
    _id: new mongoose.Types.ObjectId(),
    email: 'persona@test.com',
    password: 'hash',
    nombres: 'Ana',
    apellidosCompleto: 'López',
    estado: 'activo',
    mfaObligatorio: true,
    twoFactorEnabled: false,
    roles: [{ nombre: 'operador' }],
  };
  Usuario.findOne = () => ({
    select() {
      return this;
    },
    populate: async () => usuario,
  });

  const respuesta = crearRespuesta();
  await login({ body: { email: usuario.email, password: 'correcta' } }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.mfaSetupRequired, true);
  assert.equal(respuesta.body.mfaRequired, true);
  assert.equal(respuesta.body.token, undefined);

  const tempToken = jwt.verify(respuesta.body.tempToken, process.env.JWT_SECRET);
  assert.equal(tempToken.type, 'MFA_TEMP');
  assert.equal(tempToken.exp - tempToken.iat, 300);

  const accesoDenegado = crearRespuesta();
  let continuo = false;
  verificarToken(
    { headers: { authorization: `Bearer ${respuesta.body.tempToken}` } },
    accesoDenegado,
    () => { continuo = true; },
  );
  assert.equal(accesoDenegado.statusCode, 403);
  assert.equal(continuo, false);

  const temporalAceptado = crearRespuesta();
  verificarTempToken(
    { headers: { authorization: `Bearer ${respuesta.body.tempToken}` } },
    temporalAceptado,
    () => { continuo = true; },
  );
  assert.equal(continuo, true);
});

test('login sin MFA conserva el acceso directo con JWT definitivo de 8 horas', async (t) => {
  const secretoJwtAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  t.after(() => {
    if (secretoJwtAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoJwtAnterior;
  });

  const findOneOriginal = Usuario.findOne;
  const compareOriginal = bcrypt.compare;
  restaurarMetodos(t, { findOne: findOneOriginal });
  bcrypt.compare = async () => true;
  t.after(() => { bcrypt.compare = compareOriginal; });

  const usuario = {
    _id: new mongoose.Types.ObjectId(),
    email: 'persona@test.com',
    password: 'hash',
    nombres: 'Ana',
    apellidosCompleto: 'López',
    estado: 'activo',
    mfaObligatorio: false,
    twoFactorEnabled: false,
    roles: [{ nombre: 'operador' }],
  };
  Usuario.findOne = () => ({
    select() {
      return this;
    },
    populate: async () => usuario,
  });

  const respuesta = crearRespuesta();
  await login({ body: { email: usuario.email, password: 'correcta' } }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.tempToken, undefined);
  const payload = jwt.verify(respuesta.body.token, process.env.JWT_SECRET);
  assert.equal(payload.exp - payload.iat, 8 * 60 * 60);
  assert.equal(respuesta.body.usuario.rol, 'operador');
});

test('login con MFA activado requiere TOTP y emite un JWT definitivo de 8 horas', async (t) => {
  const secretoJwtAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  t.after(() => {
    if (secretoJwtAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoJwtAnterior;
  });

  const findByIdOriginal = Usuario.findById;
  restaurarMetodos(t, { findById: findByIdOriginal });
  const secreto = speakeasy.generateSecret().base32;
  const usuario = {
    _id: new mongoose.Types.ObjectId(),
    email: 'persona@test.com',
    nombres: 'Ana',
    apellidosCompleto: 'López',
    estado: 'activo',
    twoFactorEnabled: true,
    twoFactorSecret: secreto,
    roles: [{ nombre: 'coordinador' }],
  };
  Usuario.findById = () => crearConsultaUsuario(usuario);

  const respuesta = crearRespuesta();
  await verificarCodigoLogin({
    usuario: { id: String(usuario._id) },
    body: { code: speakeasy.totp({ secret: secreto, encoding: 'base32' }) },
  }, respuesta);

  assert.equal(respuesta.statusCode, 200);
  const payload = jwt.verify(respuesta.body.token, process.env.JWT_SECRET);
  assert.equal(payload.rol, 'coordinador');
  assert.equal(payload.exp - payload.iat, 8 * 60 * 60);
  assert.equal(respuesta.body.usuario.rol, 'coordinador');

  const accesoDenegado = crearRespuesta();
  verificarTempToken(
    { headers: { authorization: `Bearer ${respuesta.body.token}` } },
    accesoDenegado,
    () => assert.fail('Un JWT definitivo no es un token temporal MFA'),
  );
  assert.equal(accesoDenegado.statusCode, 403);
});

test('enrolamiento MFA genera URI y solo se activa con TOTP válido', async (t) => {
  const findByIdOriginal = Usuario.findById;
  const findByIdAndUpdateOriginal = Usuario.findByIdAndUpdate;
  const updateOneOriginal = Usuario.updateOne;
  restaurarMetodos(t, {
    findById: findByIdOriginal,
    findByIdAndUpdate: findByIdAndUpdateOriginal,
    updateOne: updateOneOriginal,
  });

  const usuario = {
    _id: new mongoose.Types.ObjectId(),
    email: 'persona@test.com',
    estado: 'activo',
    mfaObligatorio: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
  };
  let cambiosUsuario;
  let filtroActivacion;
  Usuario.findById = () => crearConsultaUsuario(usuario);
  Usuario.findByIdAndUpdate = async (_id, cambios) => {
    cambiosUsuario = cambios;
  };
  Usuario.updateOne = async (filtro) => {
    filtroActivacion = filtro;
    return { modifiedCount: 1 };
  };

  const respuestaSetup = crearRespuesta();
  await configurarMfa({ usuario: { id: String(usuario._id) } }, respuestaSetup);

  assert.equal(respuestaSetup.statusCode, 200);
  assert.match(respuestaSetup.body.otpauthUrl, /^otpauth:\/\/totp\//);
  assert.equal(respuestaSetup.body.secret, undefined);
  usuario.twoFactorSecret = cambiosUsuario.$set.twoFactorSecret;
  assert.ok(usuario.twoFactorSecret);

  const respuestaCodigoIncorrecto = crearRespuesta();
  await activarMfa({
    usuario: { id: String(usuario._id) },
    body: { code: '000000' },
  }, respuestaCodigoIncorrecto);
  assert.equal(respuestaCodigoIncorrecto.statusCode, 401);
  assert.equal(filtroActivacion, undefined);

  const respuestaActivacion = crearRespuesta();
  await activarMfa({
    usuario: { id: String(usuario._id) },
    body: { code: speakeasy.totp({ secret: usuario.twoFactorSecret, encoding: 'base32' }) },
  }, respuestaActivacion);

  assert.equal(respuestaActivacion.statusCode, 200);
  assert.equal(respuestaActivacion.body.twoFactorEnabled, true);
  assert.equal(filtroActivacion.twoFactorSecret, usuario.twoFactorSecret);
});

test('solo acepta booleanos al cambiar el requisito MFA de un usuario', async (t) => {
  const findByIdAndUpdateOriginal = Usuario.findByIdAndUpdate;
  restaurarMetodos(t, { findByIdAndUpdate: findByIdAndUpdateOriginal });

  const usuarioId = new mongoose.Types.ObjectId();
  const usuario = {
    _id: usuarioId,
    email: 'persona@test.com',
    mfaObligatorio: false,
    twoFactorEnabled: false,
  };
  let numeroActualizaciones = 0;
  Usuario.findByIdAndUpdate = async (id, cambios, opciones) => {
    numeroActualizaciones += 1;
    assert.equal(String(id), String(usuarioId));
    assert.equal(opciones.new, true);
    usuario.mfaObligatorio = cambios.$set.mfaObligatorio;
    return usuario;
  };

  const respuesta = crearRespuesta();
  await actualizarMfaObligatorio({
    params: { id: String(usuarioId) },
    body: { mfaObligatorio: 'true' },
  }, respuesta);

  assert.equal(respuesta.statusCode, 400);
  assert.equal(numeroActualizaciones, 0);

  await actualizarMfaObligatorio({
    params: { id: String(usuarioId) },
    body: { mfaObligatorio: false },
  }, respuesta);
  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.usuario.mfaObligatorio, false);
  assert.equal(numeroActualizaciones, 1);
});

test('la ruta administrativa del requisito MFA solo admite administradores', () => {
  const capaRuta = usuarioRoutes.stack.find(
    (capa) => capa.route?.path === '/usuarios/:id/mfa-obligatorio',
  );
  assert.ok(capaRuta);
  assert.equal(capaRuta.route.methods.patch, true);
  assert.equal(capaRuta.route.stack.length, 3);

  const autorizar = capaRuta.route.stack[1].handle;
  const respuesta = crearRespuesta();
  let continuo = false;

  autorizar({ usuario: { rol: 'operador' } }, respuesta, () => { continuo = true; });
  assert.equal(respuesta.statusCode, 403);
  assert.equal(continuo, false);

  autorizar({ usuario: { rol: 'administrador' } }, respuesta, () => { continuo = true; });
  assert.equal(continuo, true);
});
