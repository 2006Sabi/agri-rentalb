const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: {
      type: String,
      enum: [
        "equipment_issue",
        "payment_dispute",
        "safety_concern",
        "fraud",
        "harassment",
        "quality_issue",
        "service_issue",
        "other"
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["farmer", "owner", "equipment", "booking", "payment", "general"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "closed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    evidence: [{
      type: {
        type: String,
        enum: ["image", "document", "video", "audio"],
      },
      url: String,
      description: String,
    }],
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    relatedEquipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
    },
    adminNotes: [{
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      note: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    resolution: {
      action: String,
      description: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
    },
    tags: [String],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    estimatedResolutionTime: {
      type: Number, // in days
      default: 7,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema); 