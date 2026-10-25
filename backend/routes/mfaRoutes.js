const express = require('express');
const { verificarTempToken } = require('../middleware/authMiddleware');
const {
  configurarMfa,
  activarMfa,
} = require('../controllers/mfaController');

const router = express.Router();

router.post('/setup', verificarTempToken, configurarMfa);
router.post('/enable', verificarTempToken, activarMfa);

module.exports = router;
