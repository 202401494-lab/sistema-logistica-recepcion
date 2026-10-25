const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verificarTempToken } = require('../middleware/authMiddleware');
const { verificarCodigoLogin } = require('../controllers/mfaController');

router.post('/login', login);
router.post('/mfa/verify-login', verificarTempToken, verificarCodigoLogin);

module.exports = router;
