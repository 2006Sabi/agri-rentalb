const mongoose = require("mongoose");
const Cart = require("../models/Cart");
require("dotenv").config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sece";

async function migrateCartData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // This script would be run manually to migrate any existing cart data
    // from localStorage to MongoDB when users log in

    console.log("Cart migration script ready");
    console.log(
      "Note: This script is for manual migration of localStorage cart data"
    );
    console.log("Users will need to log in again to sync their cart data");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateCartData();
