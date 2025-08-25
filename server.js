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

// Debug middleware for request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
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
    console.log("Warning: Empty JSON body detected");
  }

  next();
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sece";
console.log(
  "Connecting to MongoDB:",
  MONGODB_URI.replace(/\/\/.*@/, "//[HIDDEN]@")
);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.name);
    console.log("🔗 Connection state:", mongoose.connection.readyState);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.error("🔧 Please check your MONGODB_URI environment variable");
    process.exit(1);
  });

// Routes
console.log("Mounting routes...");
try {
  console.log("Mounting auth routes...");
  app.use("/api/auth", require("./routes/auth"));
  
  console.log("Mounting equipment routes...");
  app.use("/api/equipment", require("./routes/equipment"));
  
  console.log("Mounting products routes...");
  app.use("/api/products", require("./routes/products"));
  
  console.log("Mounting bookings routes...");
  app.use("/api/bookings", require("./routes/bookings"));
  
  console.log("Mounting admin routes...");
  app.use("/api/admin", require("./routes/admin"));
  
  console.log("Mounting crop-sell routes...");
  app.use("/api/crop-sell", require("./routes/cropSell"));
  
  console.log("Mounting forum routes...");
  app.use("/api/forum", require("./routes/forum"));
  
  console.log("Mounting crop-planner routes...");
  app.use("/api/crop-planner", require("./routes/cropPlanner"));
  
  console.log("Mounting voice routes...");
  app.use("/api/voice", require("./routes/voice"));
  
  console.log("Mounting predictions routes...");
  app.use("/api/predictions", require("./routes/predictions"));
  
  console.log("Mounting disease-detection routes...");
  app.use("/api/disease-detection", require("./routes/diseaseDetection"));
  
  console.log("Mounting reports routes...");
  app.use("/api/reports", require("./routes/reports"));
  
  console.log("Mounting cart routes...");
  app.use("/api/cart", require("./routes/cart"));
  
  console.log("All routes mounted successfully");
} catch (error) {
  console.error("Error mounting routes:", error);
  console.error("Error stack:", error.stack);
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
  console.error("Error occurred:", error);
  console.error("Request details:", {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
