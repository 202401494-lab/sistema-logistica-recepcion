const express = require('express');
const {
  registrarProveedor,
  listarProveedores,
  crearPedido,
  listarPedidos,
} = require('../controllers/logisticaController');

const router = express.Router();

router.post('/proveedores', registrarProveedor);
router.get('/proveedores', listarProveedores);
router.post('/pedidos', crearPedido);
router.get('/pedidos', listarPedidos);

module.exports = router;
