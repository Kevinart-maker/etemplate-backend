const OrderTracking = require('../modules/orderTrackingModel');
const Order = require('../modules/orderModel');

// Get order tracking status
exports.getOrderStatus = async (req, res) => {
  try {
    const tracking = await OrderTracking.findOne({ order: req.params.orderId });
    if (!tracking) return res.status(404).json({ error: 'Tracking not found' });
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let tracking = await OrderTracking.findOne({ order: req.params.orderId });
    if (!tracking) return res.status(404).json({ error: 'Tracking not found' });
    tracking.status = status;
    tracking.history.push({ status });
    await tracking.save();
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get order status history
exports.getOrderHistory = async (req, res) => {
  try {
    const tracking = await OrderTracking.findOne({ order: req.params.orderId });
    if (!tracking) return res.status(404).json({ error: 'Tracking not found' });
    res.json(tracking.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrderTracking = async (req, res) => {
  try {
    const { order, status, history } = req.body;
    const tracking = new OrderTracking({ order, status, history });
    await tracking.save();
    res.status(201).json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};