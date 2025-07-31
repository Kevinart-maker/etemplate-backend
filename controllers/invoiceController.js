const Invoice = require('../modules/invoiceModel');
const Order = require('../modules/orderModel');

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, invoiceNumber, amount } = req.body;
    const invoice = new Invoice({ order: orderId, invoiceNumber, amount });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoice by ID
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate('order');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    invoice.status = status;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};