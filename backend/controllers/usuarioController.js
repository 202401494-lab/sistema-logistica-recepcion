const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Role = require('../models/Role');
const Usuario = require('../models/Usuario');
const registrarEvento = require('../services/auditoriaEventos');

const nombreUsuario = (req) => req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';

const validarRolesActivos = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !mongoose.isValidObjectId(id))) return null;
  const idsUnicos = [...new Set(ids.map(String))];
  if (idsUnicos.length !== ids.length) return null;
  const roles = await Role.find({
    _id: { $in: idsUnicos },
    $or: [{ activo: true }, { activo: { $exists: false } }],
  });
  return roles.length === idsUnicos.length ? idsUnicos : null;
};

const listarUsuarios = async (req, res) => {
  const pagina = req.query?.pagina === undefined ? 1 : Number(req.query.pagina);
  const limiteSolicitado = req.query?.limite === undefined ? 10 : Number(req.query.limite);

  if (!Number.isInteger(pagina) || !Number.isInteger(limiteSolicitado)
    || pagina < 1 || limiteSolicitado < 1) {
    return res.status(400).json({ mensaje: 'pagina y limite deben ser enteros positivos' });
  }

  const limite = Math.min(limiteSolicitado, 50);
  const salto = (pagina - 1) * limite;

  try {
    const [usuarios, total] = await Promise.all([
      Usuario.find({})
        .select('_id nombres apellidosCompleto email roles estado mfaObligatorio twoFactorEnabled createdAt')
        .populate('roles', 'nombreRol nombre activo')
        .sort({ createdAt: -1, _id: -1 })
        .skip(salto)
        .limit(limite)
        .lean(),
      Usuario.countDocuments({}),
    ]);

    return res.status(200).json({
      usuarios,
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ mensaje: 'Error interno al listar usuarios' });
  }
};

