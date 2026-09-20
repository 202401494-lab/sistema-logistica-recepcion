const express = require('express');
const {
  registrarProveedor,
  crearPedido,
  listarPedidos,
} = require('../controllers/logisticaController');

const router = express.Router();

router.post('/proveedores', registrarProveedor);
router.post('/pedidos', crearPedido);
router.get('/pedidos', listarPedidos);

module.exports = router;
