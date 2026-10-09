const Descarga = require('../models/Descarga');
const Gateway = require('../models/Gateway');
const Pedido = require('../models/Pedido');
const calcularKpis = require('../services/calcularKpis');

const parsearFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerKpis = async (req, res) => {
  try {
    const ahora = new Date();
    const desdeSolicitado = parsearFecha(req.query.desde);
    const hastaSolicitado = parsearFecha(req.query.hasta);
    if ((req.query.desde && !desdeSolicitado) || (req.query.hasta && !hastaSolicitado)) {
      return res.status(400).json({ mensaje: 'desde y hasta deben ser fechas válidas' });
    }
    const hasta = hastaSolicitado || ahora;
    const desde = desdeSolicitado || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (hasta > ahora) return res.status(400).json({ mensaje: 'hasta no puede ser una fecha futura' });
    if (desde >= hasta) return res.status(400).json({ mensaje: 'desde debe ser anterior a hasta' });

    const [pedidos, descargas, gateways] = await Promise.all([
      Pedido.find({ fechaHoraLlegadaReal: { $gte: desde, $lt: hasta } })
        .select('fechaHoraLlegadaReal estadoPuntualidad')
        .lean(),
      Descarga.find({
        fechaHoraInicio: { $lt: hasta },
        $or: [{ fechaHoraFin: { $gte: desde } }, { fechaHoraFin: { $exists: false } }],
      })
        .populate('pedidoId', 'tipoProducto fechaHoraLlegadaReal')
        .populate('gatewayId', 'numeroGateway')
        .select('pedidoId gatewayId fechaHoraInicio fechaHoraFin duracionMinutos')
        .lean(),
      Gateway.find().select('numeroGateway estado').lean(),
    ]);

    return res.status(200).json(calcularKpis({ pedidos, descargas, gateways, desde, hasta, ahora }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { obtenerKpis };