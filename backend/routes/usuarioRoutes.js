const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const { actualizarMfaObligatorio } = require('../controllers/usuarioController');

const router = express.Router();

router.patch(
  '/usuarios/:id/mfa-obligatorio',
  verificarToken,
  autorizarRoles('administrador'),
  actualizarMfaObligatorio,
);

module.exports = router;
