const express = require("express");
const router = express.Router();
const CropSell = require("../models/CropSell");

// ✅ Create a new crop listing
router.post("/", async (req, res) => {
  try {
    const crop = new CropSell(req.body);
    await crop.save();
    res.status(201).json({ success: true, data: crop });
  } catch (error) {
    console.error("Error creating crop:", error);
    res.status(500).json({ success: false, message: "Failed to list crop" });
  }
});

// ✅ Get all crop listings
router.get("/", async (req, res) => {
  try {
    const crops = await CropSell.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: crops });
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ success: false, message: "Failed to fetch crops" });
  }
});

// ✅ Get a specific crop by ID
router.get("/:id", async (req, res) => {
  try {
    const crop = await CropSell.findById(req.params.id);
    if (!crop)
      return res
        .status(404)
        .json({ success: false, message: "Crop not found" });
    res.status(200).json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving crop" });
  }
});

// ✅ Delete a crop listing
router.delete("/:id", async (req, res) => {
  try {
    const deletedCrop = await CropSell.findByIdAndDelete(req.params.id);
    if (!deletedCrop)
      return res
        .status(404)
        .json({ success: false, message: "Crop not found" });
    res
      .status(200)
      .json({ success: true, message: "Crop deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting crop" });
  }
});

module.exports = router;
