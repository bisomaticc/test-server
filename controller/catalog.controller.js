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

exports.updateFabric = async (req, res) => {
  try {
    const oldName = String(req.body?.oldName || "").trim();
    const newName = String(req.body?.newName || "").trim();
    const updateProducts = req.body?.updateProducts !== false;

    if (!oldName || !newName) {
      return res.status(400).json({ message: "Both current and new fabric names are required." });
    }

    const catalog = await catalogService.updateFabric(oldName, newName);

    if (updateProducts) {
      await Product.updateMany({ fabric: oldName }, { $set: { fabric: newName } });
    }

    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFabric = async (req, res) => {
  try {
    const name = String(req.query.name ?? req.body?.name ?? "").trim();
    const force = String(req.query.force ?? req.body?.force ?? "") === "true";
    if (!name) {
      return res.status(400).json({ message: "Fabric name is required." });
    }
    const count = await Product.countDocuments({ fabric: name });
    if (count > 0 && !force) {
      return res.status(400).json({
        message: `Cannot delete: ${count} product(s) use this fabric. Confirm delete to remove it from options.`,
        productCount: count,
        requiresForce: true,
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

exports.updateCategory = async (req, res) => {
  try {
    const oldName = String(req.body?.oldName || "").trim();
    const newName = String(req.body?.newName || "").trim();
    const updateProducts = req.body?.updateProducts !== false;

    if (!oldName || !newName) {
      return res.status(400).json({ message: "Both current and new category names are required." });
    }

    const catalog = await catalogService.updateCategory(oldName, newName);

    if (updateProducts) {
      await Product.updateMany({ category: oldName }, { $set: { category: newName } });
      await Product.updateMany(
        { categories: oldName },
        { $set: { "categories.$": newName } }
      );
    }

    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const name = String(req.query.name ?? req.body?.name ?? "").trim();
    const force = String(req.query.force ?? req.body?.force ?? "") === "true";
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }
    const count = await Product.countDocuments({
      $or: [{ category: name }, { categories: name }],
    });
    if (count > 0 && !force) {
      return res.status(400).json({
        message: `Cannot delete: ${count} product(s) use this category. Confirm delete to remove it from options.`,
        productCount: count,
        requiresForce: true,
      });
    }
    const catalog = await catalogService.removeCategory(name);
    res.json(catalog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
