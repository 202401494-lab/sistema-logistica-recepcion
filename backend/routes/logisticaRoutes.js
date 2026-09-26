const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
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

router.post('/proveedores', registrarProveedor);
router.get('/proveedores', listarProveedores);
router.put('/proveedores/:id', actualizarProveedor);
// DELETE solo inactiva el proveedor; nunca elimina el documento.
router.delete('/proveedores/:id', inactivarProveedor);
router.post('/pedidos', crearPedido);
router.get('/pedidos', listarPedidos);
router.patch('/pedidos/:id/llegada', autorizarRoles('operador', 'administrador'), registrarLlegada);
router.patch('/pedidos/:id/reprogramar', reprogramarPedido);
// DELETE cancela el pedido y marca activo: false.
router.delete('/pedidos/:id', cancelarPedido);

module.exports = router;
