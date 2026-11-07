const express = require('express');
const { verificarToken, checkPermission } = require('../middleware/authMiddleware');
const {
  listarGateways,
  listarDescargasActivas,
  obtenerGateway,
  crearGateway,
  actualizarGateway,
  inactivarGateway,
  iniciarDescarga,
  finalizarDescarga,
} = require('../controllers/gatewaysController');

const router = express.Router();

router.use(verificarToken);
router.get('/gateways', checkPermission('gateways'), listarGateways);
router.get('/descargas/activas', checkPermission('descargas'), listarDescargasActivas);
router.get('/gateways/:id', checkPermission('gateways'), obtenerGateway);
router.post('/gateways', checkPermission('gateways'), crearGateway);
router.put('/gateways/:id', checkPermission('gateways'), actualizarGateway);
router.delete('/gateways/:id', checkPermission('gateways'), inactivarGateway);
router.post('/descargas/iniciar', checkPermission('descargas'), iniciarDescarga);
router.post('/descargas/finalizar', checkPermission('descargas'), finalizarDescarga);

module.exports = router;