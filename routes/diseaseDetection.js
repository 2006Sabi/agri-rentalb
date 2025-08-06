const express = require("express");
const multer = require("multer");
const router = express.Router();
const diseaseDetectionModel = require("../ml/diseaseDetectionModel");
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

// POST /api/disease-detection/predict
// Upload image and get disease prediction
router.post("/predict", auth, upload.single("image"), async (req, res) => {
  try {
    console.log("Disease detection request received");

    if (!req.file) {
      console.log("No image file provided");
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    console.log("Image file received:", {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      console.log("Image file too large:", req.file.size);
      return res.status(400).json({
        success: false,
        message: "Image file too large. Maximum size is 10MB.",
      });
    }

    // Get prediction from model
    console.log("Starting disease prediction...");
    const startTime = Date.now();
    const prediction = await diseaseDetectionModel.predictDisease(
      req.file.buffer
    );
    const processingTime = Date.now() - startTime;

    console.log("Prediction completed:", {
      diseaseName: prediction.diseaseName,
      confidence: prediction.confidence,
      processingTime,
    });

    // Get fertilizer recommendation
    const fertilizer = diseaseDetectionModel.getFertilizerRecommendation(
      prediction.diseaseName
    );

    // Store prediction in database
    console.log("Storing prediction in database...");
    const storedPrediction = new Prediction({
      user: req.user.id,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      prediction: {
        diseaseName: prediction.diseaseName,
        confidence: prediction.confidence,
        severity: prediction.severity,
        description: prediction.description,
        treatment: prediction.treatment,
        prevention: prediction.prevention,
        allPredictions: prediction.allPredictions,
      },
      fertilizer: fertilizer,
      processingTime: processingTime,
      status: "completed",
    });

    await storedPrediction.save();
    console.log(
      "Prediction stored successfully with ID:",
      storedPrediction._id
    );

    res.json({
      success: true,
      prediction: {
        ...prediction,
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        predictionId: storedPrediction._id,
        imageUrl: storedPrediction.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error in disease prediction:", error);
    res.status(500).json({
      success: false,
      message: "Error processing image for disease detection",
      error: error.message,
    });
  }
});

// GET /api/disease-detection/diseases
// Get list of all supported diseases
router.get("/diseases", async (req, res) => {
  try {
    const diseases = diseaseDetectionModel.getSupportedDiseases();

    res.json({
      success: true,
      diseases: diseases,
    });
  } catch (error) {
    console.error("Error fetching diseases:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disease information",
      error: error.message,
    });
  }
});

// GET /api/disease-detection/disease/:id
// Get specific disease information
router.get("/disease/:id", async (req, res) => {
  try {
    const diseaseId = req.params.id;
    const diseaseInfo = diseaseDetectionModel.getDiseaseInfo(diseaseId);

    if (!diseaseInfo) {
      return res.status(404).json({
        success: false,
        message: "Disease not found",
      });
    }

    res.json({
      success: true,
      disease: {
        id: diseaseId,
        ...diseaseInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching disease info:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disease information",
      error: error.message,
    });
  }
});

// GET /api/disease-detection/metrics
// Get model performance metrics
router.get("/metrics", async (req, res) => {
  try {
    const metrics = diseaseDetectionModel.getModelMetrics();

    res.json({
      success: true,
      metrics: metrics,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching model metrics",
      error: error.message,
    });
  }
});

// POST /api/disease-detection/validate
// Validate if a disease ID is supported
router.post("/validate", async (req, res) => {
  try {
    const { diseaseId } = req.body;

    if (!diseaseId) {
      return res.status(400).json({
        success: false,
        message: "Disease ID is required",
      });
    }

    const isSupported = diseaseDetectionModel.isDiseaseSupported(diseaseId);

    res.json({
      success: true,
      isSupported: isSupported,
      diseaseId: diseaseId,
    });
  } catch (error) {
    console.error("Error validating disease:", error);
    res.status(500).json({
      success: false,
      message: "Error validating disease",
      error: error.message,
    });
  }
});

// GET /api/disease-detection/health
// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const isModelLoaded = diseaseDetectionModel.isModelLoaded;

    res.json({
      success: true,
      status: "healthy",
      modelLoaded: isModelLoaded,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in health check:", error);
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

module.exports = router;
