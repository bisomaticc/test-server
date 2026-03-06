require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const publicRoutes = require("./routes/public.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// ✅ CORS
const CLIENT_ORIGIN = "https://www.sareesanskriti.com";
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "static")));

// ✅ DB middleware (lazy connection)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ✅ Routes
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;

