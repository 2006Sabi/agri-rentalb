const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const logger = require("./utils/logger");

// Error handling for route parsing
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
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
      logger.warn(`Malformed URL pattern detected: ${req.path}`);
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

// Debug middleware for request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      "content-type": req.headers["content-type"],
      authorization: req.headers.authorization ? "Bearer [HIDDEN]" : "None",
      "content-length": req.headers["content-length"],
    },
  });

  // Check for malformed JSON
  if (
    req.headers["content-type"]?.includes("application/json") &&
    req.body &&
    Object.keys(req.body).length === 0
  ) {
    logger.warn("Empty JSON body detected");
  }

  next();
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sece";
logger.info(
  "Connecting to MongoDB:",
  MONGODB_URI.replace(/\/\/.*@/, "//[HIDDEN]@")
);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    logger.info("✅ MongoDB connected successfully");
    logger.info("📊 Database:", mongoose.connection.name);
    logger.info("🔗 Connection state:", mongoose.connection.readyState);
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error:", err);
    logger.error("🔧 Please check your MONGODB_URI environment variable");
    process.exit(1);
  });

// Routes
logger.info("Mounting routes...");
try {
  logger.info("Mounting auth routes...");
  app.use("/api/auth", require("./routes/auth"));
  
  logger.info("Mounting equipment routes...");
  app.use("/api/equipment", require("./routes/equipment"));
  
  logger.info("Mounting products routes...");
  app.use("/api/products", require("./routes/products"));
  
  logger.info("Mounting bookings routes...");
  app.use("/api/bookings", require("./routes/bookings"));
  
  logger.info("Mounting admin routes...");
  app.use("/api/admin", require("./routes/admin"));
  
  logger.info("Mounting crop-sell routes...");
  app.use("/api/crop-sell", require("./routes/cropSell"));
  
  logger.info("Mounting forum routes...");
  app.use("/api/forum", require("./routes/forum"));
  
  logger.info("Mounting crop-planner routes...");
  app.use("/api/crop-planner", require("./routes/cropPlanner"));
  
  logger.info("Mounting voice routes...");
  app.use("/api/voice", require("./routes/voice"));
  
  logger.info("Mounting predictions routes...");
  app.use("/api/predictions", require("./routes/predictions"));
  
  logger.info("Mounting disease-detection routes...");
  app.use("/api/disease-detection", require("./routes/diseaseDetection"));
  
  logger.info("Mounting reports routes...");
  app.use("/api/reports", require("./routes/reports"));
  
  logger.info("Mounting cart routes...");
  app.use("/api/cart", require("./routes/cart"));
  
  logger.info("All routes mounted successfully");
} catch (error) {
  logger.error("Error mounting routes:", error);
  logger.error("Error stack:", error.stack);
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
  logger.error("Error occurred:", error);
  logger.error("Request details:", {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Sanitize error messages to remove debug URLs
  const sanitizedMessage = error.message ? error.message.replace(/https:\/\/git\.new\/pathToRegexpError/g, "") : "Internal server error";

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
    });
  }

  res.status(500).json({
    success: false,
    message: sanitizedMessage,
    error: process.env.NODE_ENV === "development" ? sanitizedMessage : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
