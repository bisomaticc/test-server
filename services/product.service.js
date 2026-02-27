const Product = require("../models/product.models");

exports.getAll = () => Product.find();
exports.getById = (id) => Product.findById(id);
exports.create = (data) => Product.create(data);
exports.update = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true });

exports.delete = (id) => Product.findByIdAndDelete(id);

