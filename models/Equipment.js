const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Tractor",
        "JCB",
        "Harvester",
        "Tiller",
        "Sprayer",
        "Crane",
        "Truck",
        "Pipeline",
        "Other",
      ],
    },
    subcategory: {
      type: String,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pricing: {
      hourly: { type: Number, min: 0 },
      daily: { type: Number, min: 0 },
      weekly: { type: Number, min: 0 },
      monthly: { type: Number, min: 0 },
    },

    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },

    specifications: {
      make: String,
      model: String,
      year: Number,
      horsepower: String,
      fuelType: String,
      transmission: String,
      capacity: String,
      dimensions: String,
      weight: String,
      operatingHours: Number,
      lastMaintenance: Date,
    },

    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],

    documents: [
      {
        type: String, // e.g. "RC", "Insurance", "ServiceRecord"
        url: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],

    availability: {
      isAvailable: { type: Boolean, default: true },
      availableFrom: Date,
      availableTo: Date,
      unavailableDates: [Date],
      workingHours: {
        start: String, // "08:00"
        end: String, // "18:00"
      },
    },

    features: [String],
    attachments: [String],

    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
      default: "Good",
    },

    insurance: {
      isInsured: { type: Boolean, default: false },
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },

    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],

    bookingCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "inactive"],
      default: "pending",
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for search performance
equipmentSchema.index({ "location.coordinates": "2dsphere" });
equipmentSchema.index({ category: 1, "location.city": 1 });
equipmentSchema.index({ owner: 1 });

module.exports = mongoose.model("Equipment", equipmentSchema);
