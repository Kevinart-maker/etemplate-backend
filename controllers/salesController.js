const Sale = require('../modules/salesModel');
const Order = require('../modules/orderModel');

// Get sales summary by day
exports.getSalesByDay = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales summary by month
exports.getSalesByMonth = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get total sales
exports.getTotalSales = async (req, res) => {
  try {
    const total = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(total[0] || { totalSales: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { order, amount, date } = req.body;
    const sale = new Sale({ order, amount, date });
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};