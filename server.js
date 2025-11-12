const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-domain.com"]
        : ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/agri_rental";

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Import Routes
const authRoutes = require("./routes/auth");
const equipmentRoutes = require("./routes/equipment");
const productRoutes = require("./routes/products");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");
const cropSellRoutes = require("./routes/cropSell");
const forumRoutes = require("./routes/forum");
const cropPlannerRoutes = require("./routes/cropPlanner");
const voiceRoutes = require("./routes/voice");
const predictionRoutes = require("./routes/predictions");
const diseaseRoutes = require("./routes/diseaseDetection");
const reportRoutes = require("./routes/reports");
const cartRoutes = require("./routes/cart");

// ✅ Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/crop-sell", cropSellRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/crop-planner", cropPlannerRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/disease-detection", diseaseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/cart", cartRoutes);

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("🌿 AgriRental API running successfully!");
});

// ✅ Production build setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
