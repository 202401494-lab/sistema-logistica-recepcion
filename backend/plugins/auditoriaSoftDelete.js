const mongoose = require('mongoose');

// Usa el nombre completo del usuario autenticado para los campos de auditoría.
const obtenerUsuario = (options = {}) => options.usuarioActualizacion || 'sistema';

// Plugin transversal para soft delete, auditoría y filtrado de documentos activos.
const auditoriaSoftDelete = (schema) => {
  schema.add({
    activo: { type: Boolean, default: true, index: true },
    usuarioCreacion: { type: String, default: 'sistema', trim: true },
    usuarioActualizacion: { type: String, default: 'sistema', trim: true },
    fechaCreacion: { type: Date, default: Date.now },
    fechaActualizacion: { type: Date, default: Date.now },
  });

  // Asigna fechas y usuario en cada alta o modificación hecha con save().
  schema.pre('save', function antesDeGuardar(next) {
    const ahora = new Date();
    const usuario = this.$__.saveOptions?.usuarioActualizacion || 'sistema';
    if (this.isNew) {
      this.fechaCreacion = ahora;
      this.usuarioCreacion = usuario;
    }
    this.fechaActualizacion = ahora;
    this.usuarioActualizacion = usuario;
    next();
  });

  // Todo GET basado en find() excluye inactivos salvo que se soliciten explícitamente.
  schema.pre(/^find/, function filtrarActivos() {
    if (this.getOptions().incluirInactivos !== true) {
      this.where({ activo: true });
    }
  });

  // Conserva la trazabilidad también para actualizaciones directas de Mongoose.
  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function auditarActualizacion() {
    const ahora = new Date();
    const usuario = obtenerUsuario(this.getOptions());
    this.set({ fechaActualizacion: ahora, usuarioActualizacion: usuario });
  });

  // Impide borrar físicamente documentos; las rutas deben marcar activo: false.
  schema.pre(['deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], function impedirBorrado() {
    throw new mongoose.Error('El borrado físico está deshabilitado; use activo: false');
  });
  schema.pre('deleteMany', function impedirBorradoMasivo() {
    throw new mongoose.Error('El borrado físico está deshabilitado; use activo: false');
  });
};

module.exports = auditoriaSoftDelete;