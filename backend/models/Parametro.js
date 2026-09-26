const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

// Parámetros del sistema comparten soft delete y auditoría con proveedores y pedidos.
const parametroSchema = new mongoose.Schema(
  {
    clave: { type: String, required: true, unique: true, trim: true },
    valor: { type: mongoose.Schema.Types.Mixed, required: true },
    descripcion: { type: String, trim: true },
  },
  { timestamps: true, collection: 'parametros' }
);

parametroSchema.plugin(auditoriaSoftDelete);

module.exports = mongoose.model('Parametro', parametroSchema);