const mongoose = require('mongoose');
const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const registrarEvento = require('../services/auditoriaEventos');
const ejecutarTransaccion = require('../services/transaccionMongo');
const reevaluarCola = require('../services/reevaluarCola');

const nombreUsuario = (req) => req.usuario?.nombreCompleto
  || req.usuario?.email
  || 'sistema';

const cargaEsperada = (numeroGateway) => (numeroGateway === 5 ? 'construcción' : 'general');

const validarGateway = (numeroGateway, tipoCargaPermitida) => {
  if (!Number.isInteger(numeroGateway) || numeroGateway < 1 || numeroGateway > 5) {
    return 'numeroGateway debe ser un entero entre 1 y 5';
  }
  if (!['general', 'construcción'].includes(tipoCargaPermitida)) {
    return 'tipoCargaPermitida debe ser general o construcción';
  }
  if (cargaEsperada(numeroGateway) !== tipoCargaPermitida) {
    return numeroGateway === 5
      ? 'El gateway 5 solo permite carga de construcción'
      : 'Los gateways 1 al 4 solo permiten carga general';
  }
  return null;
};

const listarGateways = async (req, res) => {
  try {
    const gateways = await Gateway.find().sort({ numeroGateway: 1 });
    return res.status(200).json(gateways);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const crearGateway = async (req, res) => {
  try {
    const datos = req.body && typeof req.body === 'object' ? req.body : {};
    const numeroGateway = Number(datos.numeroGateway);
    const errorValidacion = validarGateway(numeroGateway, datos.tipoCargaPermitida);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });
    if (datos.estado === 'OCUPADO') {
      return res.status(400).json({ mensaje: 'El estado OCUPADO solo se asigna al iniciar una descarga' });
    }

    const gateway = await Gateway.create({
      numeroGateway,
      tipoCargaPermitida: datos.tipoCargaPermitida,
      estado: datos.estado || 'LIBRE',
      usuarioCreacion: nombreUsuario(req),
      usuarioActualizacion: nombreUsuario(req),
    });
    return res.status(201).json(gateway);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'El numeroGateway ya está registrado' });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del gateway no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerGateway = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id del gateway no es válido' });
    }
    const gateway = await Gateway.findOne({ _id: req.params.id, activo: true });
    if (!gateway) return res.status(404).json({ mensaje: 'Gateway no encontrado' });
    return res.status(200).json(gateway);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizarGateway = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id del gateway no es válido' });
    }
    const datos = req.body && typeof req.body === 'object' ? req.body : {};
    const cambios = {};
    for (const campo of ['numeroGateway', 'tipoCargaPermitida', 'estado']) {
      if (datos[campo] !== undefined) cambios[campo] = datos[campo];
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ mensaje: 'Debe enviar al menos un campo para actualizar' });
    }

    const gatewayActual = await Gateway.findOne({ _id: req.params.id, activo: true });
    if (!gatewayActual) return res.status(404).json({ mensaje: 'Gateway no encontrado' });
    if (gatewayActual.estado === 'OCUPADO'
      && cambios.estado !== undefined && cambios.estado !== gatewayActual.estado) {
      return res.status(400).json({ mensaje: 'Finalice la descarga antes de cambiar el estado del gateway' });
    }
    if (gatewayActual.estado !== 'OCUPADO' && cambios.estado === 'OCUPADO') {
      return res.status(400).json({ mensaje: 'El estado OCUPADO solo se asigna al iniciar una descarga' });
    }
    if (gatewayActual.estado === 'OCUPADO'
      && cambios.tipoCargaPermitida !== undefined
      && cambios.tipoCargaPermitida !== gatewayActual.tipoCargaPermitida) {
      return res.status(400).json({ mensaje: 'No se puede cambiar el tipo de carga de un gateway ocupado' });
    }

    const numeroFinal = Number(cambios.numeroGateway ?? gatewayActual.numeroGateway);
    const tipoFinal = cambios.tipoCargaPermitida ?? gatewayActual.tipoCargaPermitida;
    const errorValidacion = validarGateway(numeroFinal, tipoFinal);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });
    if (cambios.numeroGateway !== undefined) cambios.numeroGateway = numeroFinal;

    const esCambioMantenimiento = cambios.estado !== undefined
      && cambios.estado !== gatewayActual.estado
      && (cambios.estado === 'FUERA DE SERVICIO' || gatewayActual.estado === 'FUERA DE SERVICIO');
    const usuario = nombreUsuario(req);
    const usuarioId = req.usuario?.id;
    if (esCambioMantenimiento && !mongoose.isValidObjectId(usuarioId)) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al usuario autenticado' });
    }
    let gateway;
    await ejecutarTransaccion(async (session) => {
      gateway = await Gateway.findOneAndUpdate(
        { _id: req.params.id, activo: true, estado: gatewayActual.estado },
        { $set: { ...cambios, usuarioActualizacion: usuario } },
        { new: true, runValidators: true, session, usuarioActualizacion: usuario },
      );
      if (gateway && esCambioMantenimiento) {
        await registrarEvento({
          usuarioId,
          usuarioCreacion: usuario,
          accion: 'GATEWAY_MANTENIMIENTO',
          detalles: { gatewayId: gateway._id, estadoAnterior: gatewayActual.estado, estadoNuevo: gateway.estado },
          session,
        });
      }
    });
    if (!gateway) {
      const estadoActual = await Gateway.findOne({ _id: req.params.id, activo: true });
      if (!estadoActual) return res.status(404).json({ mensaje: 'Gateway no encontrado' });
      if (estadoActual.estado === 'OCUPADO'
        && (cambios.estado !== undefined || cambios.tipoCargaPermitida !== undefined)) {
        return res.status(400).json({ mensaje: 'No se puede reconfigurar un gateway ocupado' });
      }
      return res.status(409).json({ mensaje: 'El gateway cambió; actualice e intente nuevamente' });
    }
    return res.status(200).json(gateway);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'El numeroGateway ya está registrado' });
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Los datos del gateway no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const inactivarGateway = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'El id del gateway no es válido' });
    }
    const usuario = nombreUsuario(req);
    const gateway = await Gateway.findOneAndUpdate(
      { _id: req.params.id, activo: true, estado: { $in: ['LIBRE', 'FUERA DE SERVICIO'] } },
      { $set: { activo: false, usuarioActualizacion: usuario } },
      { new: true, usuarioActualizacion: usuario },
    );
    if (gateway) return res.status(200).json(gateway);

    const existente = await Gateway.findOne({ _id: req.params.id, activo: true });
    if (existente?.estado === 'OCUPADO') {
      return res.status(400).json({ mensaje: 'Finalice la descarga antes de inactivar el gateway' });
    }
    return res.status(404).json({ mensaje: 'Gateway no encontrado' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ mensaje: 'El id del gateway no es válido' });
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const iniciarDescarga = async (req, res) => {
  try {
    const { pedidoId, gatewayId } = req.body || {};
    if (!mongoose.isValidObjectId(pedidoId) || !mongoose.isValidObjectId(gatewayId)) {
      return res.status(400).json({ mensaje: 'pedidoId y gatewayId deben ser identificadores válidos' });
    }
    const operadorId = req.usuario?.id;
    if (!mongoose.isValidObjectId(operadorId)) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al operador autenticado' });
    }

    const [pedido, gateway] = await Promise.all([
      Pedido.findOne({ _id: pedidoId, activo: true }),
      Gateway.findOne({ _id: gatewayId, activo: true }),
    ]);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    if (!gateway) return res.status(404).json({ mensaje: 'Gateway no encontrado' });
    if (gateway.estado !== 'LIBRE') {
      return res.status(400).json({ mensaje: 'El gateway debe estar LIBRE para iniciar una descarga' });
    }
    const cargaEsperadaGateway = cargaEsperada(gateway.numeroGateway);
    if (gateway.tipoCargaPermitida !== cargaEsperadaGateway
      || pedido.tipoProducto !== gateway.tipoCargaPermitida) {
      return res.status(400).json({ mensaje: 'El tipo de producto no es compatible con este gateway' });
    }
    if (['DESCARGANDO', 'FINALIZADO', 'CANCELADO', 'AUSENTE'].includes(pedido.estado)) {
      return res.status(409).json({ mensaje: 'El pedido no está disponible para iniciar una descarga' });
    }

    const usuario = nombreUsuario(req);
    let descarga;
    await ejecutarTransaccion(async (session) => {
      const gatewayOcupado = await Gateway.findOneAndUpdate(
        { _id: gatewayId, activo: true, estado: 'LIBRE' },
        { $set: { estado: 'OCUPADO', usuarioActualizacion: usuario } },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!gatewayOcupado) throw Object.assign(new Error('El gateway dejó de estar libre; actualice e intente nuevamente'), { status: 409 });

      const pedidoDescargando = await Pedido.findOneAndUpdate(
        { _id: pedidoId, activo: true, estado: { $nin: ['DESCARGANDO', 'FINALIZADO', 'CANCELADO', 'AUSENTE'] } },
        { $set: { estado: 'DESCARGANDO', usuarioActualizacion: usuario } },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!pedidoDescargando) throw Object.assign(new Error('El pedido dejó de estar disponible; actualice e intente nuevamente'), { status: 409 });

      [descarga] = await Descarga.create([{
        gatewayId,
        pedidoId,
        operadorId,
        fechaHoraInicio: new Date(),
        usuarioCreacion: usuario,
        usuarioActualizacion: usuario,
      }], { session });
      await registrarEvento({
        usuarioId: operadorId,
        usuarioCreacion: usuario,
        accion: 'GATEWAY_ASIGNADO',
        pedidoId,
        detalles: { gatewayId },
        session,
      });
      await registrarEvento({
        usuarioId: operadorId,
        usuarioCreacion: usuario,
        accion: 'DESCARGADA_INICIADA',
        pedidoId,
        detalles: { gatewayId, descargaId: descarga._id },
        session,
      });
    });
    return res.status(201).json(descarga);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Los datos de la descarga no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const finalizarDescarga = async (req, res) => {
  try {
    const { descargasId } = req.body || {};
    if (!mongoose.isValidObjectId(descargasId)) {
      return res.status(400).json({ mensaje: 'descargasId debe ser un identificador válido' });
    }
    const descargaActual = await Descarga.findOne({ _id: descargasId, activo: true });
    if (!descargaActual) return res.status(404).json({ mensaje: 'Descarga no encontrada' });
    if (descargaActual.fechaHoraFin) {
      return res.status(409).json({ mensaje: 'La descarga ya fue finalizada' });
    }

    const fechaHoraFin = new Date();
    const duracionMinutos = Math.max(
      0,
      Math.floor((fechaHoraFin.getTime() - new Date(descargaActual.fechaHoraInicio).getTime()) / 60000),
    );
    const usuario = nombreUsuario(req);
    const usuarioId = req.usuario?.id;
    if (!mongoose.isValidObjectId(usuarioId)) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al usuario autenticado' });
    }
    let resultado;
    await ejecutarTransaccion(async (session) => {
      const descarga = await Descarga.findOneAndUpdate(
        { _id: descargasId, activo: true, fechaHoraFin: { $exists: false } },
        { $set: { fechaHoraFin, duracionMinutos, usuarioActualizacion: usuario } },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!descarga) throw Object.assign(new Error('La descarga ya fue finalizada'), { status: 409 });

      const pedido = await Pedido.findOneAndUpdate(
        { _id: descarga.pedidoId, activo: true, estado: 'DESCARGANDO' },
        { $set: { estado: 'FINALIZADO', usuarioActualizacion: usuario } },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!pedido) throw Object.assign(new Error('El pedido asociado no está en estado DESCARGANDO'), { status: 409 });

      const gateway = await Gateway.findOneAndUpdate(
        { _id: descarga.gatewayId, activo: true, estado: 'OCUPADO' },
        { $set: { estado: 'LIBRE', usuarioActualizacion: usuario } },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!gateway) throw Object.assign(new Error('El gateway asociado no está ocupado'), { status: 409 });

      await registrarEvento({
        usuarioId,
        usuarioCreacion: usuario,
        accion: 'DESCARGA_FINALIZADA',
        pedidoId: pedido._id,
        detalles: { descargaId: descarga._id, gatewayId: gateway._id, fechaHoraFin, duracionMinutos },
        fechaHora: fechaHoraFin,
        session,
      });
      const siguiente = await reevaluarCola({ gateway, usuarioId, usuario, session });
      resultado = { descarga, pedido, gateway: siguiente?.gateway || gateway, siguiente };
    });

    return res.status(200).json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    if (error.name === 'CastError') return res.status(400).json({ mensaje: 'El id de la descarga no es válido' });
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  listarGateways,
  obtenerGateway,
  crearGateway,
  actualizarGateway,
  inactivarGateway,
  iniciarDescarga,
  finalizarDescarga,
};