const mongoose = require('mongoose');

const ACCIONES_EVENTO = [
  'LLEGADA_REGISTRADA',
  'GATEWAY_ASIGNADO',
  'DESCARGADA_INICIADA',
  'DESCARGA_FINALIZADA',
  'CITA_REPROGRAMADA',
  'GATEWAY_MANTENIMIENTO',
];

const eventoSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, immutable: true },
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', immutable: true },
    accion: { type: String, required: true, enum: ACCIONES_EVENTO, immutable: true },
    detalles: { type: mongoose.Schema.Types.Mixed, default: {}, immutable: true },
    fechaHora: { type: Date, required: true, default: Date.now, immutable: true },
    activo: { type: Boolean, default: true, immutable: true },
    usuarioCreacion: { type: String, required: true, immutable: true },
    fechaCreacion: { type: Date, default: Date.now, immutable: true },
  },
  { collection: 'eventos', versionKey: false },
);

eventoSchema.pre('save', function impedirEdicionEvento(next) {
  if (!this.isNew) return next(new mongoose.Error('Los eventos son inmutables'));
  return next();
});

eventoSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'],
  function impedirActualizacionEvento() {
    throw new mongoose.Error('Los eventos son inmutables');
  },
);

eventoSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'],
  function impedirBorradoEvento() {
    throw new mongoose.Error('Los eventos no se pueden eliminar');
  },
);

module.exports = mongoose.model('Evento', eventoSchema);
module.exports.ACCIONES_EVENTO = ACCIONES_EVENTO;