const mongoose = require('mongoose');

const orderTrackingSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  history: [
    {
      status: String,
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('OrderTracking', orderTrackingSchema);