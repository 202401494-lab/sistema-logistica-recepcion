const Parametro = require('../models/Parametro');
const Pedido = require('../models/Pedido');
const registrarEvento = require('./auditoriaEventos');
const {
  ColaPrioridad,
  calcularMinutosEnEspera,
  calcularPrioridad,
  obtenerFechaIngresoCola,
  obtenerPuntuacionBase,
} = require('./colaPrioridad');

const obtenerFactorAging = async (session) => {
  let consulta = Parametro.findOne({ clave: /^factor_aging_min$/i, activo: true });
  if (session) consulta = consulta.session(session);
  const parametro = await consulta;
  if (!parametro) return 15;

  const factor = Number(parametro.valor);
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error('El parámetro factor_aging_min debe ser un número mayor a cero');
  }
  return factor;
};

const actualizarColaPrioridad = async ({
  usuarioId,
  usuario,
  session,
  ahora = new Date(),
  poblarProveedor = false,
  ordenar = true,
}) => {
  const factorAgingMinutos = await obtenerFactorAging(session);
  let consulta = Pedido.find({ activo: true, estado: 'EN COLA' });
  if (poblarProveedor) consulta = consulta.populate('proveedorId', 'razonSocial categoria');
  if (session) consulta = consulta.session(session);
  const pedidos = await consulta;
  const actualizados = [];

  for (const pedido of pedidos) {
    const fechaHoraIngresoCola = obtenerFechaIngresoCola(pedido);
    const datosPedido = typeof pedido.toObject === 'function' ? pedido.toObject() : pedido;
    const minutosEnEspera = calcularMinutosEnEspera({ ...datosPedido, fechaHoraIngresoCola }, ahora);
    const prioridadCalculada = calcularPrioridad(pedido, minutosEnEspera, factorAgingMinutos);
    const prioridadAnterior = Number.isFinite(pedido.prioridadCalculada)
      ? pedido.prioridadCalculada
      : obtenerPuntuacionBase(pedido);
    const minutosAnteriores = Number.isFinite(pedido.minutosEnEspera) ? pedido.minutosEnEspera : 0;
    const intervalosAnteriores = Math.floor(minutosAnteriores / factorAgingMinutos);
    const intervalosActuales = Math.floor(minutosEnEspera / factorAgingMinutos);
    const requiereActualizacion = pedido.prioridadCalculada !== prioridadCalculada
      || pedido.minutosEnEspera !== minutosEnEspera
      || !pedido.fechaHoraIngresoCola;

    let pedidoActualizado = pedido;
    if (requiereActualizacion) {
      pedidoActualizado = await Pedido.findOneAndUpdate(
        { _id: pedido._id, activo: true, estado: 'EN COLA' },
        {
          $set: {
            fechaHoraIngresoCola,
            minutosEnEspera,
            prioridadCalculada,
            usuarioActualizacion: usuario,
          },
        },
        { new: true, session, usuarioActualizacion: usuario },
      );
      if (!pedidoActualizado) continue;
    }

    if (prioridadCalculada > prioridadAnterior && intervalosActuales > 0) {
      const intervalosAplicados = Math.max(1, intervalosActuales - intervalosAnteriores);
      await registrarEvento({
        usuarioId,
        usuarioCreacion: usuario,
        accion: 'AGING_APLICADO',
        pedidoId: pedido._id,
        detalles: {
          minutosEnEspera,
          intervalosAging: intervalosAplicados,
          incremento: prioridadCalculada - prioridadAnterior,
          prioridadAnterior,
          prioridadNueva: prioridadCalculada,
        },
        session,
        fechaHora: ahora,
      });
    }
    if (poblarProveedor) {
      const datosActualizados = typeof pedidoActualizado.toObject === 'function'
        ? pedidoActualizado.toObject()
        : pedidoActualizado;
      actualizados.push({ ...datosActualizados, proveedorId: pedido.proveedorId });
    } else {
      actualizados.push(pedidoActualizado);
    }
  }

  const colaPrioridad = new ColaPrioridad(actualizados);
  return {
    cola: ordenar ? colaPrioridad.obtenerOrdenados() : undefined,
    colaPrioridad: ordenar ? undefined : colaPrioridad,
    factorAgingMinutos,
  };
};

module.exports = actualizarColaPrioridad;
