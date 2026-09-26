const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const {
  listarParametros,
  crearParametro,
  actualizarParametro,
  inactivarParametro,
} = require('../controllers/parametroController');

const router = express.Router();

router.use(verificarToken, autorizarRoles('administrador'));
router.get('/', listarParametros);
router.post('/', crearParametro);
router.put('/:id', actualizarParametro);
router.delete('/:id', inactivarParametro);

module.exports = router;