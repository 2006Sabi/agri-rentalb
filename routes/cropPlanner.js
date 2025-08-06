const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Crop database with ML-based recommendations
const cropDatabase = {
  rice: {
    name: "Rice",
    varieties: ["ADT-43", "IR-64", "Pusa Basmati", "Swarna"],
    climate: {
      temperature: { min: 20, max: 35, optimal: 25 },
      rainfall: { min: 1000, max: 2000, optimal: 1500 },
      humidity: { min: 60, max: 90, optimal: 75 },
    },
    soil: ["clay", "loamy", "silt"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 15" },
      rabi: { start: "November", end: "December", optimal: "November 15" },
    },
    tools: ["Tractor", "Puddler", "Transplanter", "Combine Harvester"],
    fertilizers: {
      basal: "NPK 20-20-0 @ 250 kg/acre",
      topDress: "Urea @ 100 kg/acre",
      micronutrients: "Zinc Sulphate @ 25 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "High",
    expectedYield: { min: 3, max: 5, unit: "tons/acre" },
  },
  wheat: {
    name: "Wheat",
    varieties: ["HD-2967", "PBW-343", "UP-2338", "K-9107"],
    climate: {
      temperature: { min: 15, max: 25, optimal: 20 },
      rainfall: { min: 400, max: 800, optimal: 600 },
      humidity: { min: 40, max: 70, optimal: 55 },
    },
    soil: ["loamy", "clay", "silt"],
    sowingWindows: {
      rabi: { start: "November", end: "December", optimal: "November 15" },
    },
    tools: ["Tractor", "Seed Drill", "Combine Harvester", "Thresher"],
    fertilizers: {
      basal: "NPK 12-32-16 @ 150 kg/acre",
      topDress: "Urea @ 80 kg/acre",
      micronutrients: "Boron @ 2 kg/acre",
    },
    pestManagement: ["Fungicides", "Insecticides", "IPM"],
    waterRequirement: "Medium",
    expectedYield: { min: 20, max: 30, unit: "quintals/acre" },
  },
  maize: {
    name: "Maize",
    varieties: ["African Tall", "Ganga Safed", "Pioneer", "Syngenta"],
    climate: {
      temperature: { min: 18, max: 32, optimal: 25 },
      rainfall: { min: 500, max: 1200, optimal: 800 },
      humidity: { min: 50, max: 80, optimal: 65 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 1" },
      rabi: { start: "January", end: "February", optimal: "January 15" },
      zaid: { start: "March", end: "April", optimal: "March 15" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer", "Harvester"],
    fertilizers: {
      basal: "NPK 17-17-17 @ 200 kg/acre",
      topDress: "Urea @ 120 kg/acre",
      micronutrients: "Zinc Sulphate @ 20 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Control"],
    waterRequirement: "Medium",
    expectedYield: { min: 25, max: 35, unit: "quintals/acre" },
  },
  cotton: {
    name: "Cotton",
    varieties: ["Suraj", "Bunny", "RCH-2", "Ankur"],
    climate: {
      temperature: { min: 20, max: 35, optimal: 28 },
      rainfall: { min: 600, max: 1200, optimal: 900 },
      humidity: { min: 60, max: 85, optimal: 72 },
    },
    soil: ["black", "red", "loamy"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 1" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer", "Cotton Picker"],
    fertilizers: {
      basal: "NPK 17-17-17 @ 200 kg/acre",
      topDress: "Urea @ 100 kg/acre",
      micronutrients: "Boron @ 1.5 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "Medium",
    expectedYield: { min: 15, max: 20, unit: "quintals/acre" },
  },
  sugarcane: {
    name: "Sugarcane",
    varieties: ["Co-86032", "Co-0238", "Co-1148", "Co-15023"],
    climate: {
      temperature: { min: 20, max: 38, optimal: 30 },
      rainfall: { min: 800, max: 1500, optimal: 1200 },
      humidity: { min: 65, max: 90, optimal: 80 },
    },
    soil: ["loamy", "clay", "silt"],
    sowingWindows: {
      spring: { start: "February", end: "March", optimal: "February 15" },
      autumn: { start: "September", end: "October", optimal: "September 15" },
    },
    tools: ["Tractor", "Planter", "Harvester", "Crusher"],
    fertilizers: {
      basal: "NPK 20-20-0 @ 300 kg/acre",
      topDress: "Urea @ 150 kg/acre",
      micronutrients: "Zinc Sulphate @ 30 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Control"],
    waterRequirement: "High",
    expectedYield: { min: 300, max: 400, unit: "tons/acre" },
  },
  corn: {
    name: "Corn",
    varieties: ["Sweet Corn", "Field Corn", "Popcorn", "Dent Corn"],
    climate: {
      temperature: { min: 18, max: 32, optimal: 25 },
      rainfall: { min: 500, max: 1200, optimal: 800 },
      humidity: { min: 50, max: 80, optimal: 65 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 1" },
      rabi: { start: "January", end: "February", optimal: "January 15" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer", "Harvester"],
    fertilizers: {
      basal: "NPK 17-17-17 @ 200 kg/acre",
      topDress: "Urea @ 120 kg/acre",
      micronutrients: "Zinc Sulphate @ 20 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Control"],
    waterRequirement: "Medium",
    expectedYield: { min: 25, max: 35, unit: "quintals/acre" },
  },
  soybean: {
    name: "Soybean",
    varieties: ["JS-335", "JS-9305", "MAUS-47", "PK-472"],
    climate: {
      temperature: { min: 20, max: 35, optimal: 28 },
      rainfall: { min: 600, max: 1000, optimal: 800 },
      humidity: { min: 60, max: 85, optimal: 72 },
    },
    soil: ["loamy", "clay", "silt"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 15" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer", "Combine"],
    fertilizers: {
      basal: "NPK 12-32-16 @ 150 kg/acre",
      topDress: "Urea @ 80 kg/acre",
      micronutrients: "Boron @ 2 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "Medium",
    expectedYield: { min: 15, max: 25, unit: "quintals/acre" },
  },
  mustard: {
    name: "Mustard",
    varieties: ["Pusa Bold", "Pusa Agrani", "Varuna", "Kranti"],
    climate: {
      temperature: { min: 15, max: 25, optimal: 20 },
      rainfall: { min: 300, max: 600, optimal: 450 },
      humidity: { min: 40, max: 70, optimal: 55 },
    },
    soil: ["loamy", "clay", "silt"],
    sowingWindows: {
      rabi: { start: "October", end: "November", optimal: "October 15" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer"],
    fertilizers: {
      basal: "NPK 18-46-0 @ 100 kg/acre",
      topDress: "Urea @ 60 kg/acre",
      micronutrients: "Boron @ 1 kg/acre",
    },
    pestManagement: ["IPM", "Fungicides", "Insecticides"],
    waterRequirement: "Low",
    expectedYield: { min: 8, max: 12, unit: "quintals/acre" },
  },
  chickpea: {
    name: "Chickpea",
    varieties: ["Pusa-372", "Pusa-391", "JG-11", "KAK-2"],
    climate: {
      temperature: { min: 15, max: 25, optimal: 20 },
      rainfall: { min: 400, max: 700, optimal: 550 },
      humidity: { min: 45, max: 75, optimal: 60 },
    },
    soil: ["loamy", "clay", "silt"],
    sowingWindows: {
      rabi: { start: "October", end: "November", optimal: "October 15" },
    },
    tools: ["Tractor", "Seed Drill", "Sprayer"],
    fertilizers: {
      basal: "NPK 12-32-16 @ 100 kg/acre",
      topDress: "Urea @ 50 kg/acre",
      micronutrients: "Zinc Sulphate @ 15 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Control"],
    waterRequirement: "Low",
    expectedYield: { min: 12, max: 18, unit: "quintals/acre" },
  },
  tomato: {
    name: "Tomato",
    varieties: ["Pusa Ruby", "Pusa Early Dwarf", "Arka Vikas", "Hybrid"],
    climate: {
      temperature: { min: 20, max: 30, optimal: 25 },
      rainfall: { min: 400, max: 800, optimal: 600 },
      humidity: { min: 50, max: 80, optimal: 65 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 15" },
      rabi: { start: "November", end: "December", optimal: "November 15" },
      zaid: { start: "February", end: "March", optimal: "February 15" },
    },
    tools: ["Tractor", "Transplanter", "Sprayer", "Harvester"],
    fertilizers: {
      basal: "NPK 20-20-0 @ 150 kg/acre",
      topDress: "Urea @ 100 kg/acre",
      micronutrients: "Boron @ 2 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "Medium",
    expectedYield: { min: 200, max: 300, unit: "quintals/acre" },
  },
  onion: {
    name: "Onion",
    varieties: ["Pusa Red", "Pusa White", "Arka Kalyan", "Hybrid"],
    climate: {
      temperature: { min: 15, max: 30, optimal: 22 },
      rainfall: { min: 300, max: 600, optimal: 450 },
      humidity: { min: 40, max: 70, optimal: 55 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      kharif: { start: "May", end: "June", optimal: "May 15" },
      rabi: { start: "October", end: "November", optimal: "October 15" },
    },
    tools: ["Tractor", "Transplanter", "Sprayer"],
    fertilizers: {
      basal: "NPK 12-32-16 @ 120 kg/acre",
      topDress: "Urea @ 80 kg/acre",
      micronutrients: "Zinc Sulphate @ 20 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Control"],
    waterRequirement: "Medium",
    expectedYield: { min: 150, max: 250, unit: "quintals/acre" },
  },
  potato: {
    name: "Potato",
    varieties: ["Kufri Chandramukhi", "Kufri Jyoti", "Kufri Bahar", "Hybrid"],
    climate: {
      temperature: { min: 15, max: 25, optimal: 20 },
      rainfall: { min: 400, max: 700, optimal: 550 },
      humidity: { min: 50, max: 80, optimal: 65 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      rabi: { start: "October", end: "November", optimal: "October 15" },
      zaid: { start: "January", end: "February", optimal: "January 15" },
    },
    tools: ["Tractor", "Planter", "Sprayer", "Harvester"],
    fertilizers: {
      basal: "NPK 15-15-15 @ 200 kg/acre",
      topDress: "Urea @ 120 kg/acre",
      micronutrients: "Boron @ 2 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "Medium",
    expectedYield: { min: 200, max: 300, unit: "quintals/acre" },
  },
  chili: {
    name: "Chili",
    varieties: ["Pusa Jwala", "Pusa Sadabahar", "Arka Lohit", "Hybrid"],
    climate: {
      temperature: { min: 20, max: 35, optimal: 28 },
      rainfall: { min: 400, max: 800, optimal: 600 },
      humidity: { min: 50, max: 80, optimal: 65 },
    },
    soil: ["loamy", "sandy", "clay"],
    sowingWindows: {
      kharif: { start: "June", end: "July", optimal: "June 15" },
      rabi: { start: "November", end: "December", optimal: "November 15" },
    },
    tools: ["Tractor", "Transplanter", "Sprayer"],
    fertilizers: {
      basal: "NPK 20-20-0 @ 150 kg/acre",
      topDress: "Urea @ 100 kg/acre",
      micronutrients: "Boron @ 2 kg/acre",
    },
    pestManagement: ["IPM", "Biological Control", "Chemical Pesticides"],
    waterRequirement: "Medium",
    expectedYield: { min: 80, max: 120, unit: "quintals/acre" },
  },
};

// Weather data for different regions (simplified)
const weatherData = {
  "Tamil Nadu": {
    temperature: { annual: 25, kharif: 28, rabi: 22, zaid: 32 },
    rainfall: { annual: 1000, kharif: 600, rabi: 200, zaid: 100 },
    humidity: { annual: 70, kharif: 80, rabi: 60, zaid: 50 },
  },
  Punjab: {
    temperature: { annual: 22, kharif: 30, rabi: 15, zaid: 35 },
    rainfall: { annual: 600, kharif: 400, rabi: 100, zaid: 50 },
    humidity: { annual: 60, kharif: 70, rabi: 45, zaid: 40 },
  },
  Maharashtra: {
    temperature: { annual: 26, kharif: 30, rabi: 20, zaid: 35 },
    rainfall: { annual: 1200, kharif: 800, rabi: 150, zaid: 80 },
    humidity: { annual: 65, kharif: 75, rabi: 55, zaid: 45 },
  },
  Karnataka: {
    temperature: { annual: 24, kharif: 28, rabi: 18, zaid: 30 },
    rainfall: { annual: 1100, kharif: 700, rabi: 180, zaid: 90 },
    humidity: { annual: 68, kharif: 78, rabi: 58, zaid: 48 },
  },
};

// ML-based sowing time prediction algorithm
function predictOptimalSowingTime(crop, region, soilType, currentMonth) {
  const cropData = cropDatabase[crop.toLowerCase()];
  const regionWeather = weatherData[region] || weatherData["Tamil Nadu"];

  if (!cropData) return null;

  // Calculate climate suitability score
  const tempScore = calculateTemperatureScore(
    cropData.climate.temperature,
    regionWeather.temperature
  );
  const rainfallScore = calculateRainfallScore(
    cropData.climate.rainfall,
    regionWeather.rainfall
  );
  const humidityScore = calculateHumidityScore(
    cropData.climate.humidity,
    regionWeather.humidity
  );

  // Soil compatibility
  const soilScore = cropData.soil.includes(soilType) ? 1 : 0.5;

  // Overall suitability score
  const suitabilityScore =
    (tempScore + rainfallScore + humidityScore + soilScore) / 4;

  // Determine optimal sowing window
  let optimalWindow = null;
  let nextSowingDate = null;

  Object.entries(cropData.sowingWindows).forEach(([season, window]) => {
    const seasonMonth = getSeasonMonth(season);
    if (seasonMonth > currentMonth) {
      if (!optimalWindow || suitabilityScore > optimalWindow.score) {
        optimalWindow = {
          season,
          window,
          score: suitabilityScore,
        };
        nextSowingDate = window.optimal;
      }
    }
  });

  return {
    optimalSowingDate: nextSowingDate,
    suitabilityScore: suitabilityScore,
    season: optimalWindow?.season,
    climateAnalysis: {
      temperature: {
        score: tempScore,
        status: tempScore > 0.7 ? "Optimal" : "Sub-optimal",
      },
      rainfall: {
        score: rainfallScore,
        status: rainfallScore > 0.7 ? "Optimal" : "Sub-optimal",
      },
      humidity: {
        score: humidityScore,
        status: humidityScore > 0.7 ? "Optimal" : "Sub-optimal",
      },
      soil: {
        score: soilScore,
        status: soilScore > 0.8 ? "Compatible" : "Moderate",
      },
    },
  };
}

function calculateTemperatureScore(cropTemp, regionTemp) {
  const tempDiff = Math.abs(cropTemp.optimal - regionTemp.annual);
  return Math.max(0, 1 - tempDiff / 10);
}

function calculateRainfallScore(cropRainfall, regionRainfall) {
  const rainfallDiff = Math.abs(cropRainfall.optimal - regionRainfall.annual);
  return Math.max(0, 1 - rainfallDiff / 500);
}

function calculateHumidityScore(cropHumidity, regionHumidity) {
  const humidityDiff = Math.abs(cropHumidity.optimal - regionHumidity.annual);
  return Math.max(0, 1 - humidityDiff / 20);
}

function getSeasonMonth(season) {
  const seasonMonths = {
    kharif: 6, // June
    rabi: 11, // November
    zaid: 3, // March
    spring: 2, // February
    autumn: 9, // September
  };
  return seasonMonths[season] || 1;
}

// Generate comprehensive crop plan
function generateCropPlan(
  crop,
  region,
  soilType,
  farmSize,
  budget,
  experience
) {
  const cropData = cropDatabase[crop.toLowerCase()];
  if (!cropData) return null;

  const currentMonth = new Date().getMonth() + 1;
  const sowingPrediction = predictOptimalSowingTime(
    crop,
    region,
    soilType,
    currentMonth
  );

  // Calculate area allocation based on farm size
  const areaAllocation = Math.min(farmSize * 0.8, farmSize); // Use 80% of farm size

  // Calculate input requirements
  const seedRequirement = calculateSeedRequirement(crop, areaAllocation);
  const fertilizerRequirement = calculateFertilizerRequirement(
    crop,
    areaAllocation
  );
  const equipmentNeeds = getEquipmentNeeds(crop, areaAllocation, experience);

  // Calculate financial projections
  const financialProjection = calculateFinancialProjection(
    crop,
    areaAllocation,
    budget
  );

  // Generate timeline
  const timeline = generateCropTimeline(
    crop,
    sowingPrediction.optimalSowingDate
  );

  return {
    crop: cropData.name,
    variety: cropData.varieties[0], // Default to first variety
    areaAllocation: `${areaAllocation} acres`,
    sowingPrediction,
    inputs: {
      seeds: seedRequirement,
      fertilizers: fertilizerRequirement,
      pesticides: cropData.pestManagement,
    },
    equipment: equipmentNeeds,
    timeline,
    financialProjection,
    riskAssessment: generateRiskAssessment(crop, region, sowingPrediction),
    recommendations: generateRecommendations(
      crop,
      region,
      soilType,
      experience
    ),
  };
}

function calculateSeedRequirement(crop, area) {
  const seedRates = {
    rice: 25,
    wheat: 40,
    maize: 25,
    cotton: 1.5,
    sugarcane: 35000, // setts per acre
  };
  return `${seedRates[crop] * area} kg/acre`;
}

function calculateFertilizerRequirement(crop, area) {
  const cropData = cropDatabase[crop.toLowerCase()];
  return cropData.fertilizers;
}

function getEquipmentNeeds(crop, area, experience) {
  const cropData = cropDatabase[crop.toLowerCase()];
  const baseEquipment = cropData.tools;

  // Add experience-based equipment
  if (experience === "beginner") {
    baseEquipment.push("Irrigation System", "Weather Station");
  } else if (experience === "expert") {
    baseEquipment.push("Precision Agriculture Tools", "Drone");
  }

  return baseEquipment;
}

function calculateFinancialProjection(crop, area, budget) {
  const cropData = cropDatabase[crop.toLowerCase()];
  const expectedYield = cropData.expectedYield;
  const avgYield = (expectedYield.min + expectedYield.max) / 2;

  // Simplified cost calculation
  const inputCost = area * 15000; // ₹15,000 per acre
  const laborCost = area * 8000; // ₹8,000 per acre
  const equipmentCost = area * 5000; // ₹5,000 per acre

  const totalCost = inputCost + laborCost + equipmentCost;
  const expectedRevenue = area * avgYield * 2000; // ₹2,000 per unit
  const netProfit = expectedRevenue - totalCost;
  const roi = (netProfit / totalCost) * 100;

  return {
    totalInvestment: `₹${totalCost.toLocaleString()}`,
    expectedRevenue: `₹${expectedRevenue.toLocaleString()}`,
    netProfit: `₹${netProfit.toLocaleString()}`,
    roi: `${roi.toFixed(1)}%`,
  };
}

function generateCropTimeline(crop, sowingDate) {
  const timelines = {
    rice: [
      {
        stage: "Land Preparation",
        duration: "15 days",
        activities: ["Plowing", "Puddling", "Leveling"],
      },
      {
        stage: "Nursery Preparation",
        duration: "25 days",
        activities: ["Seed treatment", "Nursery management"],
      },
      {
        stage: "Transplanting",
        duration: "7 days",
        activities: ["Transplanting", "Gap filling"],
      },
      {
        stage: "Vegetative Growth",
        duration: "45 days",
        activities: ["Weeding", "Fertilizer application"],
      },
      {
        stage: "Reproductive Phase",
        duration: "30 days",
        activities: ["Pest monitoring", "Water management"],
      },
      {
        stage: "Harvesting",
        duration: "15 days",
        activities: ["Harvesting", "Threshing", "Storage"],
      },
    ],
    wheat: [
      {
        stage: "Land Preparation",
        duration: "10 days",
        activities: ["Plowing", "Harrowing", "Leveling"],
      },
      {
        stage: "Sowing",
        duration: "5 days",
        activities: ["Seed treatment", "Sowing"],
      },
      {
        stage: "Vegetative Growth",
        duration: "60 days",
        activities: ["Weeding", "Fertilizer application"],
      },
      {
        stage: "Reproductive Phase",
        duration: "40 days",
        activities: ["Pest monitoring", "Irrigation"],
      },
      {
        stage: "Harvesting",
        duration: "10 days",
        activities: ["Harvesting", "Threshing"],
      },
    ],
  };

  return timelines[crop] || timelines.rice;
}

function generateRiskAssessment(crop, region, sowingPrediction) {
  const risks = [];

  if (sowingPrediction.suitabilityScore < 0.7) {
    risks.push({
      factor: "Climate Suitability",
      impact: "High",
      mitigation: "Consider alternative crops or adjust sowing time",
    });
  }

  if (region === "Punjab" && crop === "rice") {
    risks.push({
      factor: "Water Scarcity",
      impact: "High",
      mitigation: "Implement water-efficient irrigation systems",
    });
  }

  risks.push({
    factor: "Market Price Fluctuation",
    impact: "Medium",
    mitigation: "Contract farming, storage facilities",
  });

  return risks;
}

function generateRecommendations(crop, region, soilType, experience) {
  const recommendations = [];

  recommendations.push("Implement crop rotation to maintain soil health");
  recommendations.push(
    "Use organic fertilizers and bio-pesticides where possible"
  );

  if (experience === "beginner") {
    recommendations.push("Start with smaller area to gain experience");
    recommendations.push("Consult local agricultural extension officers");
  }

  if (soilType === "sandy") {
    recommendations.push("Add organic matter to improve soil structure");
  }

  return recommendations;
}

// API Routes

// Get available crops
router.get("/crops", (req, res) => {
  try {
    const crops = Object.keys(cropDatabase).map((crop) => ({
      id: crop,
      name: cropDatabase[crop].name,
      varieties: cropDatabase[crop].varieties,
    }));

    res.json({
      success: true,
      data: crops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching crops",
      error: error.message,
    });
  }
});

// Get crop details
router.get("/crops/:cropId", (req, res) => {
  try {
    const cropId = req.params.cropId.toLowerCase();
    const cropData = cropDatabase[cropId];

    if (!cropData) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    res.json({
      success: true,
      data: cropData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching crop details",
      error: error.message,
    });
  }
});

// Generate AI crop plan
router.post("/generate-plan", auth, (req, res) => {
  try {
    const { crop, region, soilType, farmSize, budget, experience } = req.body;

    if (!crop || !region || !soilType || !farmSize) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const cropPlan = generateCropPlan(
      crop,
      region,
      soilType,
      farmSize,
      budget,
      experience
    );

    if (!cropPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid crop selection",
      });
    }

    res.json({
      success: true,
      data: cropPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating crop plan",
      error: error.message,
    });
  }
});

// Get weather data for region
router.get("/weather/:region", (req, res) => {
  try {
    const region = req.params.region;
    const weather = weatherData[region];

    if (!weather) {
      return res.status(404).json({
        success: false,
        message: "Weather data not available for this region",
      });
    }

    res.json({
      success: true,
      data: weather,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching weather data",
      error: error.message,
    });
  }
});

// Get sowing time prediction
router.post("/predict-sowing", auth, (req, res) => {
  try {
    const { crop, region, soilType } = req.body;
    const currentMonth = new Date().getMonth() + 1;

    const prediction = predictOptimalSowingTime(
      crop,
      region,
      soilType,
      currentMonth
    );

    if (!prediction) {
      return res.status(400).json({
        success: false,
        message: "Invalid crop selection",
      });
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error predicting sowing time",
      error: error.message,
    });
  }
});

module.exports = router;
