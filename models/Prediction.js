const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Image data
    image: {
      data: {
        type: Buffer,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
      originalName: String,
      size: Number,
    },

    // Prediction results
    prediction: {
      diseaseName: {
        type: String,
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      severity: {
        type: String,
        enum: ["low", "moderate", "high"],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      treatment: {
        type: String,
        required: true,
      },
      prevention: [String],
      allPredictions: [
        {
          disease: String,
          confidence: Number,
        },
      ],
    },

    // Fertilizer recommendation
    fertilizer: {
      name: String,
      description: String,
      application: String,
      dosage: String,
    },

    // Metadata
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    processingTime: Number, // in milliseconds

    // Location data (optional)
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },

    // Notes from user
    notes: String,

    // Tags for categorization
    tags: [String],

    // Sharing settings
    isPublic: {
      type: Boolean,
      default: false,
    },

    // Analytics
    views: {
      type: Number,
      default: 0,
    },

    // Status tracking
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ "prediction.diseaseName": 1 });
predictionSchema.index({ "prediction.severity": 1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for image URL (if needed for frontend)
predictionSchema.virtual("imageUrl").get(function () {
  return `/api/predictions/${this._id}/image`;
});

// Ensure virtual fields are serialized
predictionSchema.set("toJSON", { virtuals: true });
predictionSchema.set("toObject", { virtuals: true });

// Pre-save middleware to add tags based on prediction
predictionSchema.pre("save", function (next) {
  if (this.prediction && this.prediction.diseaseName) {
    this.tags = [
      this.prediction.diseaseName.toLowerCase().replace(/_/g, " "),
      this.prediction.severity,
      "disease-detection",
    ];
  }
  next();
});

// Static method to get user's prediction history
predictionSchema.statics.getUserHistory = function (userId, limit = 10) {
  return this.find({ user: userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-image.data"); // Exclude image data for performance
};

// Static method to get public predictions
predictionSchema.statics.getPublicPredictions = function (limit = 20) {
  return this.find({ isPublic: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-image.data")
    .populate("user", "name email");
};

// Instance method to increment views
predictionSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model("Prediction", predictionSchema);
