const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/sece", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
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

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
