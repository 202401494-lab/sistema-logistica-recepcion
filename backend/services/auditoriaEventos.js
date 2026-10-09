const Evento = require('../models/Evento');

const registrarEvento = async ({
  usuarioId,
  usuarioCreacion,
  accion,
  pedidoId,
  detalles = {},
  fechaHora = new Date(),
  session,
}) => {
  const evento = new Evento({
    usuarioId,
    usuarioCreacion,
    accion,
    pedidoId,
    detalles,
    fechaHora,
  });
  await evento.save({ session });
  return evento;
};

module.exports = registrarEvento;