const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');

router.post('/', orderTrackingController.createOrderTracking);
router.get('/:orderId', orderTrackingController.getOrderStatus);
router.put('/:orderId', orderTrackingController.updateOrderStatus);
router.get('/:orderId/history', orderTrackingController.getOrderHistory);

module.exports = router;