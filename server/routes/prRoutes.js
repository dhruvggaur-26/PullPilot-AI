const express = require("express");
const axios = require("axios");
const parsePrUrl = require("../utils/parsePrUrl");
const Review = require("../models/Review");

const router = express.Router();

const fetchPrFiles = async (prUrl) => {
  const { owner, repo, pullNumber } = parsePrUrl(prUrl);

  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;

  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await axios.get(githubApiUrl, { headers });

  const files = response.data.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch || "",
  }));

  return {
    repo: `${owner}/${repo}`,
    pullNumber,
    totalFiles: files.length,
    files,
  };
};

router.post("/files", async (req, res) => {
  try {
    const { prUrl } = req.body;

    if (!prUrl) {
      return res.status(400).json({
        success: false,
        message: "Pull Request URL is required",
      });
    }

    const prData = await fetchPrFiles(prUrl);

    res.json({
      success: true,
      message: "Pull Request files fetched successfully",
      ...prData,
    });
  } catch (error) {
    console.error("PR Fetch Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch pull request files",
      error: error.message,
    });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { prUrl } = req.body;

    if (!prUrl) {
      return res.status(400).json({
        success: false,
        message: "Pull Request URL is required",
      });
    }

    const prData = await fetchPrFiles(prUrl);

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const aiResponse = await axios.post(`${aiServiceUrl}/analyze-pr`, prData);

    const review = aiResponse.data.review;

    const savedReview = await Review.create({
      prUrl,
      repo: prData.repo,
      pullNumber: prData.pullNumber,
      totalFiles: prData.totalFiles,
      overallScore: review.overallScore,
      riskLevel: review.riskLevel,
      summary: review.summary,
      review,
    });

    res.json({
      success: true,
      message: "Pull Request analyzed successfully",
      reviewId: savedReview._id,
      repo: prData.repo,
      pullNumber: prData.pullNumber,
      totalFiles: prData.totalFiles,
      review,
    });
  } catch (error) {
    console.error("PR Analyze Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to analyze pull request",
      error: error.response?.data || error.message,
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("prUrl repo pullNumber totalFiles overallScore riskLevel summary createdAt");

    res.json({
      success: true,
      message: "Review history fetched successfully",
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch review history",
      error: error.message,
    });
  }
});

router.get("/history/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review fetched successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: error.message,
    });
  }
});

module.exports = router;