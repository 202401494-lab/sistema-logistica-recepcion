const express = require('express');
const { verificarToken, checkPermission } = require('../middleware/authMiddleware');
const {
  registrarProveedor,
  listarProveedores,
  crearPedido,
  listarPedidos,
  registrarLlegada,
  actualizarProveedor,
  inactivarProveedor,
  reprogramarPedido,
  cancelarPedido,
} = require('../controllers/logisticaController');

const router = express.Router();

// Todas las operaciones logísticas requieren identidad para la auditoría.
router.use(verificarToken);

router.post('/proveedores', checkPermission('proveedores'), registrarProveedor);
router.get('/proveedores', checkPermission('proveedores'), listarProveedores);
router.put('/proveedores/:id', checkPermission('proveedores'), actualizarProveedor);
// DELETE solo inactiva el proveedor; nunca elimina el documento.
router.delete('/proveedores/:id', checkPermission('proveedores'), inactivarProveedor);
router.post('/pedidos', checkPermission('pedidos'), crearPedido);
router.get('/pedidos', checkPermission('pedidos'), listarPedidos);
router.patch('/pedidos/:id/llegada', checkPermission('pedidos'), registrarLlegada);
router.patch('/pedidos/:id/reprogramar', checkPermission('pedidos'), reprogramarPedido);
// DELETE cancela el pedido y marca activo: false.
router.delete('/pedidos/:id', checkPermission('pedidos'), cancelarPedido);

module.exports = router;
