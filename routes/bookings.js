const express = require("express");
const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");
const auth = require("../middleware/auth");

const router = express.Router();

// Get user bookings
router.get("/", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (req.user.role === "farmer") {
      filter.renter = req.user.userId;
    } else if (req.user.role === "owner") {
      filter.owner = req.user.userId;
    }

    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("equipment", "name category images")
      .populate("renter", "name phone")
      .populate("owner", "name phone")
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
    console.error("Bookings fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get booking by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("equipment")
      .populate("renter", "name phone email")
      .populate("owner", "name phone email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized to view this booking
    if (
      booking.renter._id.toString() !== req.user.userId &&
      booking.owner._id.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Booking fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create booking
router.post("/", auth, async (req, res) => {
  try {
    const {
      equipmentId,
      rentalPeriod,
      pricing,
      location,
      delivery,
      operator,
      notes,
    } = req.body;

    // Get equipment details
    const equipment = await Equipment.findById(equipmentId).populate("owner");
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (!equipment.availability.isAvailable) {
      return res.status(400).json({ message: "Equipment is not available" });
    }

    // Check if equipment owner is trying to book their own equipment
    if (equipment.owner._id.toString() === req.user.userId) {
      return res
        .status(400)
        .json({ message: "You cannot book your own equipment" });
    }

    // Calculate total amount
    const { startDate, endDate } = rentalPeriod;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let totalAmount = 0;
    if (pricing.rateType === "daily") {
      totalAmount = pricing.rate * daysDiff;
    } else if (pricing.rateType === "hourly") {
      totalAmount = pricing.rate * (rentalPeriod.totalHours || 8 * daysDiff);
    }

    // Add delivery and operator charges
    if (delivery.isDeliveryRequired) {
      totalAmount += delivery.deliveryCharge || 0;
    }
    if (operator.isOperatorRequired) {
      totalAmount += operator.operatorCharge || 0;
    }

    // Create booking
    const booking = new Booking({
      renter: req.user.userId,
      equipment: equipmentId,
      owner: equipment.owner._id,
      rentalPeriod: {
        ...rentalPeriod,
        totalDays: daysDiff,
      },
      pricing: {
        ...pricing,
        subtotal:
          totalAmount -
          (delivery.deliveryCharge || 0) -
          (operator.operatorCharge || 0),
        totalAmount,
      },
      location,
      delivery,
      operator,
      notes: {
        renterNotes: notes,
      },
    });

    await booking.save();

    // Add to timeline
    booking.timeline.push({
      status: "pending",
      updatedBy: req.user.userId,
      notes: "Booking created",
    });

    await booking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update booking status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check authorization
    const isOwner = booking.owner.toString() === req.user.userId;
    const isRenter = booking.renter.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isRenter && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
      disputed: ["resolved"],
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${booking.status} to ${status}`,
      });
    }

    // Update booking
    booking.status = status;

    // Add to timeline
    booking.timeline.push({
      status,
      updatedBy: req.user.userId,
      notes,
    });

    await booking.save();

    res.json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking status update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel booking
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user can cancel
    const isRenter = booking.renter.toString() === req.user.userId;
    const isOwner = booking.owner.toString() === req.user.userId;

    if (!isRenter && !isOwner && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot cancel this booking" });
    }

    booking.status = "cancelled";
    booking.timeline.push({
      status: "cancelled",
      updatedBy: req.user.userId,
      notes: reason || "Booking cancelled",
    });

    await booking.save();

    res.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