const crearUsuario = async (req, res) => {
  const datos = req.body || {};
  const nombres = typeof datos.nombres === 'string' ? datos.nombres.trim() : '';
  const apellidosCompleto = typeof datos.apellidosCompleto === 'string' ? datos.apellidosCompleto.trim() : '';
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const password = datos.password;
  if (!nombres || !apellidosCompleto || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ mensaje: 'nombres, apellidosCompleto y un email válido son obligatorios' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (datos.estado !== undefined && !['activo', 'inactivo'].includes(datos.estado)) {
    return res.status(400).json({ mensaje: 'estado debe ser activo o inactivo' });
  }
  if (datos.mfaObligatorio !== undefined && typeof datos.mfaObligatorio !== 'boolean') {
    return res.status(400).json({ mensaje: 'mfaObligatorio debe ser booleano' });
  }

  try {
    const roles = await validarRolesActivos(datos.roles);
    if (!roles) return res.status(400).json({ mensaje: 'Asigna uno o más roles activos válidos' });
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      nombres,
      apellidosCompleto,
      email,
      password: passwordHash,
      roles,
      estado: datos.estado || 'activo',
      mfaObligatorio: datos.mfaObligatorio === true,
    });
    await registrarEvento({
      usuarioId: req.usuario.id,
      usuarioCreacion: nombreUsuario(req),
      accion: 'ROL_ASIGNADO_USUARIO',
      detalles: { usuarioId: usuario._id, roles },
    });
    const creado = await Usuario.findById(usuario._id)
      .select('_id nombres apellidosCompleto email roles estado mfaObligatorio twoFactorEnabled createdAt')
      .populate('roles', 'nombreRol nombre');
    return res.status(201).json(creado);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del usuario no son válidos', detalle: error.message });
    }
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al crear el usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'El id del usuario no es válido' });
  const datos = req.body || {};
  const cambios = {};
  for (const campo of ['nombres', 'apellidosCompleto']) {
    if (datos[campo] !== undefined) {
      if (typeof datos[campo] !== 'string' || !datos[campo].trim()) {
        return res.status(400).json({ mensaje: `${campo} no puede estar vacío` });
      }
      cambios[campo] = datos[campo].trim();
    }
  }
  if (datos.email !== undefined) {
    if (typeof datos.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      return res.status(400).json({ mensaje: 'email no tiene un formato válido' });
    }
    cambios.email = datos.email.trim().toLowerCase();
  }
  let passwordPlano;
  if (datos.password !== undefined) {
    if (typeof datos.password !== 'string' || datos.password.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }
    passwordPlano = datos.password;
  }
  if (datos.estado !== undefined) {
    if (!['activo', 'inactivo'].includes(datos.estado)) return res.status(400).json({ mensaje: 'estado debe ser activo o inactivo' });
    if (datos.estado === 'inactivo' && String(req.usuario?.id) === String(id)) {
      return res.status(409).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
    }
    cambios.estado = datos.estado;
  }
  if (datos.mfaObligatorio !== undefined) {
    if (typeof datos.mfaObligatorio !== 'boolean') return res.status(400).json({ mensaje: 'mfaObligatorio debe ser booleano' });
    if (datos.mfaObligatorio) cambios.mfaObligatorio = true;
    else {
      cambios.mfaObligatorio = false;
      cambios.twoFactorEnabled = false;
      cambios.twoFactorRecoveryCodes = [];
    }
  }
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ mensaje: 'Envía al menos un campo para actualizar' });
  }

  try {
    if (datos.roles !== undefined) {
      const roles = await validarRolesActivos(datos.roles);
      if (!roles) return res.status(400).json({ mensaje: 'Asigna uno o más roles activos válidos' });
      cambios.roles = roles;
    } else if (cambios.estado === 'activo') {
      const usuarioActual = await Usuario.findById(id).select('roles');
      if (!usuarioActual) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      const roles = await validarRolesActivos(usuarioActual.roles);
      if (!roles) {
        return res.status(400).json({
          mensaje: 'Asigna uno o más roles activos antes de reactivar la cuenta',
        });
      }
    }
    if (passwordPlano) cambios.password = await bcrypt.hash(passwordPlano, 10);
    const usuarioNombre = nombreUsuario(req);
    const cambiosMongo = { $set: cambios };
    if (cambios.mfaObligatorio === false) cambiosMongo.$unset = { twoFactorSecret: 1 };
    const actualizado = await Usuario.findByIdAndUpdate(id, cambiosMongo, {
      new: true,
      runValidators: true,
    })
      .select('_id nombres apellidosCompleto email roles estado mfaObligatorio twoFactorEnabled createdAt')
      .populate('roles', 'nombreRol nombre');
    if (!actualizado) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (cambios.roles) {
      await registrarEvento({
        usuarioId: req.usuario.id,
        usuarioCreacion: usuarioNombre,
        accion: 'ROL_ASIGNADO_USUARIO',
        detalles: { usuarioId: actualizado._id, roles: cambios.roles },
      });
    }
    return res.status(200).json(actualizado);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del usuario no son válidos', detalle: error.message });
    }
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar el usuario' });
  }
};

const desactivarUsuario = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'El id del usuario no es válido' });
  if (String(req.usuario?.id) === String(id)) {
    return res.status(409).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
  }
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { $set: { estado: 'inactivo' } },
      { new: true },
    ).select('_id nombres apellidosCompleto email roles estado mfaObligatorio twoFactorEnabled');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    return res.status(200).json({ mensaje: 'Cuenta desactivada correctamente', usuario });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al desactivar el usuario' });
  }
};

const actualizarMfaObligatorio = async (req, res) => {
  const { id } = req.params;
  const { mfaObligatorio } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'El identificador del usuario no es válido' });
  }

  if (typeof mfaObligatorio !== 'boolean') {
    return res.status(400).json({ mensaje: 'mfaObligatorio debe ser un valor booleano' });
  }

  try {
    const cambios = mfaObligatorio
      ? { $set: { mfaObligatorio: true } }
      : {
        $set: {
          mfaObligatorio: false,
          twoFactorEnabled: false,
          twoFactorRecoveryCodes: [],
        },
        $unset: { twoFactorSecret: 1 },
      };
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      cambios,
      { new: true, runValidators: true },
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      mensaje: mfaObligatorio ? 'MFA activado para el usuario' : 'MFA desactivado para el usuario',
      usuario: {
        id: usuario._id,
        email: usuario.email,
        mfaObligatorio: usuario.mfaObligatorio,
        twoFactorEnabled: usuario.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Error al actualizar el requisito MFA del usuario:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar MFA del usuario' });
  }
};

module.exports = {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  actualizarMfaObligatorio,
};
