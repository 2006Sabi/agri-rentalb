const mongoose = require("mongoose");

const cropSellSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "quintal", "ton", "piece", "dozen", "bundle"],
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["grains", "vegetables", "fruits", "pulses", "spices", "other"],
    },
    status: {
      type: String,
      enum: ["available", "sold", "reserved"],
      default: "available",
    },
    quality: {
      type: String,
      enum: ["premium", "good", "average"],
      default: "good",
    },
    organic: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total price before saving
cropSellSchema.pre("save", function (next) {
  this.totalPrice = this.quantity * this.pricePerUnit;
  next();
});

// Text index for search functionality
cropSellSchema.index({
  cropName: "text",
  description: "text",
  location: "text",
  category: "text",
});

// Index for filtering
cropSellSchema.index({ category: 1, status: 1, isActive: 1 });
cropSellSchema.index({ sellerId: 1, status: 1 });
cropSellSchema.index({ pricePerUnit: 1 });
cropSellSchema.index({ harvestDate: 1 });

module.exports = mongoose.model("CropSell", cropSellSchema);
