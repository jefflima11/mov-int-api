const express = require('express');
const router = express.Router();
const { getMov, getMovId } = require('../controllers/movimentacao-controller');

router.get('/', getMov);
router.get('/:id', getMovId);

module.exports = router;