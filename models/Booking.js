const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rentalPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      startTime: String,
      endTime: String,
      totalHours: Number,
      totalDays: Number,
    },
    pricing: {
      rateType: {
        type: String,
        enum: ["hourly", "daily", "weekly", "monthly"],
        required: true,
      },
      rate: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      securityDeposit: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    location: {
      deliveryAddress: {
        type: String,
        required: true,
      },
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    delivery: {
      isDeliveryRequired: {
        type: Boolean,
        default: true,
      },
      deliveryCharge: {
        type: Number,
        default: 0,
      },
      deliveryDistance: Number,
      deliveryTime: String,
      pickupTime: String,
    },
    operator: {
      isOperatorRequired: {
        type: Boolean,
        default: false,
      },
      operatorCharge: {
        type: Number,
        default: 0,
      },
      operatorName: String,
      operatorContact: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending",
    },
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "upi", "bank_transfer", "wallet"],
        default: "cash",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "partial", "refunded", "failed"],
        default: "pending",
      },
      transactionId: String,
      paidAmount: {
        type: Number,
        default: 0,
      },
      paymentDate: Date,
      refundAmount: {
        type: Number,
        default: 0,
      },
      refundDate: Date,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ["agreement", "invoice", "receipt", "damage_report", "other"],
        },
        url: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      renterNotes: String,
      ownerNotes: String,
      adminNotes: String,
    },
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],
    rating: {
      renterRating: {
        equipment: {
          type: Number,
          min: 1,
          max: 5,
        },
        owner: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: Date,
      },
      ownerRating: {
        renter: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: Date,
      },
    },
    insurance: {
      isCovered: {
        type: Boolean,
        default: false,
      },
      provider: String,
      policyNumber: String,
      premium: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Generate booking ID before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model("Booking").countDocuments();
    this.bookingId = `BK${Date.now()}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Index for efficient queries
bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ equipment: 1 });
bookingSchema.index({ "rentalPeriod.startDate": 1, "rentalPeriod.endDate": 1 });

module.exports = mongoose.model("Booking", bookingSchema);
