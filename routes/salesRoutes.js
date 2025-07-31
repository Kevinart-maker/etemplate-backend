const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/day', salesController.getSalesByDay);
router.get('/month', salesController.getSalesByMonth);
router.get('/total', salesController.getTotalSales);
router.post('/', salesController.createSale);

module.exports = router;