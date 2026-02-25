require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

const publicRoutes = require("./routes/public.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// CORS configuration - allow frontend origin (set CLIENT_ORIGIN in env to override)
const CLIENT_ORIGIN = "https://test-client-ten-xi.vercel.app";
const corsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
console.log("Mongo URI:", process.env.MONGO_URI_MONGODB_URI);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI_MONGODB_URI) {
  console.error("Missing MONGO_URI_MONGODB_URI in environment. Please set it in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongo URI:", process.env.MONGO_URI_MONGODB_URI);
    console.log("MongoDB Atlas Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/static", express.static(path.join(__dirname, "static")));

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

module.exports=app;



