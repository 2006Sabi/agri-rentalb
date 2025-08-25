const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    console.log("Auth middleware - Request headers:", {
      authorization: req.header("Authorization") ? "Bearer [HIDDEN]" : "None",
      "content-type": req.header("Content-Type"),
      "user-agent": req.header("User-Agent"),
    });

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("Auth middleware - No token provided");
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    console.log("Auth middleware - Token exists, verifying...");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    console.log("Auth middleware - Token decoded, finding user...");
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("Auth middleware - User not found");
      return res.status(401).json({ message: "Token is not valid" });
    }

    if (!user.isActive) {
      console.log("Auth middleware - User account deactivated");
      return res.status(401).json({ message: "Account is deactivated" });
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    console.log(
      "Auth middleware - Authentication successful for user:",
      user.email
    );
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
