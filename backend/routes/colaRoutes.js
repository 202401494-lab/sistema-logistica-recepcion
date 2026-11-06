const express = require('express');
const { verificarToken } = require('../middleware/authMiddleware');
const { listarCola, reevaluar } = require('../controllers/colaController');

const router = express.Router();

router.use(verificarToken);
router.get('/cola', listarCola);
router.post('/cola/reevaluar', reevaluar);

module.exports = router;
