// Simple ML Model for Crop Prediction
// This is a demonstration of how more advanced ML models could be integrated
// In a production environment, you would use actual ML libraries like TensorFlow.js, scikit-learn, or cloud ML services

class CropPredictionModel {
  constructor() {
    // Initialize model parameters
    this.weights = {
      temperature: 0.3,
      rainfall: 0.25,
      humidity: 0.2,
      soil: 0.15,
      season: 0.1,
    };

    // Historical yield data (simplified)
    this.historicalData = {
      rice: {
        "Tamil Nadu": { avgYield: 4.2, successRate: 0.85 },
        Punjab: { avgYield: 3.8, successRate: 0.78 },
        Maharashtra: { avgYield: 4.0, successRate: 0.82 },
      },
      wheat: {
        Punjab: { avgYield: 28, successRate: 0.9 },
        "Uttar Pradesh": { avgYield: 26, successRate: 0.88 },
        "Madhya Pradesh": { avgYield: 24, successRate: 0.85 },
      },
      maize: {
        Karnataka: { avgYield: 30, successRate: 0.8 },
        Maharashtra: { avgYield: 28, successRate: 0.78 },
        "Tamil Nadu": { avgYield: 26, successRate: 0.75 },
      },
    };
  }

  // Predict optimal sowing time using a simple regression model
  predictSowingTime(crop, region, soilType, currentMonth) {
    const cropData = this.getCropData(crop);
    if (!cropData) return null;

    // Calculate climate suitability scores
    const climateScores = this.calculateClimateScores(crop, region);

    // Calculate soil compatibility
    const soilScore = this.calculateSoilScore(crop, soilType);

    // Calculate seasonal timing score
    const timingScore = this.calculateTimingScore(crop, currentMonth);

    // Weighted combination for final prediction
    const finalScore =
      climateScores.temperature * this.weights.temperature +
      climateScores.rainfall * this.weights.rainfall +
      climateScores.humidity * this.weights.humidity +
      soilScore * this.weights.soil +
      timingScore * this.weights.season;

    // Determine optimal sowing window
    const sowingWindow = this.determineSowingWindow(crop, region, finalScore);

    return {
      optimalSowingDate: sowingWindow.optimal,
      suitabilityScore: finalScore,
      season: sowingWindow.season,
      confidence: this.calculateConfidence(finalScore),
      climateAnalysis: climateScores,
      recommendations: this.generateRecommendations(crop, region, finalScore),
    };
  }

  // Calculate climate suitability scores
  calculateClimateScores(crop, region) {
    const regionWeather = this.getWeatherData(region);
    const cropRequirements = this.getCropRequirements(crop);

    const tempScore = this.calculateTemperatureScore(
      cropRequirements.temperature,
      regionWeather.temperature
    );

    const rainfallScore = this.calculateRainfallScore(
      cropRequirements.rainfall,
      regionWeather.rainfall
    );

    const humidityScore = this.calculateHumidityScore(
      cropRequirements.humidity,
      regionWeather.humidity
    );

    return {
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
    };
  }

  // Calculate temperature suitability score
  calculateTemperatureScore(cropTemp, regionTemp) {
    const tempDiff = Math.abs(cropTemp.optimal - regionTemp.annual);
    const score = Math.max(0, 1 - tempDiff / 10);

    // Apply seasonal adjustments
    const seasonalAdjustment = this.getSeasonalAdjustment(regionTemp);
    return Math.min(1, score * seasonalAdjustment);
  }

  // Calculate rainfall suitability score
  calculateRainfallScore(cropRainfall, regionRainfall) {
    const rainfallDiff = Math.abs(cropRainfall.optimal - regionRainfall.annual);
    const score = Math.max(0, 1 - rainfallDiff / 500);

    // Consider rainfall distribution
    const distributionScore =
      this.calculateRainfallDistribution(regionRainfall);
    return (score + distributionScore) / 2;
  }

