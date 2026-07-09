# PullPilot AI

PullPilot AI is an AI-powered GitHub Pull Request review agent where users can paste a public GitHub Pull Request URL and get instant AI-generated code review including quality score, risk level, issues, file-wise review, recommendations, missing test cases, and positive points.

It also provides MongoDB-based review history, PDF report download, and GitHub PR comment automation so that AI-generated reviews can be posted directly on GitHub pull requests.

## Features

* AI-powered pull request review using Google Gemini API
* Analyze public GitHub Pull Request URLs
* Fetch changed files and code diffs using GitHub REST API
* File-wise code review for modified pull request files
* PR quality score generation
* Risk level classification: Low, Medium, High
* AI-generated issue detection with severity levels
* Bug, code smell, maintainability, and performance issue detection
* AI-generated improvement recommendations
* Missing test case suggestions
* Positive points of the pull request
* MongoDB-based review history
* Recent review history table
* Download AI-generated PR review as PDF report
* Post AI-generated review directly as a GitHub PR comment
* Clean developer-tool inspired responsive UI
* Separate FastAPI AI service for PR review generation

## Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Axios
* Lucide React
* React Hot Toast
* jsPDF

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* GitHub REST API
* dotenv
* CORS

### AI Service

* FastAPI
* Python
* Uvicorn
* Google Gemini API
* python-dotenv
* google-genai

### Deployment

* Frontend: Vercel
* Backend: Render
* AI Service: Render
* Database: MongoDB Atlas

## Live Demo

Frontend: https://pull-pilot-ai-jvq3.vercel.app/  
Backend: https://pullpilot-backend.onrender.com  
AI Service: https://pullpilot-ai-service.onrender.com

## Project Structure

```txt
PullPilot-AI/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── models/
│   │   └── Review.js
│   ├── routes/
│   │   └── prRoutes.js
│   ├── utils/
│   │   └── parsePrUrl.js
│   ├── server.js
│   └── package.json
│
├── ai-service/
│   ├── main.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/dhruvggaur-26/PullPilot-AI.git
cd PullPilot-AI
```

## Backend Setup

```bash
cd server
npm install
npm run dev
```

The backend will run on:

```txt
http://localhost:5000
```

Create a `.env` file inside the `server` folder:

```env
PORT=5000
GITHUB_TOKEN=your_github_personal_access_token_here
AI_SERVICE_URL=http://localhost:8000
MONGO_URI=your_mongodb_connection_string_here
```

For production, use the deployed AI service URL:

```env
AI_SERVICE_URL=https://pullpilot-ai-service.onrender.com
```

## AI Service Setup

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The AI service will run on:

```txt
http://localhost:8000
```

Create a `.env` file inside the `ai-service` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.5-flash
```

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will run on:

```txt
http://localhost:5173
```

Create a `.env` file inside the `client` folder if needed:

```env
VITE_API_BASE_URL=http://localhost:5000
```

For production, use the deployed backend URL:

```env
VITE_API_BASE_URL=https://pullpilot-backend.onrender.com
```

## GitHub Token Permissions
Note: The selected repository should be the same repository where you want PullPilot AI to post PR review comments.
To post AI-generated review comments directly on GitHub PRs, create a fine-grained GitHub Personal Access Token with the following permissions:

```txt
Repository access: Only selected repositories

Selected repository:
PullPilot-AI

Repository permissions:
Issues          → Read and write
Pull requests   → Read and write
Metadata        → Read-only
Contents        → Read-only
```

Do not push your GitHub token to GitHub. Keep it only inside the local `.env` file.

## Usage

1. Open the frontend in the browser.
2. Paste a public GitHub Pull Request URL.
3. Click on the **Analyze PR** button.
4. PullPilot AI will fetch changed files using GitHub API.
5. The AI service will generate:
   * PR quality score
   * Risk level
   * Overall summary
   * Issues found
   * File-wise review
   * Recommendations
   * Missing test cases
   * Positive points
6. View saved reviews in the Recent Reviews section.
7. Download the AI review as a PDF report.
8. Click **Post to GitHub PR** to post the AI review directly as a GitHub PR comment.

## Sample Pull Request URL

```txt
https://github.com/dhruvggaur-26/PullPilot-AI/pull/1
```

## Sample AI Output

```txt
Overall Score: 85/100

Risk Level: Low

Summary:
This pull request introduces useful functionality with clean structure and minimal risk. The implementation is easy to understand and follows a practical developer workflow.

Issues Found:
1. Missing edge case handling in API response
2. Large frontend component can be split into smaller reusable components

Recommendations:
- Add more error handling for failed API requests
- Split dashboard sections into separate React components
- Add tests for GitHub API response handling

Tests To Add:
- Test invalid GitHub PR URL
- Test missing GitHub token while posting comment
- Test successful AI review generation

Positive Points:
- Clean API flow
- Useful developer automation feature
- Practical integration with GitHub PR workflow
```

## API Endpoints

### Check Backend Status

```txt
GET /
```

### Fetch PR Files

```txt
POST /api/pr/files
```

Request body:

```json
{
  "prUrl": "https://github.com/owner/repo/pull/1"
}
```

### Analyze Pull Request

```txt
POST /api/pr/analyze
```

Request body:

```json
{
  "prUrl": "https://github.com/owner/repo/pull/1"
}
```

### Fetch Review History

```txt
GET /api/pr/history
```

### Fetch Single Review

```txt
GET /api/pr/history/:id
```

### Post Review Comment to GitHub PR

```txt
POST /api/pr/comment
```

Request body:

```json
{
  "prUrl": "https://github.com/owner/repo/pull/1",
  "review": {
    "overallScore": 90,
    "riskLevel": "Low",
    "summary": "AI-generated review summary",
    "issues": [],
    "recommendations": [],
    "testsToAdd": [],
    "positivePoints": []
  }
}
```

## Environment Variables

Do not push `.env` files to GitHub.

### Server

```env
PORT=5000
GITHUB_TOKEN=your_github_personal_access_token_here
AI_SERVICE_URL=https://pullpilot-ai-service.onrender.com
MONGO_URI=your_mongodb_connection_string_here
```

### AI Service

```env
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.5-flash
```

### Client

```env
VITE_API_BASE_URL=https://pullpilot-backend.onrender.com
```

## Current Limitations

* The platform currently supports GitHub pull request URLs only.
* Private repository support depends on GitHub token permissions.
* Inline line-by-line GitHub review comments are not implemented yet.
* Authentication is not implemented.
* Team-based review workspaces are not implemented.
* Unit testing and CI/CD workflows can be added in future versions.

## Future Improvements

* Add user authentication
* Add GitHub OAuth login
* Add support for private repositories
* Add inline line-level PR review comments
* Add team-based review dashboards
* Add repository-wise analytics
* Add support for GitHub Webhooks
* Add CI/CD integration
* Add Docker support
* Add Slack/Jira integration for review notifications
* Add automated duplicate issue detection
* Add test coverage and GitHub Actions workflow

## Key Highlights

* Built a real developer workflow automation tool
* Uses GitHub REST API to fetch pull request diffs
* Uses Gemini API for structured AI-powered code review
* Stores review history in MongoDB
* Exports AI reviews as PDF reports
* Posts AI-generated review comments directly on GitHub PRs
* Uses a separate FastAPI AI microservice with Node.js backend

## Author

Dhruv Gaur

GitHub: [dhruvggaur-26](https://github.com/dhruvggaur-26)
