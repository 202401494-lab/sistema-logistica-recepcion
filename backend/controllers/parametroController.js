const mongoose = require('mongoose');
const Parametro = require('../models/Parametro');
const {
  CLAVE_TOLERANCIA_LLEGADA,
  esToleranciaValida,
} = require('../services/clasificacionLlegada');

const prepararClaveYValor = (clave, valor) => {
  const claveNormalizada = String(clave || '').trim().toUpperCase();
  if (!claveNormalizada) return { error: 'La clave del parámetro es obligatoria' };
  if (claveNormalizada === CLAVE_TOLERANCIA_LLEGADA && !esToleranciaValida(valor)) {
    return { error: 'La tolerancia debe ser un número entero mayor o igual a cero' };
  }
  return { clave: claveNormalizada, valor };
};

const listarParametros = async (req, res) => {
  try {
    const parametros = await Parametro.find().sort({ clave: 1 });
    return res.status(200).json(parametros);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const crearParametro = async (req, res) => {
  try {
    const datos = req.body && typeof req.body === 'object' ? req.body : {};
    if (datos.valor === undefined || datos.valor === null) {
      return res.status(400).json({ mensaje: 'La clave y el valor del parámetro son obligatorios' });
    }
    const preparado = prepararClaveYValor(datos.clave, datos.valor);
    if (preparado.error) return res.status(400).json({ mensaje: preparado.error });

    const usuario = req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';
    const existente = await Parametro.findOne({ clave: preparado.clave })
      .setOptions({ incluirInactivos: true });
    if (existente?.activo) {
      return res.status(409).json({ mensaje: 'La clave del parámetro ya existe' });
    }
    if (existente) {
      const cambios = {
        valor: preparado.valor,
        activo: true,
        usuarioActualizacion: usuario,
      };
      if (datos.descripcion !== undefined) cambios.descripcion = datos.descripcion;
      const reactivado = await Parametro.findOneAndUpdate(
        { _id: existente._id, activo: false },
        { $set: cambios },
        { new: true, runValidators: true, usuarioActualizacion: usuario, incluirInactivos: true },
      );
      if (!reactivado) return res.status(409).json({ mensaje: 'No se pudo reactivar el parámetro' });
      return res.status(200).json(reactivado);
    }

    const parametro = new Parametro({
      ...preparado,
      descripcion: datos.descripcion,
      usuarioCreacion: usuario,
      usuarioActualizacion: usuario,
    });
    await parametro.save({ usuarioActualizacion: usuario });
    return res.status(201).json(parametro);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'La clave del parámetro ya existe' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del parámetro no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizarParametro = async (req, res) => {
  try {
    const datos = req.body && typeof req.body === 'object' ? req.body : {};
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id del parámetro no es válido' });
    }
    const cambios = {};
    if (datos.clave !== undefined) cambios.clave = datos.clave;
    if (datos.valor !== undefined) cambios.valor = datos.valor;
    if (datos.descripcion !== undefined) cambios.descripcion = datos.descripcion;
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ mensaje: 'Debe enviar al menos un campo para actualizar' });
    }

    const existente = await Parametro.findOne({ _id: req.params.id });
    if (!existente) return res.status(404).json({ mensaje: 'Parámetro no encontrado' });
    const claveFinal = cambios.clave === undefined ? existente.clave : cambios.clave;
    const valorFinal = cambios.valor === undefined ? existente.valor : cambios.valor;
    const preparado = prepararClaveYValor(claveFinal, valorFinal);
    if (preparado.error) return res.status(400).json({ mensaje: preparado.error });
    cambios.clave = preparado.clave;

    const usuario = req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';
    const parametro = await Parametro.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { $set: { ...cambios, usuarioActualizacion: usuario } },
      { new: true, runValidators: true, usuarioActualizacion: usuario },
    );
    if (!parametro) return res.status(404).json({ mensaje: 'Parámetro no encontrado' });
    return res.status(200).json(parametro);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'La clave del parámetro ya existe' });
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Los datos del parámetro no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const inactivarParametro = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id del parámetro no es válido' });
    }
    const usuario = req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';
    const parametro = await Parametro.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { $set: { activo: false, usuarioActualizacion: usuario } },
      { new: true, usuarioActualizacion: usuario },
    );
    if (!parametro) return res.status(404).json({ mensaje: 'Parámetro no encontrado' });
    return res.status(200).json(parametro);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  listarParametros,
  crearParametro,
  actualizarParametro,
  inactivarParametro,
};