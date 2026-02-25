const Order = require("../models/order.models");
const orderService = require("../services/order.service");

exports.checkout = async (req, res) => {
  try {

    const { customerName, phone, city, items } = req.body;

    const totalAmount = items.reduce(
      (acc, item) => acc + item.price * item.qty,
      0
    );

    const order = await Order.create({
      customerName,
      phone,
      city,
      items,
      totalAmount
    });

    // Create WhatsApp message
    let message = `New Order:%0A`;
    message += `Name: ${customerName}%0A`;
    message += `Phone: ${phone}%0A`;
    message += `City: ${city}%0A%0A`;

    items.forEach((item) => {
      message += `${item.name} x ${item.qty} - ₹${item.price * item.qty}%0A`;
    });

    message += `%0ATotal: ₹${totalAmount}`;

    const whatsappURL =
      `https://wa.me/919599819939?text=${message}`;

    res.json({
      success: true,
      whatsappURL
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const orders = await orderService.getAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};