  // Calculate humidity suitability score
  calculateHumidityScore(cropHumidity, regionHumidity) {
    const humidityDiff = Math.abs(cropHumidity.optimal - regionHumidity.annual);
    return Math.max(0, 1 - humidityDiff / 20);
  }

  // Calculate soil compatibility score
  calculateSoilScore(crop, soilType) {
    const compatibleSoils = this.getCompatibleSoils(crop);
    return compatibleSoils.includes(soilType) ? 1 : 0.5;
  }

  // Calculate timing score based on current month
  calculateTimingScore(crop, currentMonth) {
    const sowingWindows = this.getSowingWindows(crop);
    let bestScore = 0;

    Object.entries(sowingWindows).forEach(([season, window]) => {
      const seasonMonth = this.getSeasonMonth(season);
      const monthDiff = Math.abs(seasonMonth - currentMonth);
      const score = Math.max(0, 1 - monthDiff / 6);
      bestScore = Math.max(bestScore, score);
    });

    return bestScore;
  }

  // Determine optimal sowing window
  determineSowingWindow(crop, region, score) {
    const sowingWindows = this.getSowingWindows(crop);
    const currentMonth = new Date().getMonth() + 1;

    let optimalWindow = null;
    let bestScore = 0;

    Object.entries(sowingWindows).forEach(([season, window]) => {
      const seasonMonth = this.getSeasonMonth(season);
      if (seasonMonth > currentMonth) {
        const windowScore = score * this.getSeasonalMultiplier(season, region);
        if (windowScore > bestScore) {
          bestScore = windowScore;
          optimalWindow = { season, window };
        }
      }
    });

    return (
      optimalWindow || {
        season: "unknown",
        window: { optimal: "Not available" },
      }
    );
  }

  // Calculate prediction confidence
  calculateConfidence(score) {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  }

  // Generate recommendations based on prediction
  generateRecommendations(crop, region, score) {
    const recommendations = [];

    if (score < 0.7) {
      recommendations.push(
        "Consider alternative crops better suited to your region"
      );
      recommendations.push("Implement climate adaptation strategies");
    }

    if (score >= 0.8) {
      recommendations.push(
        "Optimal conditions detected - proceed with recommended timeline"
      );
      recommendations.push(
        "Consider precision agriculture techniques for maximum yield"
      );
    }

    // Add region-specific recommendations
    const regionRecommendations = this.getRegionSpecificRecommendations(region);
    recommendations.push(...regionRecommendations);

    return recommendations;
  }

  // Get crop data
  getCropData(crop) {
    const cropDatabase = {
      rice: {
        name: "Rice",
        temperature: { min: 20, max: 35, optimal: 25 },
        rainfall: { min: 1000, max: 2000, optimal: 1500 },
        humidity: { min: 60, max: 90, optimal: 75 },
        soil: ["clay", "loamy", "silt"],
      },
      wheat: {
        name: "Wheat",
        temperature: { min: 15, max: 25, optimal: 20 },
        rainfall: { min: 400, max: 800, optimal: 600 },
        humidity: { min: 40, max: 70, optimal: 55 },
        soil: ["loamy", "clay", "silt"],
      },
      maize: {
        name: "Maize",
        temperature: { min: 18, max: 32, optimal: 25 },
        rainfall: { min: 500, max: 1200, optimal: 800 },
        humidity: { min: 50, max: 80, optimal: 65 },
        soil: ["loamy", "sandy", "clay"],
      },
    };

    return cropDatabase[crop.toLowerCase()];
  }

  // Get weather data for region
  getWeatherData(region) {
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
    };

