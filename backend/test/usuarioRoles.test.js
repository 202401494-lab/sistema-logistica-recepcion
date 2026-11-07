const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Usuario = require('../models/Usuario');
const { actualizarUsuario } = require('../controllers/usuarioController');

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

test('impide que un administrador desactive su propia cuenta desde la edición', async (t) => {
  const findByIdAndUpdateOriginal = Usuario.findByIdAndUpdate;
  t.after(() => { Usuario.findByIdAndUpdate = findByIdAndUpdateOriginal; });
  let actualizado = false;
  Usuario.findByIdAndUpdate = async () => {
    actualizado = true;
  };

  const id = String(new mongoose.Types.ObjectId());
  const respuesta = crearRespuesta();
  await actualizarUsuario(
    { params: { id }, body: { estado: 'inactivo' }, usuario: { id } },
    respuesta,
  );

  assert.equal(respuesta.statusCode, 409);
  assert.equal(actualizado, false);
});

test('no reactiva cuentas sin roles activos válidos', async (t) => {
  const idUsuario = new mongoose.Types.ObjectId();
  const idRol = new mongoose.Types.ObjectId();
  const findByIdOriginal = Usuario.findById;
  const findByIdAndUpdateOriginal = Usuario.findByIdAndUpdate;
  const findRolesOriginal = Role.find;
  t.after(() => {
    Usuario.findById = findByIdOriginal;
    Usuario.findByIdAndUpdate = findByIdAndUpdateOriginal;
    Role.find = findRolesOriginal;
  });

  let actualizado = false;
  Usuario.findById = () => ({ select: async () => ({ roles: [idRol] }) });
  Role.find = async () => [];
  Usuario.findByIdAndUpdate = async () => {
    actualizado = true;
  };

  const respuesta = crearRespuesta();
  await actualizarUsuario(
    {
      params: { id: String(idUsuario) },
      body: { estado: 'activo' },
      usuario: { id: String(new mongoose.Types.ObjectId()) },
    },
    respuesta,
  );

  assert.equal(respuesta.statusCode, 400);
  assert.match(respuesta.body.mensaje, /roles activos/);
  assert.equal(actualizado, false);
});
