const mongoose = require("mongoose");

/**
 * Singleton catalog doc: fabric types and product categories for selects / admin.
 * One row with key "default".
 */
const shopCatalogSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    fabrics: { type: [String], default: [] },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopCatalog", shopCatalogSchema);
