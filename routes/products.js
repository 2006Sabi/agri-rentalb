const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all products (public)
router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    const filter = { status: "active", isActive: true };

    if (category) filter.category = category;
    if (inStock === "true") filter["stock.quantity"] = { $gt: 0 };
    if (search) {
      filter.$text = { $search: search };
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter)
      .populate("seller", "name phone location")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name phone location")
      .populate("reviews.user", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Product fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create product (seller only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only sellers can add products" });
    }

    const productData = {
      ...req.body,
      seller: req.user.userId,
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update product (seller only)
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is seller or admin
    if (
      product.seller.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete product (seller only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is seller or admin
    if (
      product.seller.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add review
router.post("/:id/review", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user.userId
    );

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Add review
    product.reviews.push({
      user: req.user.userId,
      rating,
      comment,
    });

    // Update average rating
    const totalRating = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    product.ratings.average = totalRating / product.reviews.length;
    product.ratings.count = product.reviews.length;

    await product.save();

    res.json({
      message: "Review added successfully",
      product,
    });
  } catch (error) {
    console.error("Review addition error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
