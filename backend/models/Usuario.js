const mongoose = require('mongoose');

// Colección "usuarios". La relación con "roles" es muchos a muchos
// mediante un arreglo de ObjectId que referencia la colección Role.
const usuarioSchema = new mongoose.Schema(
  {
    nombres: { type: String, required: true },
    apellidosCompleto: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // hash generado con bcrypt
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    estado: {
      type: String,
      enum: ['activo', 'inactivo'],
      default: 'activo',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', usuarioSchema);
