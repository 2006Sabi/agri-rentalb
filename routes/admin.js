const express = require("express");
const User = require("../models/User");
const Equipment = require("../models/Equipment");
const Product = require("../models/Product");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

const router = express.Router();

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Get dashboard stats
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: "farmer" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalEquipment = await Equipment.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({
      status: { $in: ["confirmed", "in_progress"] },
    });

    // Revenue calculation (mock data)
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
    ]);

    // Monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const monthlyUsers = await User.countDocuments({
      createdAt: { $gte: currentMonth },
    });
    const monthlyBookings = await Booking.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    res.json({
      totalUsers,
      totalFarmers,
      totalOwners,
      totalEquipment,
      totalProducts,
      totalBookings,
      activeBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyUsers,
      monthlyBookings,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user status
router.put("/users/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    console.error("User status update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all equipment (pending approval)
router.get("/equipment", auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const equipment = await Equipment.find(filter)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Equipment.countDocuments(filter);

    res.json({
      equipment,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Admin equipment fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve/Reject equipment
router.put("/equipment/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.json({
      message: `Equipment ${status} successfully`,
      equipment,
    });
  } catch (error) {
    console.error("Equipment status update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all bookings
router.get("/bookings", auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("renter", "name email phone")
      .populate("owner", "name email phone")
      .populate("equipment", "name category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Admin bookings fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get analytics data
router.get("/analytics", auth, adminAuth, async (req, res) => {
  try {
    // Monthly user registrations
    const userRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Monthly bookings
    const monthlyBookings = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Equipment categories
    const equipmentCategories = await Equipment.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top equipment by bookings
    const topEquipment = await Equipment.find()
      .sort({ bookingCount: -1 })
      .limit(10)
      .select("name category bookingCount totalEarnings");

    res.json({
      userRegistrations,
      monthlyBookings,
      equipmentCategories,
      topEquipment,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
