const express = require('express');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');
const { obtenerKpis } = require('../controllers/kpisController');

const router = express.Router();

router.get('/kpis', verificarToken, autorizarRoles('coordinador', 'administrador'), obtenerKpis);

module.exports = router;