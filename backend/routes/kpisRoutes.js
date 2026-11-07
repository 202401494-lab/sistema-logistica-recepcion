const express = require('express');
const { verificarToken, checkPermission } = require('../middleware/authMiddleware');
const { obtenerKpis } = require('../controllers/kpisController');

const router = express.Router();

router.get('/kpis', verificarToken, checkPermission('kpis'), obtenerKpis);

module.exports = router;