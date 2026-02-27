const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  customerName: String,
  phone: String,
  city: String,

  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      qty: Number,
      imageUrl: String
    }
  ],

  totalAmount: Number,
  source: { type: String, default: "whatsapp" }
},
{ timestamps: true }
);


module.exports = mongoose.model("Order", orderSchema);
