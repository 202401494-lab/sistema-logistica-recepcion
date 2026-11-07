const mongoose = require('mongoose');
const Role = require('../models/Role');
const Usuario = require('../models/Usuario');
const { MODULOS, obtenerPermisosRol } = require('../services/permisosRoles');
const registrarEvento = require('../services/auditoriaEventos');

const nombreUsuario = (req) => req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';

const obtenerPermisos = (valor) => {
  if (!Array.isArray(valor) || valor.some((permiso) => !MODULOS.includes(permiso))) return null;
  return [...new Set(valor)];
};

const validarNombre = (valor) => typeof valor === 'string' && valor.trim().length >= 2 && valor.trim().length <= 60;

const listarRoles = async (req, res) => {
  const { activo } = req.query;
  if (activo !== undefined && !['true', 'false'].includes(activo)) {
    return res.status(400).json({ mensaje: 'El filtro activo debe ser true o false' });
  }

  try {
    const filtroActivo = activo === 'true'
      ? { $or: [{ activo: true }, { activo: { $exists: false } }] }
      : activo === 'false'
        ? { activo: false }
        : {};
    const roles = await Role.find(filtroActivo)
      .sort({ nombreRol: 1, nombre: 1 })
      .lean();
    return res.status(200).json(roles.map((rol) => ({
      ...rol,
      nombreRol: rol.nombreRol || rol.nombre,
      permisos: obtenerPermisosRol(rol),
      activo: rol.activo !== false,
    })));
  } catch (error) {
    console.error('Error al listar roles:', error);
    return res.status(500).json({ mensaje: 'Error interno al listar roles' });
  }
};

const crearRol = async (req, res) => {
  const datos = req.body || {};
  const permisos = obtenerPermisos(datos.permisos);
  if (!validarNombre(datos.nombreRol)) {
    return res.status(400).json({ mensaje: 'nombreRol debe tener entre 2 y 60 caracteres' });
  }
  if (permisos === null) {
    return res.status(400).json({ mensaje: `permisos solo puede contener: ${MODULOS.join(', ')}` });
  }
  if (datos.descripcion !== undefined && typeof datos.descripcion !== 'string') {
    return res.status(400).json({ mensaje: 'descripcion debe ser texto' });
  }

  try {
    const nombreRol = datos.nombreRol.trim();
    const existente = await Role.findOne({
      $or: [{ nombreRol }, { nombre: nombreRol }],
    }).collation({ locale: 'es', strength: 2 });
    if (existente) return res.status(409).json({ mensaje: 'Ya existe un rol con ese nombre' });

    const usuario = nombreUsuario(req);
    const rol = await Role.create({
      nombreRol,
      descripcion: (datos.descripcion || '').trim(),
      permisos,
      activo: true,
      usuarioCreacion: usuario,
      usuarioActualizacion: usuario,
    });
    await registrarEvento({
      usuarioId: req.usuario.id,
      usuarioCreacion: usuario,
      accion: 'ROL_CREADO',
      detalles: { rolId: rol._id, nombreRol, permisos },
    });
    return res.status(201).json(rol);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'Ya existe un rol con ese nombre' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del rol no son válidos', detalle: error.message });
    }
    console.error('Error al crear rol:', error);
    return res.status(500).json({ mensaje: 'Error interno al crear el rol' });
  }
};

const actualizarRol = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'El id del rol no es válido' });

  const datos = req.body || {};
  const cambios = {};
  if (Object.hasOwn(datos, 'nombreRol')) {
    if (!validarNombre(datos.nombreRol)) {
      return res.status(400).json({ mensaje: 'nombreRol debe tener entre 2 y 60 caracteres' });
    }
    cambios.nombreRol = datos.nombreRol.trim();
    cambios.nombre = cambios.nombreRol;
  }
  if (Object.hasOwn(datos, 'descripcion')) {
    if (typeof datos.descripcion !== 'string') return res.status(400).json({ mensaje: 'descripcion debe ser texto' });
    cambios.descripcion = datos.descripcion.trim();
  }
  if (Object.hasOwn(datos, 'permisos')) {
    cambios.permisos = obtenerPermisos(datos.permisos);
    if (cambios.permisos === null) {
      return res.status(400).json({ mensaje: `permisos solo puede contener: ${MODULOS.join(', ')}` });
    }
  }
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ mensaje: 'Envía nombreRol, descripcion o permisos para actualizar' });
  }

  try {
    const rolActual = await Role.findById(id);
    if (!rolActual || rolActual.activo === false) return res.status(404).json({ mensaje: 'Rol activo no encontrado' });
    if (cambios.nombreRol) {
      const duplicado = await Role.findOne({
        _id: { $ne: id },
        $or: [{ nombreRol: cambios.nombreRol }, { nombre: cambios.nombreRol }],
      }).collation({ locale: 'es', strength: 2 });
      if (duplicado) return res.status(409).json({ mensaje: 'Ya existe un rol con ese nombre' });
    }

    const usuario = nombreUsuario(req);
    Object.assign(rolActual, cambios, { usuarioActualizacion: usuario, activo: true });
    await rolActual.save();
    await registrarEvento({
      usuarioId: req.usuario.id,
      usuarioCreacion: usuario,
      accion: 'ROL_MODIFICADO',
      detalles: { rolId: rolActual._id, cambios },
    });
    return res.status(200).json(rolActual);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'Ya existe un rol con ese nombre' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del rol no son válidos', detalle: error.message });
    }
    console.error('Error al actualizar rol:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar el rol' });
  }
};

const desactivarRol = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: 'El id del rol no es válido' });

  try {
    const rol = await Role.findById(id);
    if (!rol || rol.activo === false) return res.status(404).json({ mensaje: 'Rol activo no encontrado' });
    const asignaciones = await Usuario.countDocuments({ estado: 'activo', roles: rol._id });
    if (asignaciones > 0) {
      return res.status(409).json({
        mensaje: `No se puede desactivar el rol: está asignado a ${asignaciones} usuario(s) activo(s). Reasigna sus roles primero.`,
        usuariosActivosAsignados: asignaciones,
      });
    }

    const usuario = nombreUsuario(req);
    rol.activo = false;
    rol.usuarioActualizacion = usuario;
    await rol.save();
    await registrarEvento({
      usuarioId: req.usuario.id,
      usuarioCreacion: usuario,
      accion: 'ROL_DESACTIVADO',
      detalles: { rolId: rol._id, nombreRol: rol.nombreRol || rol.nombre },
    });
    return res.status(200).json({ mensaje: 'Rol desactivado correctamente', rol });
  } catch (error) {
    console.error('Error al desactivar rol:', error);
    return res.status(500).json({ mensaje: 'Error interno al desactivar el rol' });
  }
};

module.exports = { listarRoles, crearRol, actualizarRol, desactivarRol };
