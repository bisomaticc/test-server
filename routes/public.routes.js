const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");
const productController = require("../controller/product.controller");
const inquiryController = require("../controller/inquiry.controller");

// Product endpoints (used by frontend to read products)
router.get("/products", productController.getAll);
router.get("/products/:id", productController.getById);
router.post("/products", productController.create);
router.put("/products/:id", productController.update);
router.delete("/products/:id", productController.delete);

// Checkout
router.post("/checkout", orderController.checkout);

// Inquiry
router.post("/inquiry", inquiryController.create);

module.exports = router;