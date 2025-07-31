const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.post('/', invoiceController.createInvoice);
router.get('/:invoiceId', invoiceController.getInvoice);
router.put('/:invoiceId', invoiceController.updateInvoiceStatus);

module.exports = router;