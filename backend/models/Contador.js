const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema(
  {
    clave: { type: String, required: true, unique: true },
    secuencia: { type: Number, required: true, min: 0 },
  },
  { versionKey: false, collection: 'contadores' }
);

module.exports = mongoose.model('Contador', contadorSchema);