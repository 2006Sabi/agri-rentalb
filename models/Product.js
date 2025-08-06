    const mongoose = require("mongoose");

    const productSchema = new mongoose.Schema(
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
            "Seeds",
            "Fertilizers",
            "Pesticides",
            "Tools",
            "Machinery",
            "Other",
        ],
        },
        subcategory: {
        type: String,
        trim: true,
        },
        seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },
        price: {
        type: Number,
        required: true,
        min: 0,
        },
        unit: {
        type: String,
        required: true,
        enum: [
            "kg",
            "gram",
            "liter",
            "piece",
            "packet",
            "bag",
            "set",
            "meter",
            "other",
        ],
        },
        stock: {
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        minQuantity: {
            type: Number,
            default: 5,
        },
        maxOrderQuantity: {
            type: Number,
            default: 1000,
        },
        },
        images: [
        {
            url: String,
            alt: String,
            isPrimary: {
            type: Boolean,
            default: false,
            },
        },
        ],
        specifications: {
        brand: String,
        variety: String,
        purity: String,
        germination: String,
        moisture: String,
        npkRatio: String,
        activeIngredient: String,
        concentration: String,
        expiryDate: Date,
        batchNumber: String,
        manufacturingDate: Date,
        },
        features: [String],
        usageInstructions: String,
        storageInstructions: String,
        safetyInstructions: String,
        certifications: [
        {
            name: String,
            number: String,
            issuedBy: String,
            validTill: Date,
        },
        ],
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
            date: {
            type: Date,
            default: Date.now,
            },
        },
        ],
        salesCount: {
        type: Number,
        default: 0,
        },
        totalRevenue: {
        type: Number,
        default: 0,
        },
        discount: {
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        validFrom: Date,
        validTo: Date,
        },
        shipping: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
        },
        freeShippingThreshold: {
            type: Number,
            default: 1000,
        },
        },
        tags: [String],
        seoTitle: String,
        seoDescription: String,
        status: {
        type: String,
        enum: ["active", "inactive", "out_of_stock", "discontinued"],
        default: "active",
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

    // Index for search and filtering
    productSchema.index({ name: "text", description: "text", tags: "text" });
    productSchema.index({ category: 1, subcategory: 1 });
    productSchema.index({ seller: 1 });
    productSchema.index({ price: 1 });

    module.exports = mongoose.model("Product", productSchema);
