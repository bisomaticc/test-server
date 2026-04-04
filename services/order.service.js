const Order = require("../models/order.models");

exports.create = (data) => Order.create(data);
exports.getAll = () => Order.find().populate("items.product");