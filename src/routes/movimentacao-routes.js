const express = require('express');
const router = express.Router();
const { getMov, getMovId, postMovId } = require('../controllers/movimentacao-controller');

router.get('/', getMov);
router.get('/:id', getMovId);
router.post('/', postMovId);

module.exports = router;