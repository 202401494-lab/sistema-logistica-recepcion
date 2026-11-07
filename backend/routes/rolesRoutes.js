const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const {
  listarRoles,
  crearRol,
  actualizarRol,
  desactivarRol,
} = require('../controllers/rolesController');

const router = express.Router();
router.use('/roles', verificarToken, autorizarRoles('administrador'));
router.get('/roles', listarRoles);
router.post('/roles', crearRol);
router.put('/roles/:id', actualizarRol);
router.delete('/roles/:id', desactivarRol);

module.exports = router;
