const mongoose = require('mongoose');

// Colección "roles" para el control de acceso basado en roles (RBAC)
const roleSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    enum: ['administrador', 'coordinador', 'operador'],
  },
  descripcion: {
    type: String,
  },
});

module.exports = mongoose.model('Role', roleSchema);
