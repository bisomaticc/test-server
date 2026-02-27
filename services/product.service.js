const Product = require("../models/product.models");

exports.getAll = () => Product.find();
exports.getById = (_id) => Product.findById(id);
exports.create = (data) => Product.create(data);
exports.update = (_id, data) =>
  Product.findByIdAndUpdate(_id, data, { new: true });

exports.delete = (_id) => Product.findByIdAndDelete(_id);
