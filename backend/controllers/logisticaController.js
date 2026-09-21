const mongoose = require('mongoose');
const Proveedor = require('../models/Proveedor');
const Pedido = require('../models/Pedido');

const HORA_APERTURA = 8;
const HORA_CIERRE = 17;
const DURACION_ALTERNATIVA_MINUTOS = 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDENTIFICACION_REGEX = /^[A-Za-z0-9][A-Za-z0-9-]{3,19}$/;

const esFechaValida = (valor) => {
  const fecha = new Date(valor);
  return valor && !Number.isNaN(fecha.getTime());
};

const estaEnHorarioOperativo = (inicio, fin) => {
  const mismaFecha = inicio.toDateString() === fin.toDateString();
  return mismaFecha
    && inicio.getHours() >= HORA_APERTURA
    && (fin.getHours() < HORA_CIERRE
      || (fin.getHours() === HORA_CIERRE && fin.getMinutes() === 0));
};

const haySolapamiento = (inicio, fin, pedidos) => pedidos.some(
  (pedido) => inicio < pedido.finVentana && fin > pedido.inicioVentana
);

const obtenerAlternativas = async (inicioSolicitado, duracionMinutos) => {
  const inicioDelDia = new Date(inicioSolicitado);
  inicioDelDia.setHours(HORA_APERTURA, 0, 0, 0);
  const finDelDia = new Date(inicioSolicitado);
  finDelDia.setHours(HORA_CIERRE, 0, 0, 0);
  const pedidos = await Pedido.find({
    estado: 'PROGRAMADO',
    inicioVentana: { $lt: finDelDia },
    finVentana: { $gt: inicioDelDia },
  }).select('inicioVentana finVentana');

  const alternativas = [];
  const duracion = duracionMinutos * 60 * 1000;
  for (
    let inicio = new Date(inicioDelDia);
    inicio.getTime() + duracion <= finDelDia.getTime();
    inicio.setMinutes(inicio.getMinutes() + 30)
  ) {
    const fin = new Date(inicio.getTime() + duracion);
    if (!haySolapamiento(inicio, fin, pedidos)) {
      alternativas.push({ inicioVentana: inicio.toISOString(), finVentana: fin.toISOString() });
    }
    if (alternativas.length === 3) break;
  }
  return alternativas;
};

const registrarProveedor = async (req, res) => {
  try {
    const datos = req.body;
    if (!datos.razonSocial || !datos.identificacionTributaria || !datos.categoria
      || !datos.contactoNombre || !datos.telefono || !datos.emailContacto) {
      return res.status(400).json({ mensaje: 'Todos los campos del proveedor son obligatorios' });
    }
    if (!IDENTIFICACION_REGEX.test(String(datos.identificacionTributaria).trim())) {
      return res.status(400).json({ mensaje: 'La identificacionTributaria tiene un formato inválido' });
    }
    if (!EMAIL_REGEX.test(String(datos.emailContacto).trim())) {
      return res.status(400).json({ mensaje: 'El emailContacto tiene un formato inválido' });
    }
    if (!['construcción', 'general'].includes(datos.categoria)) {
      return res.status(400).json({ mensaje: 'La categoria debe ser construcción o general' });
    }

    const identificacion = String(datos.identificacionTributaria).trim().toUpperCase();
    const existente = await Proveedor.findOne({ identificacionTributaria: identificacion });
    if (existente) {
      return res.status(409).json({ mensaje: 'La identificacionTributaria ya está registrada' });
    }

    const proveedor = await Proveedor.create({ ...datos, identificacionTributaria: identificacion });
    return res.status(201).json(proveedor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'La identificacionTributaria ya está registrada' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del proveedor no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listarProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find().sort({ razonSocial: 1 });
    return res.status(200).json(proveedores);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const crearPedido = async (req, res) => {
  try {
    const {
      numeroPedido,
      proveedorId,
      tipoProducto,
      fechaHoraProgramada,
      inicioVentana,
      finVentana,
      duracionEstimadaMinutos,
    } = req.body;

    if (!numeroPedido || !proveedorId || !tipoProducto || !fechaHoraProgramada
      || !inicioVentana || !finVentana || duracionEstimadaMinutos === undefined) {
      return res.status(400).json({ mensaje: 'Todos los campos del pedido son obligatorios' });
    }
    if (!mongoose.isValidObjectId(proveedorId)) {
      return res.status(400).json({ mensaje: 'El proveedorId no tiene un formato válido' });
    }
    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({ mensaje: 'El proveedorId no corresponde a un proveedor registrado' });
    }
    if (!['construcción', 'general'].includes(tipoProducto)) {
      return res.status(400).json({ mensaje: 'El tipoProducto debe ser construcción o general' });
    }
    const duracion = Number(duracionEstimadaMinutos);
    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(400).json({ mensaje: 'La duracionEstimadaMinutos debe ser mayor a cero' });
    }
    if (!esFechaValida(fechaHoraProgramada) || !esFechaValida(inicioVentana) || !esFechaValida(finVentana)) {
      return res.status(400).json({ mensaje: 'Las fechas del pedido no son válidas' });
    }

    const inicio = new Date(inicioVentana);
    const fin = new Date(finVentana);
    const programada = new Date(fechaHoraProgramada);
    if (fin <= inicio) {
      return res.status(400).json({ mensaje: 'finVentana debe ser posterior a inicioVentana' });
    }
    if (!estaEnHorarioOperativo(inicio, fin)) {
      return res.status(400).json({ mensaje: 'La ventana debe estar entre las 08:00 y las 17:00 del mismo día' });
    }
    if (programada < inicio || programada > fin) {
      return res.status(400).json({ mensaje: 'fechaHoraProgramada debe estar dentro de la ventana solicitada' });
    }

    const pedidoExistente = await Pedido.findOne({ numeroPedido: String(numeroPedido).trim() });
    if (pedidoExistente) {
      return res.status(409).json({ mensaje: 'El numeroPedido ya está registrado' });
    }

    const solapado = await Pedido.findOne({
      estado: 'PROGRAMADO',
      inicioVentana: { $lt: fin },
      finVentana: { $gt: inicio },
    });
    if (solapado) {
      const alternativas = await obtenerAlternativas(inicio, duracion);
      return res.status(409).json({
        mensaje: 'La ventana solicitada se solapa con otro pedido programado',
        alternativas,
      });
    }

    const pedido = await Pedido.create({
      ...req.body,
      numeroPedido: String(numeroPedido).trim(),
      proveedorId,
      fechaHoraProgramada: programada,
      inicioVentana: inicio,
      finVentana: fin,
      duracionEstimadaMinutos: duracion,
      estado: 'PROGRAMADO',
    });
    return res.status(201).json(pedido);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: 'El numeroPedido ya está registrado' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Los datos del pedido no son válidos', detalle: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('proveedorId', 'razonSocial identificacionTributaria').sort({ inicioVentana: 1 });
    return res.status(200).json(pedidos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  registrarProveedor,
  listarProveedores,
  crearPedido,
  listarPedidos,
};
