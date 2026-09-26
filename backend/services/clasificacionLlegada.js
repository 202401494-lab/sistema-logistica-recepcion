const CLAVE_TOLERANCIA_LLEGADA = 'TOLERANCIA_LLEGADA_MINUTOS';

const ESTADOS_PUNTUALIDAD = {
  A_TIEMPO: 'A tiempo',
  ANTICIPADO: 'Anticipado',
  TARDIO: 'Tardío',
  AUSENTE: 'Ausente',
};

const esToleranciaValida = (valor) => Number.isInteger(valor) && valor >= 0;

const obtenerFechaLlegada = (valor, ahora = new Date()) => {
  if (valor === undefined) return ahora;
  if (valor === null || valor === '') return null;

  const llegada = new Date(valor);
  if (Number.isNaN(llegada.getTime()) || llegada > ahora) return null;
  return llegada;
};

const clasificarLlegada = (llegada, inicioVentana, finVentana) => {
  if (llegada < inicioVentana) return ESTADOS_PUNTUALIDAD.ANTICIPADO;
  if (llegada <= finVentana) return ESTADOS_PUNTUALIDAD.A_TIEMPO;
  return ESTADOS_PUNTUALIDAD.TARDIO;
};

module.exports = {
  CLAVE_TOLERANCIA_LLEGADA,
  ESTADOS_PUNTUALIDAD,
  esToleranciaValida,
  obtenerFechaLlegada,
  clasificarLlegada,
};