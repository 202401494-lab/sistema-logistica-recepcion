const Contador = require('../models/Contador');
const Parametro = require('../models/Parametro');
const Pedido = require('../models/Pedido');

const escaparRegex = (valor) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generarNumeroPedido = async () => {
  const parametro = await Parametro.findOne({ clave: /^numero_equipo$/i, activo: true });
  const equipo = String(parametro?.valor ?? '').trim();
  if (!/^\d+$/.test(equipo)) {
    const error = new Error('El parámetro numero_equipo no está configurado correctamente');
    error.status = 500;
    throw error;
  }

  const prefijo = `PED-EQUI${equipo}-`;
  const patron = new RegExp(`^${escaparRegex(prefijo)}(\\d{9})$`);
  const existentes = await Pedido.aggregate([
    { $match: { numeroPedido: patron } },
    { $project: { correlativo: { $toLong: { $substrBytes: ['$numeroPedido', prefijo.length, 9] } } } },
    { $group: { _id: null, ultimo: { $max: '$correlativo' } } },
  ]);
  const ultimoExistente = existentes[0]?.ultimo || 0;
  const clave = `PED-EQUI${equipo}`;
  try {
    await Contador.updateOne(
      { clave },
      { $setOnInsert: { secuencia: ultimoExistente } },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  const contador = await Contador.findOneAndUpdate(
    { clave },
    { $inc: { secuencia: 1 } },
    { new: true },
  );

  if (!contador || contador.secuencia > 999999999) {
    const error = new Error('Se agotó la secuencia de números de pedido para este equipo');
    error.status = 409;
    throw error;
  }
  return `${prefijo}${String(contador.secuencia).padStart(9, '0')}`;
};

module.exports = generarNumeroPedido;