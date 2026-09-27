const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  price: { type: Number, required: true },
  /** Max retail price (optional; shown struck-through when higher than selling price). */
  mrp: { type: Number, default: null },
  description: String,
  category: String,
  categories: { type: [String], default: [] },
  imageUrls: { type: [String] },
  fabric: String,
  colors: { type: [String], default: [] },
  stock: { type: Number, default: 0 },
  isOutOfStock: { type: Boolean, default: false }
},
{ timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

