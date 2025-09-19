const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Error handling for route parsing
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-domain.com", "http://localhost:3000"]
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// URL validation middleware to catch malformed requests early
app.use((req, res, next) => {
  // Check for malformed route patterns in the URL
  const malformedPatterns = [
    /:\s*$/, // Colon at end without parameter name
    /:\W/, // Colon followed by non-word character
    /[{}[\]()*+?^$|\\]/, // Special regex characters that might cause issues
    /%7B|%7D|%5B|%5D|%28|%29/, // URL encoded special characters: { } [ ] ( )
  ];
  
  let isMalformed = false; // Flag to track if a malformed URL is detected
  
  for (const pattern of malformedPatterns) {
    if (pattern.test(req.path)) {
      isMalformed = true; // Set flag to true if a malformed pattern is found
      break; // Exit loop early if a match is found
    }
  }
  
  if (isMalformed) {
    return res.status(400).json({
      success: false,
      message: "Invalid URL format",
    });
  }
  
  next();
});



// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sece";

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
try {
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/equipment", require("./routes/equipment"));
  app.use("/api/products", require("./routes/products"));
  app.use("/api/bookings", require("./routes/bookings"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/crop-sell", require("./routes/cropSell"));
  app.use("/api/forum", require("./routes/forum"));
  app.use("/api/crop-planner", require("./routes/cropPlanner"));
  app.use("/api/voice", require("./routes/voice"));
  app.use("/api/predictions", require("./routes/predictions"));
  app.use("/api/disease-detection", require("./routes/diseaseDetection"));
  app.use("/api/reports", require("./routes/reports"));
  app.use("/api/cart", require("./routes/cart"));
} catch (error) {
  console.error("Error mounting routes:", error);
  process.exit(1);
}

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Catch-all route for SPA - must be last
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
    });
  }

  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message || "Internal server error" : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
