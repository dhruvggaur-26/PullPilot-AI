const parsePrUrl = (prUrl) => {
  try {
    const url = new URL(prUrl);

    if (!url.hostname.includes("github.com")) {
      throw new Error("Invalid GitHub URL");
    }

    const parts = url.pathname.split("/").filter(Boolean);

    // Example:
    // https://github.com/owner/repo/pull/123
    // parts = ["owner", "repo", "pull", "123"]

    const owner = parts[0];
    const repo = parts[1];
    const pullKeyword = parts[2];
    const pullNumber = parts[3];

    if (!owner || !repo || pullKeyword !== "pull" || !pullNumber) {
      throw new Error("Invalid Pull Request URL format");
    }

    return {
      owner,
      repo,
      pullNumber,
    };
  } catch (error) {
    throw new Error("Please provide a valid GitHub Pull Request URL");
  }
};

module.exports = parsePrUrl;