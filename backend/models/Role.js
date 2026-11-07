const mongoose = require('mongoose');
const { MODULOS } = require('../services/permisosRoles');

const roleSchema = new mongoose.Schema(
  {
    nombreRol: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    nombre: { type: String, trim: true },
    descripcion: { type: String, trim: true, maxlength: 300, default: '' },
    permisos: {
      type: [{ type: String, enum: MODULOS }],
      default: [],
    },
    activo: { type: Boolean, default: true, index: true },
    usuarioCreacion: { type: String, default: 'sistema', trim: true },
    usuarioActualizacion: { type: String, default: 'sistema', trim: true },
  },
  { timestamps: true, collection: 'roles' },
);

roleSchema.pre('validate', function sincronizarNombre(next) {
  if (!this.nombreRol && this.nombre) this.nombreRol = this.nombre;
  if (this.nombreRol) this.nombre = this.nombreRol;
  next();
});

roleSchema.index(
  { nombreRol: 1 },
  {
    unique: true,
    collation: { locale: 'es', strength: 2 },
    partialFilterExpression: { nombreRol: { $type: 'string' } },
  },
);

module.exports = mongoose.model('Role', roleSchema);