    return weatherData[region] || weatherData["Tamil Nadu"];
  }

  // Get crop requirements
  getCropRequirements(crop) {
    const cropData = this.getCropData(crop);
    return {
      temperature: cropData.temperature,
      rainfall: cropData.rainfall,
      humidity: cropData.humidity,
    };
  }

  // Get compatible soils for crop
  getCompatibleSoils(crop) {
    const cropData = this.getCropData(crop);
    return cropData ? cropData.soil : [];
  }

  // Get sowing windows for crop
  getSowingWindows(crop) {
    const windows = {
      rice: {
        kharif: { start: "June", end: "July", optimal: "June 15" },
        rabi: { start: "November", end: "December", optimal: "November 15" },
      },
      wheat: {
        rabi: { start: "November", end: "December", optimal: "November 15" },
      },
      maize: {
        kharif: { start: "June", end: "July", optimal: "June 1" },
        rabi: { start: "January", end: "February", optimal: "January 15" },
        zaid: { start: "March", end: "April", optimal: "March 15" },
      },
    };

    return windows[crop.toLowerCase()] || {};
  }

  // Get season month
  getSeasonMonth(season) {
    const seasonMonths = {
      kharif: 6, // June
      rabi: 11, // November
      zaid: 3, // March
      spring: 2, // February
      autumn: 9, // September
    };
    return seasonMonths[season] || 1;
  }

  // Get seasonal adjustment factor
  getSeasonalAdjustment(regionTemp) {
    // Simple seasonal adjustment based on temperature variation
    const tempVariation = Math.abs(regionTemp.kharif - regionTemp.rabi) / 10;
    return Math.max(0.8, 1 - tempVariation);
  }

  // Calculate rainfall distribution score
  calculateRainfallDistribution(regionRainfall) {
    // Consider how well distributed rainfall is across seasons
    const totalRainfall =
      regionRainfall.kharif + regionRainfall.rabi + regionRainfall.zaid;
    const kharifRatio = regionRainfall.kharif / totalRainfall;

    // Prefer more balanced rainfall distribution
    return 1 - Math.abs(kharifRatio - 0.6);
  }

  // Get seasonal multiplier
  getSeasonalMultiplier(season, region) {
    // Adjust score based on historical success in the region
    const historicalData = this.historicalData;
    const crop = this.getCropForSeason(season);

    if (historicalData[crop] && historicalData[crop][region]) {
      return historicalData[crop][region].successRate;
    }

    return 0.8; // Default multiplier
  }

  // Get crop for season
  getCropForSeason(season) {
    const seasonCrops = {
      kharif: "rice",
      rabi: "wheat",
      zaid: "maize",
    };
    return seasonCrops[season] || "rice";
  }

  // Get region-specific recommendations
  getRegionSpecificRecommendations(region) {
    const recommendations = {
      "Tamil Nadu": [
        "Consider water management strategies for summer months",
        "Monitor for pest outbreaks during monsoon season",
      ],
      Punjab: [
        "Implement water conservation techniques",
        "Consider crop rotation to maintain soil health",
      ],
      Maharashtra: [
        "Plan for variable rainfall patterns",
        "Consider drought-resistant crop varieties",
      ],
    };

    return recommendations[region] || [];
  }

  // Train model with new data (simplified)
  trainModel(newData) {
    // In a real implementation, this would update model weights
    // based on new training data
    console.log("Model training with new data:", newData);

    // Update historical data
    if (newData.crop && newData.region && newData.yield) {
      if (!this.historicalData[newData.crop]) {
        this.historicalData[newData.crop] = {};
      }

      if (!this.historicalData[newData.crop][newData.region]) {
        this.historicalData[newData.crop][newData.region] = {
          avgYield: newData.yield,
          successRate: newData.success ? 1 : 0,
        };
      } else {
        // Update existing data (simplified averaging)
        const existing = this.historicalData[newData.crop][newData.region];
        existing.avgYield = (existing.avgYield + newData.yield) / 2;
        existing.successRate =
          (existing.successRate + (newData.success ? 1 : 0)) / 2;
      }
    }
  }

  // Get model performance metrics
  getModelMetrics() {
    return {
      accuracy: 0.85, // Simulated accuracy
      precision: 0.82,
      recall: 0.88,
      f1Score: 0.85,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Export the model
module.exports = CropPredictionModel;
