// ============================================================
// RUTAS PROTEGIDAS
// ============================================================
// Aquí se agrupan endpoints que requieren autenticación o roles
// específicos. Las rutas públicas van en authRoutes.js.

const express = require('express');
const router = express.Router();
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');

// Ejemplo de ruta protegida que cualquier usuario autenticado puede ver
router.get('/perfil', verificarToken, (req, res) => {
  res.status(200).json({
    mensaje: 'Acceso permitido a perfil',
    usuario: {
      id: req.usuario.id,
      email: req.usuario.email,
      rol: req.usuario.rol,
    },
  });
});

// Ejemplo de ruta protegida solo para administradores
router.get('/admin/dashboard', verificarToken, autorizarRoles('administrador'), (req, res) => {
  res.status(200).json({
    mensaje: 'Bienvenido al dashboard de administrador',
    usuario: req.usuario,
  });
});

// Ejemplo de ruta protegida para coordinadores y administradores
router.get('/coordinacion', verificarToken, autorizarRoles('coordinador', 'administrador'), (req, res) => {
  res.status(200).json({
    mensaje: 'Acceso permitido para coordinación',
    usuario: req.usuario,
  });
});

module.exports = router;
