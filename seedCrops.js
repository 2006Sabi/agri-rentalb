const mongoose = require("mongoose");
const CropSell = require("./models/CropSell");
const User = require("./models/User");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/agri-rental", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleCrops = [
  {
    cropName: "Fresh Tomatoes",
    quantity: 50,
    unit: "kg",
    pricePerUnit: 40,
    description: "Fresh, red tomatoes harvested from our organic farm. Perfect for cooking and salads.",
    location: "Punjab, India",
    harvestDate: new Date("2024-01-15"),
    category: "vegetables",
    quality: "premium",
    organic: true,
    images: ["https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400"],
    views: 25,
  },
  {
    cropName: "Basmati Rice",
    quantity: 100,
    unit: "kg",
    pricePerUnit: 80,
    description: "Premium quality basmati rice, long grain and aromatic. Perfect for biryanis and pulao.",
    location: "Haryana, India",
    harvestDate: new Date("2024-01-10"),
    category: "grains",
    quality: "premium",
    organic: false,
    images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"],
    views: 42,
  },
  {
    cropName: "Sweet Corn",
    quantity: 30,
    unit: "kg",
    pricePerUnit: 35,
    description: "Sweet and juicy corn, perfect for boiling or grilling. Freshly harvested.",
    location: "Maharashtra, India",
    harvestDate: new Date("2024-01-12"),
    category: "vegetables",
    quality: "good",
    organic: true,
    images: ["https://images.unsplash.com/photo-1601593768797-9d5d8d2c5c5c?w=400"],
    views: 18,
  },
  {
    cropName: "Mangoes",
    quantity: 25,
    unit: "kg",
    pricePerUnit: 120,
    description: "Sweet and juicy alphonso mangoes. Perfect for eating fresh or making desserts.",
    location: "Karnataka, India",
    harvestDate: new Date("2024-01-08"),
    category: "fruits",
    quality: "premium",
    organic: false,
    images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=400"],
    views: 35,
  },
  {
    cropName: "Wheat",
    quantity: 200,
    unit: "kg",
    pricePerUnit: 25,
    description: "High-quality wheat grain, perfect for making bread and other wheat products.",
    location: "Uttar Pradesh, India",
    harvestDate: new Date("2024-01-05"),
    category: "grains",
    quality: "good",
    organic: false,
    images: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"],
    views: 28,
  },
  {
    cropName: "Green Peas",
    quantity: 40,
    unit: "kg",
    pricePerUnit: 60,
    description: "Fresh green peas, sweet and tender. Great for curries and salads.",
    location: "Punjab, India",
    harvestDate: new Date("2024-01-14"),
    category: "vegetables",
    quality: "good",
    organic: true,
    images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"],
    views: 22,
  },
  {
    cropName: "Oranges",
    quantity: 35,
    unit: "kg",
    pricePerUnit: 90,
    description: "Sweet and tangy oranges, rich in vitamin C. Perfect for juicing or eating fresh.",
    location: "Nagpur, India",
    harvestDate: new Date("2024-01-11"),
    category: "fruits",
    quality: "premium",
    organic: false,
    images: ["https://images.unsplash.com/photo-1547514701-42782101795e?w=400"],
    views: 31,
  },
  {
    cropName: "Lentils",
    quantity: 80,
    unit: "kg",
    pricePerUnit: 70,
    description: "High-protein lentils, perfect for making dal and other Indian dishes.",
    location: "Madhya Pradesh, India",
    harvestDate: new Date("2024-01-09"),
    category: "pulses",
    quality: "good",
    organic: true,
    images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"],
    views: 19,
  },
];

const seedCrops = async () => {
  try {
    // First, get a farmer user to assign as seller
    const farmer = await User.findOne({ role: "farmer" });
    
    if (!farmer) {
      console.log("No farmer user found. Please create a farmer user first.");
      return;
    }

    // Clear existing crops
    await CropSell.deleteMany({});
    console.log("Cleared existing crops");

    // Add sample crops with the farmer as seller
    const cropsWithSeller = sampleCrops.map(crop => ({
      ...crop,
      sellerId: farmer._id,
      status: "available",
      isActive: true,
    }));

    await CropSell.insertMany(cropsWithSeller);
    console.log("Added sample crops successfully");

    console.log(`Added ${sampleCrops.length} sample crops`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding crops:", error);
    process.exit(1);
  }
};

seedCrops(); 