const mongoose = require('mongoose');
const actualizarColaPrioridad = require('../services/actualizarColaPrioridad');

const nombreUsuario = (req) => req.usuario?.nombreCompleto || req.usuario?.email || 'sistema';

const reevaluar = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!mongoose.isValidObjectId(usuarioId)) {
    return res.status(401).json({ mensaje: 'No se pudo identificar al usuario autenticado' });
  }

  try {
    const resultado = await actualizarColaPrioridad({
      usuarioId,
      usuario: nombreUsuario(req),
      poblarProveedor: true,
    });
    return res.status(200).json({
      cola: resultado.cola,
      factorAgingMinutos: resultado.factorAgingMinutos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: error.message || 'Error interno del servidor' });
  }
};

const listarCola = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!mongoose.isValidObjectId(usuarioId)) {
    return res.status(401).json({ mensaje: 'No se pudo identificar al usuario autenticado' });
  }

  try {
    const resultado = await actualizarColaPrioridad({
      usuarioId,
      usuario: nombreUsuario(req),
      poblarProveedor: true,
    });
    return res.status(200).json(resultado.cola);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: error.message || 'Error interno del servidor' });
  }
};

module.exports = { listarCola, reevaluar };
