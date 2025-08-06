const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get all reports (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { status, priority, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const reports = await Report.find(query)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("relatedBooking", "bookingId")
      .populate("relatedEquipment", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's own reports
router.get("/my-reports", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { reporter: req.user.id };
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("reportedUser", "name email")
      .populate("relatedBooking", "bookingId")
      .populate("relatedEquipment", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get reports against user
router.get("/reports-against-me", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { reportedUser: req.user.id };
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("reporter", "name email")
      .populate("relatedBooking", "bookingId")
      .populate("relatedEquipment", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single report
router.get("/:id", auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("relatedBooking", "bookingId")
      .populate("relatedEquipment", "name")
      .populate("adminNotes.admin", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if user has access to this report
    if (
      req.user.role !== "admin" &&
      report.reporter._id.toString() !== req.user.id &&
      report.reportedUser._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new report
router.post("/", auth, async (req, res) => {
  try {
    const {
      reportedUserId,
      reportType,
      category,
      title,
      description,
      severity,
      priority,
      evidence,
      relatedBooking,
      relatedEquipment,
      tags,
      isAnonymous,
    } = req.body;

    // Validate reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: "Reported user not found" });
    }

    // Prevent self-reporting
    if (reportedUserId === req.user.id) {
      return res.status(400).json({ message: "Cannot report yourself" });
    }

    const report = new Report({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reportType,
      category,
      title,
      description,
      severity,
      priority,
      evidence: evidence || [],
      relatedBooking,
      relatedEquipment,
      tags: tags || [],
      isAnonymous: isAnonymous || false,
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email");

    res.status(201).json(populatedReport);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update report status (admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { status, adminNote } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;

    if (adminNote) {
      report.adminNotes.push({
        admin: req.user.id,
        note: adminNote,
      });
    }

    if (status === "resolved") {
      report.resolution = {
        action: req.body.resolutionAction || "Issue resolved",
        description: req.body.resolutionDescription || "",
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
      };
    }

    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("adminNotes.admin", "name");

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add admin note to report
router.post("/:id/notes", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { note } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.adminNotes.push({
      admin: req.user.id,
      note,
    });

    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("adminNotes.admin", "name");

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get report statistics (admin only)
router.get("/stats/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const stats = await Report.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Report.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await Report.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });
    const urgentReports = await Report.countDocuments({ priority: "urgent" });

    res.json({
      statusStats: stats,
      priorityStats,
      categoryStats,
      totalReports,
      pendingReports,
      urgentReports,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 