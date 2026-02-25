const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  customerName: String,
  email: String,
  phone: String,
  message: String
}, { timestamps: true });

module.exports = mongoose.model("Inquiry", inquirySchema);