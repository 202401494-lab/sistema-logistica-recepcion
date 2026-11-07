const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  actualizarMfaObligatorio,
} = require('../controllers/usuarioController');

const router = express.Router();

router.get(
  '/usuarios',
  verificarToken,
  autorizarRoles('administrador'),
  listarUsuarios,
);

router.post(
  '/usuarios',
  verificarToken,
  autorizarRoles('administrador'),
  crearUsuario,
);

router.put(
  '/usuarios/:id',
  verificarToken,
  autorizarRoles('administrador'),
  actualizarUsuario,
);

router.delete(
  '/usuarios/:id',
  verificarToken,
  autorizarRoles('administrador'),
  desactivarUsuario,
);

router.patch(
  '/usuarios/:id/mfa-obligatorio',
  verificarToken,
  autorizarRoles('administrador'),
  actualizarMfaObligatorio,
);

module.exports = router;
