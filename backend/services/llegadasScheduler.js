const Pedido = require('../models/Pedido');
const Parametro = require('../models/Parametro');
const {
  CLAVE_TOLERANCIA_LLEGADA,
  ESTADOS_PUNTUALIDAD,
  esToleranciaValida,
} = require('./clasificacionLlegada');

const actualizarEstadosLlegadas = async (ahora = new Date()) => {
  await Pedido.updateMany(
    {
      activo: true,
      estado: 'PROGRAMADO',
      enEspera: true,
      inicioVentana: { $lte: ahora },
    },
    { $set: { enEspera: false } },
    { usuarioActualizacion: 'sistema' },
  );

  const parametro = await Parametro.findOne({ clave: CLAVE_TOLERANCIA_LLEGADA });
  if (!parametro || !esToleranciaValida(parametro.valor)) return;

  const limiteAusencia = new Date(ahora.getTime() - parametro.valor * 60 * 1000);
  await Pedido.updateMany(
    {
      activo: true,
      estado: 'PROGRAMADO',
      fechaHoraLlegadaReal: { $exists: false },
      estadoPuntualidad: { $ne: ESTADOS_PUNTUALIDAD.AUSENTE },
      finVentana: { $lte: limiteAusencia },
    },
    { $set: { estadoPuntualidad: ESTADOS_PUNTUALIDAD.AUSENTE, enEspera: false } },
    { usuarioActualizacion: 'sistema' },
  );
};

module.exports = actualizarEstadosLlegadas;