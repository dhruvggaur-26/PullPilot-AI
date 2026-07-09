const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    prUrl: {
      type: String,
      required: true,
    },
    repo: {
      type: String,
      required: true,
    },
    pullNumber: {
      type: String,
      required: true,
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      default: "Medium",
    },
    summary: {
      type: String,
      default: "",
    },
    review: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);