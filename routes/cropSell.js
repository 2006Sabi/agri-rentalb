const express = require("express");
const router = express.Router();
const CropSell = require("../models/CropSell");
const CropOrder = require("../models/CropOrder");
const User = require("../models/User");
const auth = require("../middleware/auth");

// @route   POST /api/crop-sell
// @desc    Create a new crop listing
// @access  Private (Farmers only)
router.post("/", auth, async (req, res) => {
  try {
    const { user } = req;

    // Check if user is a farmer
    if (user.role !== "farmer") {
      return res
        .status(403)
        .json({ message: "Only farmers can create crop listings" });
    }

    const {
      cropName,
      quantity,
      unit,
      pricePerUnit,
      images,
      description,
      location,
      harvestDate,
      category,
      quality,
      organic,
      expiryDate,
    } = req.body;

    const cropListing = new CropSell({
      cropName,
      quantity,
      unit,
      pricePerUnit,
      sellerId: user.id,
      images,
      description,
      location,
      harvestDate,
      category,
      quality,
      organic,
      expiryDate,
    });

    await cropListing.save();

    res.status(201).json({
      success: true,
      data: cropListing,
      message: "Crop listing created successfully",
    });
  } catch (error) {
    console.error("Error creating crop listing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell
// @desc    Get all crop listings (marketplace)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      organic,
      quality,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: "available", isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: "i" };
    if (organic !== undefined) query.organic = organic === "true";
    if (quality) query.quality = quality;
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const cropListings = await CropSell.find(query)
      .populate("sellerId", "name location phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CropSell.countDocuments(query);

    res.json({
      success: true,
      data: cropListings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching crop listings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell/:id
// @desc    Get single crop listing
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const cropListing = await CropSell.findById(req.params.id).populate(
      "sellerId",
      "name location phone farmDetails"
    );

    if (!cropListing) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Increment views
    cropListing.views += 1;
    await cropListing.save();

    res.json({
      success: true,
      data: cropListing,
    });
  } catch (error) {
    console.error("Error fetching crop listing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell/seller/my-listings
// @desc    Get seller's crop listings
// @access  Private
router.get("/seller/my-listings", auth, async (req, res) => {
  try {
    const { user } = req;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { sellerId: user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const cropListings = await CropSell.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CropSell.countDocuments(query);

    res.json({
      success: true,
      data: cropListings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching seller listings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/crop-sell/:id
// @desc    Update crop listing
// @access  Private (Owner only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { user } = req;
    const cropListing = await CropSell.findById(req.params.id);

    if (!cropListing) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Check ownership
    if (cropListing.sellerId.toString() !== user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    const updatedListing = await CropSell.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedListing,
      message: "Crop listing updated successfully",
    });
  } catch (error) {
    console.error("Error updating crop listing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/crop-sell/:id
// @desc    Delete crop listing
// @access  Private (Owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { user } = req;
    const cropListing = await CropSell.findById(req.params.id);

    if (!cropListing) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    // Check ownership
    if (cropListing.sellerId.toString() !== user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    await CropSell.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Crop listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting crop listing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/crop-sell/:id/order
// @desc    Place an order for a crop
// @access  Private
router.post("/:id/order", auth, async (req, res) => {
  try {
    const { user } = req;
    const cropListing = await CropSell.findById(req.params.id);

    if (!cropListing) {
      return res.status(404).json({ message: "Crop listing not found" });
    }

    if (cropListing.status !== "available") {
      return res
        .status(400)
        .json({ message: "Crop is not available for purchase" });
    }

    if (cropListing.sellerId.toString() === user.id) {
      return res
        .status(400)
        .json({ message: "You cannot purchase your own crop" });
    }

    const { quantity, deliveryAddress, paymentMethod, notes } = req.body;

    if (quantity > cropListing.quantity) {
      return res
        .status(400)
        .json({ message: "Requested quantity exceeds available quantity" });
    }

    const order = new CropOrder({
      cropSellId: cropListing._id,
      buyerId: user.id,
      sellerId: cropListing.sellerId,
      quantity,
      unit: cropListing.unit,
      pricePerUnit: cropListing.pricePerUnit,
      deliveryAddress,
      paymentMethod,
      notes,
    });

    await order.save();

    // Update crop listing quantity
    cropListing.quantity -= quantity;
    if (cropListing.quantity === 0) {
      cropListing.status = "sold";
    }
    await cropListing.save();

    res.status(201).json({
      success: true,
      data: order,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell/seller/orders
// @desc    Get seller's orders
// @access  Private
router.get("/seller/orders", auth, async (req, res) => {
  try {
    const { user } = req;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { sellerId: user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await CropOrder.find(query)
      .populate("buyerId", "name phone location")
      .populate("cropSellId", "cropName images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CropOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell/buyer/orders
// @desc    Get buyer's orders
// @access  Private
router.get("/buyer/orders", auth, async (req, res) => {
  try {
    const { user } = req;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { buyerId: user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await CropOrder.find(query)
      .populate("sellerId", "name phone location")
      .populate("cropSellId", "cropName images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CropOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/crop-sell/orders/:id/status
// @desc    Update order status
// @access  Private
router.put("/orders/:id/status", auth, async (req, res) => {
  try {
    const { user } = req;
    const { status } = req.body;

    const order = await CropOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is seller or buyer
    if (
      order.sellerId.toString() !== user.id &&
      order.buyerId.toString() !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/crop-sell/categories
// @desc    Get crop categories
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      { value: "grains", label: "Grains", icon: "🌾" },
      { value: "vegetables", label: "Vegetables", icon: "🥬" },
      { value: "fruits", label: "Fruits", icon: "🍎" },
      { value: "pulses", label: "Pulses", icon: "🫘" },
      { value: "spices", label: "Spices", icon: "🌶️" },
      { value: "other", label: "Other", icon: "🌱" },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
