const express = require("express");
const adminAuth = require("../middleware/adminauth");
const upload = require("../middleware/uploadMiddleware");

const adminController = require("../controller/admin.controller");
const productController = require("../controller/product.controller");
const orderController = require("../controller/order.controller");

const router = express.Router();

router.post("/login", adminController.login);

router.use(adminAuth);

router.post("/products", upload.single("image"), productController.create);
router.put("/products/:id", productController.update);
router.delete("/products/:id", productController.delete);
router.get("/orders", orderController.getAll);

module.exports = router;