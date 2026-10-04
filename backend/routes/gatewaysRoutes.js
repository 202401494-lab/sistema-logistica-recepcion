const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const {
  listarGateways,
  obtenerGateway,
  crearGateway,
  actualizarGateway,
  inactivarGateway,
  iniciarDescarga,
  finalizarDescarga,
} = require('../controllers/gatewaysController');

const router = express.Router();

router.use(verificarToken);
router.get('/gateways', listarGateways);
router.get('/gateways/:id', obtenerGateway);
router.post('/gateways', autorizarRoles('administrador'), crearGateway);
router.put('/gateways/:id', autorizarRoles('administrador'), actualizarGateway);
router.delete('/gateways/:id', autorizarRoles('administrador'), inactivarGateway);
router.post('/descargas/iniciar', iniciarDescarga);
router.post('/descargas/finalizar', finalizarDescarga);

module.exports = router;