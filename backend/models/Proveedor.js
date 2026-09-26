const mongoose = require('mongoose');
const auditoriaSoftDelete = require('../plugins/auditoriaSoftDelete');

const proveedorSchema = new mongoose.Schema(
  {
    razonSocial: { type: String, required: true, trim: true },
    identificacionTributaria: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9][A-Z0-9-]{3,19}$/,
    },
    categoria: {
      type: String,
      required: true,
      enum: ['construcción', 'general'],
    },
    contactoNombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    emailContacto: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo'],
      default: 'activo',
    },
  },
  { timestamps: true, collection: 'proveedores' }
);

proveedorSchema.plugin(auditoriaSoftDelete);

module.exports = mongoose.model('Proveedor', proveedorSchema);
