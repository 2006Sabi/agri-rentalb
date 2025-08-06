const express = require("express");
const multer = require("multer");
const router = express.Router();
const Prediction = require("../models/Prediction");
const auth = require("../middleware/auth");

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// POST /api/predictions
// Store a new prediction with image
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const {
      diseaseName,
      confidence,
      severity,
      description,
      treatment,
      prevention,
      allPredictions,
      fertilizer,
      notes,
      isPublic = false,
      location,
    } = req.body;

    // Validate required fields
    if (
      !diseaseName ||
      !confidence ||
      !severity ||
      !description ||
      !treatment
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required prediction fields",
      });
    }

    // Parse JSON fields
    let parsedPrevention = [];
    let parsedAllPredictions = [];
    let parsedFertilizer = {};
    let parsedLocation = {};

    try {
      if (prevention) {
        parsedPrevention = JSON.parse(prevention);
      }
      if (allPredictions) {
        parsedAllPredictions = JSON.parse(allPredictions);
      }
      if (fertilizer) {
        parsedFertilizer = JSON.parse(fertilizer);
      }
      if (location) {
        parsedLocation = JSON.parse(location);
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in request body",
      });
    }

    // Create new prediction
    const prediction = new Prediction({
      user: req.user.id,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      prediction: {
        diseaseName,
        confidence: parseFloat(confidence),
        severity,
        description,
        treatment,
        prevention: parsedPrevention,
        allPredictions: parsedAllPredictions,
      },
      fertilizer: parsedFertilizer,
      notes,
      isPublic: isPublic === "true",
      location: parsedLocation,
      status: "completed",
    });

    await prediction.save();

    res.status(201).json({
      success: true,
      message: "Prediction stored successfully",
      prediction: {
        id: prediction._id,
        diseaseName: prediction.prediction.diseaseName,
        confidence: prediction.prediction.confidence,
        severity: prediction.prediction.severity,
        createdAt: prediction.createdAt,
        imageUrl: prediction.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error storing prediction:", error);
    res.status(500).json({
      success: false,
      message: "Error storing prediction",
      error: error.message,
    });
  }
});

// GET /api/predictions
// Get user's prediction history
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id, isActive: true };
    if (status) {
      query.status = status;
    }

    const predictions = await Prediction.find(query)
      .select("-image.data")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prediction.countDocuments(query);

    res.json({
      success: true,
      predictions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching predictions",
      error: error.message,
    });
  }
});

// GET /api/predictions/public
// Get public predictions
router.get("/public", async (req, res) => {
  try {
    const { page = 1, limit = 20, disease, severity } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true, isActive: true };
    if (disease) {
      query["prediction.diseaseName"] = new RegExp(disease, "i");
    }
    if (severity) {
      query["prediction.severity"] = severity;
    }

    const predictions = await Prediction.find(query)
      .select("-image.data")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prediction.countDocuments(query);

    res.json({
      success: true,
      predictions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public predictions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching public predictions",
      error: error.message,
    });
  }
});

// GET /api/predictions/:id
// Get specific prediction by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .select("-image.data")
      .populate("user", "name email");

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Check if user can access this prediction
    if (
      prediction.user._id.toString() !== req.user.id &&
      !prediction.isPublic
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Increment views if it's a public prediction
    if (prediction.isPublic) {
      await prediction.incrementViews();
    }

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Error fetching prediction:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prediction",
      error: error.message,
    });
  }
});

// GET /api/predictions/:id/image
// Get prediction image
router.get("/:id/image", async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Check if user can access this prediction
    if (prediction.user.toString() !== req.user?.id && !prediction.isPublic) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.set("Content-Type", prediction.image.contentType);
    res.set(
      "Content-Disposition",
      `inline; filename="${prediction.image.originalName}"`
    );
    res.send(prediction.image.data);
  } catch (error) {
    console.error("Error fetching prediction image:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prediction image",
      error: error.message,
    });
  }
});

// PUT /api/predictions/:id
// Update prediction (notes, isPublic, etc.)
router.put("/:id", auth, async (req, res) => {
  try {
    const { notes, isPublic, tags } = req.body;

    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Check if user owns this prediction
    if (prediction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update allowed fields
    if (notes !== undefined) prediction.notes = notes;
    if (isPublic !== undefined) prediction.isPublic = isPublic;
    if (tags !== undefined) prediction.tags = tags;

    await prediction.save();

    res.json({
      success: true,
      message: "Prediction updated successfully",
      prediction: {
        id: prediction._id,
        notes: prediction.notes,
        isPublic: prediction.isPublic,
        tags: prediction.tags,
      },
    });
  } catch (error) {
    console.error("Error updating prediction:", error);
    res.status(500).json({
      success: false,
      message: "Error updating prediction",
      error: error.message,
    });
  }
});

// DELETE /api/predictions/:id
// Soft delete prediction
router.delete("/:id", auth, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Check if user owns this prediction
    if (prediction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Soft delete
    prediction.isActive = false;
    await prediction.save();

    res.json({
      success: true,
      message: "Prediction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prediction:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting prediction",
      error: error.message,
    });
  }
});

// GET /api/predictions/stats/user
// Get user's prediction statistics
router.get("/stats/user", auth, async (req, res) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { user: req.user.id, isActive: true } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgConfidence: { $avg: "$prediction.confidence" },
          diseaseCounts: {
            $push: "$prediction.diseaseName",
          },
          severityCounts: {
            $push: "$prediction.severity",
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalPredictions: 0,
          avgConfidence: 0,
          diseaseBreakdown: {},
          severityBreakdown: {},
        },
      });
    }

    const stat = stats[0];

    // Calculate disease breakdown
    const diseaseBreakdown = stat.diseaseCounts.reduce((acc, disease) => {
      acc[disease] = (acc[disease] || 0) + 1;
      return acc;
    }, {});

    // Calculate severity breakdown
    const severityBreakdown = stat.severityCounts.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalPredictions: stat.totalPredictions,
        avgConfidence: Math.round(stat.avgConfidence * 100) / 100,
        diseaseBreakdown,
        severityBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
});

module.exports = router;
