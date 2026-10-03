const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

const gatewaySchema = new mongoose.Schema(
  {
    numeroGateway: { type: Number, required: true, unique: true, min: 1, max: 5, validate: Number.isInteger },
    tipoCargaPermitida: { type: String, required: true, enum: ['general', 'construcción'] },
    estado: {
      type: String,
      required: true,
      enum: ['LIBRE', 'OCUPADO', 'FUERA DE SERVICIO'],
      default: 'LIBRE',
    },
  },
  { timestamps: true, collection: 'gateways' }
);

gatewaySchema.pre('validate', function validarCargaPorGateway(next) {
  if (this.numeroGateway >= 1 && this.numeroGateway <= 4 && this.tipoCargaPermitida !== 'general') {
    this.invalidate('tipoCargaPermitida', 'Los gateways 1 al 4 solo permiten carga general');
  }
  if (this.numeroGateway === 5 && this.tipoCargaPermitida !== 'construcción') {
    this.invalidate('tipoCargaPermitida', 'El gateway 5 solo permite carga de construcción');
  }
  next();
});

gatewaySchema.plugin(auditoriaSoftDelete);

module.exports = mongoose.model('Gateway', gatewaySchema);