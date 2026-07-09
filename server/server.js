const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const prRoutes = require("./routes/prRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error.message);
  });

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PullPilot AI backend is running",
  });
});

app.use("/api/pr", prRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PullPilot AI server running on port ${PORT}`);
});