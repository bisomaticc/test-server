const catalogService = require("../services/catalog.service");
const Product = require("../models/product.models");

exports.getCatalog = async (req, res) => {
  try {
    const catalog = await catalogService.getCatalog();
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addFabric = async (req, res) => {
  try {
    const catalog = await catalogService.addFabric(req.body?.name);
    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFabric = async (req, res) => {
  try {
    const name = String(req.query.name ?? req.body?.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ message: "Fabric name is required." });
    }
    const count = await Product.countDocuments({ fabric: name });
    if (count > 0) {
      return res.status(400).json({
        message: "Cannot delete: one or more products use this fabric.",
      });
    }
    const catalog = await catalogService.removeFabric(name);
    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const catalog = await catalogService.addCategory(req.body?.name);
    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const name = String(req.query.name ?? req.body?.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }
    const count = await Product.countDocuments({ category: name });
    if (count > 0) {
      return res.status(400).json({
        message: "Cannot delete: one or more products use this category.",
      });
    }
    const catalog = await catalogService.removeCategory(name);
    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
