const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
  name: { type: String, required: true },
  price: { type: Number, required: true },
  /** Max retail price (optional; shown struck-through when higher than selling price). */
  mrp: { type: Number, default: null },
  description: String,
  category: String,
  imageUrls: {type:[String],},
  fabric: String,
  stock: { type: Number, default: 0 }
},
{ timestamps: true }
);


module.exports = mongoose.model("Product", productSchema);

