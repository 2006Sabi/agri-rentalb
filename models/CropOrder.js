const mongoose = require("mongoose");

const cropOrderSchema = new mongoose.Schema(
  {
    cropSellId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropSell",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    deliveryDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "bank_transfer"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    buyerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    buyerReview: {
      type: String,
      trim: true,
    },
    sellerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    sellerReview: {
      type: String,
      trim: true,
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

// Calculate total amount before saving
cropOrderSchema.pre("save", function (next) {
  this.totalAmount = this.quantity * this.pricePerUnit;
  next();
});

// Index for better query performance
cropOrderSchema.index({ buyerId: 1, status: 1 });
cropOrderSchema.index({ sellerId: 1, status: 1 });
cropOrderSchema.index({ cropSellId: 1 });

module.exports = mongoose.model("CropOrder", cropOrderSchema);
