const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const { listarUsuarios, actualizarMfaObligatorio } = require('../controllers/usuarioController');

const router = express.Router();

router.get(
  '/usuarios',
  verificarToken,
  autorizarRoles('administrador'),
  listarUsuarios,
);

router.patch(
  '/usuarios/:id/mfa-obligatorio',
  verificarToken,
  autorizarRoles('administrador'),
  actualizarMfaObligatorio,
);

module.exports = router;
