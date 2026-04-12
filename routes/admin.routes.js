const express = require("express");
const adminAuth = require("../middleware/adminauth");

const adminController = require("../controller/admin.controller");
const productController = require("../controller/product.controller");
const orderController = require("../controller/order.controller");
const catalogController = require("../controller/catalog.controller");

const router = express.Router();

/* =====================
   AUTH
===================== */
router.post("/login", adminController.login);

/* =====================
   PROTECTED ROUTES
===================== */
router.use(adminAuth);

/* =====================
   PRODUCTS
===================== */
// ✅ JSON ONLY — imageUrl stored as string
router.post("/products", productController.create);
router.put("/products/:id", productController.update);
router.delete("/products/:id", productController.delete);

/* =====================
   ORDERS
===================== */
router.get("/orders", orderController.getAll);

/* =====================
   CATALOG (fabrics & categories in MongoDB)
===================== */
router.get("/catalog", catalogController.getCatalog);
router.post("/catalog/fabric", catalogController.addFabric);
router.delete("/catalog/fabric", catalogController.deleteFabric);
router.post("/catalog/category", catalogController.addCategory);
router.delete("/catalog/category", catalogController.deleteCategory);

module.exports = router;
