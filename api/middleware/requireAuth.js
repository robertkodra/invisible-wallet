const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const requireAuth = async (req, res, next) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Valid Bearer token required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(_id).select("_id");

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = requireAuth;
