import express from "express";
import upload from "../utils/multerConfig.js";

import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/Product.cotrollers.js";

const router = express.Router();

// Add Product (Admin)
router.post("/add", upload.array("images", 10), addProduct);

// Get All Products
router.get("/", getAllProducts);

// Get Single Product
router.get("/:id", getProductById);

// Update Product (Admin)
router.put("/update/:id", upload.array("images", 10), updateProduct);

// Delete Product (Admin)
router.delete("/delete/:id", deleteProduct);

export default router;
