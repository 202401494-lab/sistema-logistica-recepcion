// ============================================================
// RUTAS PROTEGIDAS
// ============================================================
// Aquí se agrupan endpoints que requieren autenticación o roles
// específicos. Las rutas públicas van en authRoutes.js.

const express = require('express');
const router = express.Router();
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');

// server.js monta este router en /api, por eso esta ruta termina siendo /api/perfil.
// Cualquier usuario autenticado puede consultar su información del token.
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

// El middleware de rol se ejecuta después de validar la identidad del usuario.
// Solo un administrador puede acceder a este endpoint.
router.get('/admin/dashboard', verificarToken, autorizarRoles('administrador'), (req, res) => {
  res.status(200).json({
    mensaje: 'Bienvenido al dashboard de administrador',
    usuario: req.usuario,
  });
});

// Coordinadores y administradores pueden acceder a las funciones de coordinación.
router.get('/coordinacion', verificarToken, autorizarRoles('coordinador', 'administrador'), (req, res) => {
  res.status(200).json({
    mensaje: 'Acceso permitido para coordinación',
    usuario: req.usuario,
  });
});

module.exports = router;
