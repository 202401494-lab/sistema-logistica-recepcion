const express = require('express');
const { verificarToken, checkPermission } = require('../middleware/authMiddleware');
const { listarCola, reevaluar } = require('../controllers/colaController');

const router = express.Router();

router.use('/cola', verificarToken, checkPermission('cola'));
router.get('/cola', listarCola);
router.post('/cola/reevaluar', reevaluar);

module.exports = router;
