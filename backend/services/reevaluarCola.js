const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const registrarEvento = require('./auditoriaEventos');

const reevaluarCola = async ({ gateway, usuarioId, usuario, session }) => {
  const siguiente = await Pedido.findOne({
    activo: true,
    estado: 'EN COLA',
    tipoProducto: gateway.tipoCargaPermitida,
    fechaHoraLlegadaReal: { $exists: true },
  }).sort({ fechaHoraLlegadaReal: 1, fechaCreacion: 1, _id: 1 }).session(session);

  if (!siguiente) return null;

  const gatewayAsignado = await Gateway.findOneAndUpdate(
    { _id: gateway._id, activo: true, estado: 'LIBRE' },
    { $set: { estado: 'OCUPADO', usuarioActualizacion: usuario } },
    { new: true, session, usuarioActualizacion: usuario },
  );
  if (!gatewayAsignado) return null;

  const pedidoIniciado = await Pedido.findOneAndUpdate(
    { _id: siguiente._id, activo: true, estado: 'EN COLA' },
    { $set: { estado: 'DESCARGANDO', usuarioActualizacion: usuario } },
    { new: true, session, usuarioActualizacion: usuario },
  );
  if (!pedidoIniciado) throw new Error('El pedido en cola cambió durante su asignación');

  const [descarga] = await Descarga.create([{
    gatewayId: gatewayAsignado._id,
    pedidoId: pedidoIniciado._id,
    operadorId: usuarioId,
    fechaHoraInicio: new Date(),
    usuarioCreacion: usuario,
    usuarioActualizacion: usuario,
  }], { session });

  await registrarEvento({
    usuarioId,
    usuarioCreacion: usuario,
    accion: 'GATEWAY_ASIGNADO',
    pedidoId: pedidoIniciado._id,
    detalles: { gatewayId: gatewayAsignado._id, automatico: true },
    session,
  });
  await registrarEvento({
    usuarioId,
    usuarioCreacion: usuario,
    accion: 'DESCARGADA_INICIADA',
    pedidoId: pedidoIniciado._id,
    detalles: { gatewayId: gatewayAsignado._id, descargaId: descarga._id, automatico: true },
    session,
  });

  return { descarga, pedido: pedidoIniciado, gateway: gatewayAsignado };
};

module.exports = reevaluarCola;