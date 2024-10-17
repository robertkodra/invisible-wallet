require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const userRoutes = require("./routes/user");
const walletRoutes = require("./routes/wallet");
const profileRoutes = require("./routes/profile");

// app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/api/user", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res, next) => {
  const error = new Error("Not Found.");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: { message: error.message } });
});

module.exports = app;
