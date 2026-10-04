const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

const descargaSchema = new mongoose.Schema(
  {
    gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gateway', required: true },
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
    operadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaHoraInicio: { type: Date, required: true },
    fechaHoraFin: { type: Date },
    duracionMinutos: { type: Number, min: 0 },
  },
  { timestamps: true, collection: 'descargas' }
);

descargaSchema.plugin(auditoriaSoftDelete);

module.exports = mongoose.model('Descarga', descargaSchema);