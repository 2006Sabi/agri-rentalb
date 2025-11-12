const mongoose = require("mongoose");

const cropSellSchema = new mongoose.Schema(
  {
    cropName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "kg" },
    pricePerUnit: { type: Number, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    harvestDate: { type: Date, required: true },
    expiryDate: { type: Date },
    quality: { type: String, default: "good" },
    organic: { type: Boolean, default: false },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropSell", cropSellSchema);
