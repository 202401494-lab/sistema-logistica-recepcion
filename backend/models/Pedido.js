const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

const pedidoSchema = new mongoose.Schema(
  {
    numeroPedido: { type: String, required: true, unique: true, immutable: true, trim: true },
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
    fechaHoraIngresoCola: { type: Date },
    minutosEnEspera: { type: Number, min: 0, default: 0 },
    prioridadCalculada: { type: Number, default: 0 },
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
      enum: [
        'PROGRAMADO', 'A TIEMPO', 'ANTICIPADO', 'TARDÍO', 'AUSENTE',
        'EN COLA', 'DESCARGANDO', 'FINALIZADO', 'CANCELADO',
      ],
      default: 'PROGRAMADO',
    },
  },
  { timestamps: true, collection: 'pedidos' }
);

pedidoSchema.plugin(auditoriaSoftDelete);
pedidoSchema.index({ activo: 1, estado: 1, fechaHoraIngresoCola: 1 });

module.exports = mongoose.model('Pedido', pedidoSchema);
