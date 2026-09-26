const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

const pedidoSchema = new mongoose.Schema(
  {
    numeroPedido: { type: String, required: true, unique: true, trim: true },
    proveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: true,
    },
    tipoProducto: {
      type: String,
      required: true,
      enum: ['construcción', 'general'],
    },
    fechaHoraProgramada: { type: Date, required: true },
    // La llegada actualiza el pedido existente; no se crea una colección arribos.
    fechaHoraLlegadaReal: { type: Date },
    estadoPuntualidad: {
      type: String,
      enum: ['A tiempo', 'Anticipado', 'Tardío', 'Ausente'],
    },
    enEspera: { type: Boolean, default: false },
    inicioVentana: { type: Date, required: true },
    finVentana: { type: Date, required: true },
    duracionEstimadaMinutos: { type: Number, required: true, min: 1 },
    estado: {
      type: String,
      enum: ['PROGRAMADO', 'CANCELADO', 'ATENDIDO'],
      default: 'PROGRAMADO',
    },
  },
  { timestamps: true, collection: 'pedidos' }
);

pedidoSchema.plugin(auditoriaSoftDelete);

module.exports = mongoose.model('Pedido', pedidoSchema);
