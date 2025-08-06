const express = require("express");
const Equipment = require("../models/Equipment");
const auth = require("../middleware/auth");

const router = express.Router();

// GET all equipment (public with filters)
router.get("/", async (req, res) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      available,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { status: "approved", isActive: true };

    if (category) filter.category = category;

    if (location) {
      filter.$or = [
        { "location.city": new RegExp(location, "i") },
        { "location.state": new RegExp(location, "i") },
      ];
    }

    if (available === "true") filter["availability.isAvailable"] = true;

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);

      filter.$or = [
        { "pricing.hourly": priceFilter },
        { "pricing.daily": priceFilter },
        { "pricing.weekly": priceFilter },
        { "pricing.monthly": priceFilter },
      ];
    }

    const equipment = await Equipment.find(filter)
      .populate("owner", "name phone location")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Equipment.countDocuments(filter);

    res.json({
      equipment,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error("Equipment fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET equipment by ID
router.get("/:id", async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate("owner", "name phone location")
      .populate("reviews.user", "name");

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.json(equipment);
  } catch (error) {
    console.error("Equipment fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new equipment
router.post("/", auth, async (req, res) => {
  try {
    if (!["owner", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only owners/admins can add equipment" });
    }

    const equipmentData = {
      ...req.body,
      owner: req.user.userId,
    };

    const equipment = new Equipment(equipmentData);
    await equipment.save();

    res.status(201).json({
      message: "Equipment added successfully",
      equipment,
    });
  } catch (error) {
    console.error("Equipment creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update equipment
router.put("/:id", auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (
      equipment.owner.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Equipment updated",
      equipment: updated,
    });
  } catch (error) {
    console.error("Equipment update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE equipment
router.delete("/:id", auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (
      equipment.owner.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Equipment deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST review
router.post("/:id/review", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    const existingReview = equipment.reviews.find(
      (review) => review.user.toString() === req.user.userId
    );

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this equipment" });
    }

    equipment.reviews.push({
      user: req.user.userId,
      rating,
      comment,
    });

    const totalRating = equipment.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    equipment.ratings.average = totalRating / equipment.reviews.length;
    equipment.ratings.count = equipment.reviews.length;

    await equipment.save();

    res.json({
      message: "Review added",
      equipment,
    });
  } catch (error) {
    console.error("Review error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
