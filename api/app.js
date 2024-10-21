require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

const app = express();
const userRoutes = require("./routes/user");
const walletRoutes = require("./routes/wallet");
const profileRoutes = require("./routes/profile");

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// General rate limiter to all routes
app.use(apiLimiter);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);

// 404 Error Handler
app.use((req, res, next) => {
  const error = new Error("Not Found.");
  error.status = 404;
  next(error);
});

// Global Error Handler
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    error: {
      message: error.message,
      status: error.status,
      stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
    },
  });
});

module.exports = app;
