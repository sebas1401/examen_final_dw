const express = require('express');
const { listMesas, createMesa, updateMesa, deleteMesa } = require('../controllers/mesaController');

const router = express.Router();

router.get('/', listMesas);
router.post('/', createMesa);
router.put('/:id', updateMesa);
router.delete('/:id', deleteMesa);

module.exports = router;

