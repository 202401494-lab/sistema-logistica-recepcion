const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Usuario = require('../models/Usuario');
const Evento = require('../models/Evento');
const {
  crearRol,
  desactivarRol,
} = require('../controllers/rolesController');

const crearRespuesta = () => ({
  statusCode: null,
  status(codigo) {
    this.statusCode = codigo;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('rechaza permisos de módulos desconocidos antes de consultar la base de datos', async (t) => {
  const findOneOriginal = Role.findOne;
  t.after(() => { Role.findOne = findOneOriginal; });
  let consultado = false;
  Role.findOne = () => {
    consultado = true;
    throw new Error('No debe consultar');
  };

  const respuesta = crearRespuesta();
  await crearRol(
    { body: { nombreRol: 'Auditor', permisos: ['desconocido'] }, usuario: { id: 'admin-1' } },
    respuesta,
  );

  assert.equal(respuesta.statusCode, 400);
  assert.match(respuesta.body.mensaje, /permisos solo puede contener/);
  assert.equal(consultado, false);
});

test('rechaza la baja lógica cuando el rol sigue asignado a usuarios activos', async (t) => {
  const rolId = new mongoose.Types.ObjectId();
  const findByIdOriginal = Role.findById;
  const countDocumentsOriginal = Usuario.countDocuments;
  const guardarEventoOriginal = Evento.prototype.save;
  t.after(() => {
    Role.findById = findByIdOriginal;
    Usuario.countDocuments = countDocumentsOriginal;
    Evento.prototype.save = guardarEventoOriginal;
  });

  let guardado = false;
  Role.findById = async () => ({
    _id: rolId,
    nombreRol: 'Supervisor',
    activo: true,
    save: async () => { guardado = true; },
  });
  Usuario.countDocuments = async (filtro) => {
    assert.deepEqual(filtro, { estado: 'activo', roles: rolId });
    return 2;
  };
  Evento.prototype.save = async () => { throw new Error('No debe registrar evento'); };

  const respuesta = crearRespuesta();
  await desactivarRol(
    { params: { id: String(rolId) }, usuario: { id: 'admin-1' } },
    respuesta,
  );

  assert.equal(respuesta.statusCode, 409);
  assert.equal(respuesta.body.usuariosActivosAsignados, 2);
  assert.equal(guardado, false);
});
