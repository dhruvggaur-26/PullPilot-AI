import os
import json
import re
from typing import List, Optional, Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai


load_dotenv()

app = FastAPI(title="PullPilot AI Review Service")


class PRFile(BaseModel):
    filename: str
    status: Optional[str] = ""
    additions: Optional[int] = 0
    deletions: Optional[int] = 0
    changes: Optional[int] = 0
    patch: Optional[str] = ""


class AnalyzeRequest(BaseModel):
    repo: str
    pullNumber: str
    totalFiles: int
    files: List[PRFile]


def get_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key == "PASTE_YOUR_GEMINI_API_KEY_HERE":
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is missing. Add your Gemini API key in ai-service/.env",
        )

    return genai.Client(api_key=api_key)


def limit_patch_text(files: List[PRFile], max_chars_per_file: int = 7000) -> str:
    """
    Keeps prompt size controlled.
    Large PR diffs can be very long, so we trim each file patch.
    """

    formatted_files = []

    for file in files:
        patch = file.patch or ""

        if len(patch) > max_chars_per_file:
            patch = patch[:max_chars_per_file] + "\n\n[PATCH TRUNCATED DUE TO LENGTH]"

        formatted_files.append(
            f"""
FILE: {file.filename}
STATUS: {file.status}
ADDITIONS: {file.additions}
DELETIONS: {file.deletions}
CHANGES: {file.changes}

PATCH:
{patch}
"""
        )

    return "\n\n".join(formatted_files)


def extract_json_from_text(text: str) -> Dict[str, Any]:
    """
    Gemini can sometimes return JSON inside markdown code fences.
    This function extracts valid JSON safely.
    """

    cleaned = text.strip()

    cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"^```", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return {
        "overallScore": 50,
        "riskLevel": "Medium",
        "summary": "AI response could not be parsed into valid JSON.",
        "issues": [
            {
                "title": "Invalid AI JSON response",
                "severity": "Medium",
                "file": "N/A",
                "description": cleaned[:500],
                "suggestion": "Try again or reduce PR diff size.",
            }
        ],
        "fileReviews": [],
        "recommendations": [],
        "testsToAdd": [],
    }


def build_review_prompt(data: AnalyzeRequest) -> str:
    files_text = limit_patch_text(data.files)

    return f"""
You are PullPilot AI, a senior software engineer reviewing a GitHub pull request.

Review this PR carefully and return ONLY valid JSON.
Do not include markdown.
Do not include explanation outside JSON.

Repository: {data.repo}
Pull Request Number: {data.pullNumber}
Total Changed Files: {data.totalFiles}

Changed Files and Patches:
{files_text}

Analyze the PR for:
1. Bugs
2. Runtime errors
3. Security risks
4. Code smells
5. Performance issues
6. Missing edge cases
7. Missing tests
8. Maintainability problems
9. Good parts of the PR

Return output in this exact JSON structure:

{{
  "overallScore": 0,
  "riskLevel": "Low | Medium | High",
  "summary": "Short overall review summary",
  "issues": [
    {{
      "title": "Issue title",
      "severity": "Low | Medium | High",
      "file": "filename",
      "description": "What is the problem?",
      "suggestion": "How to fix it?"
    }}
  ],
  "fileReviews": [
    {{
      "filename": "filename",
      "status": "modified/added/deleted",
      "summary": "Short file-level review",
      "quality": "Good | Needs Improvement | Risky"
    }}
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "testsToAdd": [
    "Test case suggestion 1",
    "Test case suggestion 2"
  ],
  "positivePoints": [
    "Good thing 1",
    "Good thing 2"
  ]
}}

Rules:
- overallScore should be between 0 and 100.
- If the PR is mostly safe, score should be above 75.
- If there are serious risks, score should be below 60.
- Keep suggestions practical and developer-friendly.
- Mention exact filenames when possible.
"""


@app.get("/")
def home():
    return {
        "success": True,
        "message": "PullPilot AI service is running",
    }


@app.post("/analyze-pr")
def analyze_pr(data: AnalyzeRequest):
    try:
        client = get_client()
        model_name = os.getenv("MODEL_NAME", "gemini-2.5-flash")

        prompt = build_review_prompt(data)

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )

        ai_text = response.text or ""

        parsed_review = extract_json_from_text(ai_text)

        return {
            "success": True,
            "message": "PR analyzed successfully",
            "repo": data.repo,
            "pullNumber": data.pullNumber,
            "review": parsed_review,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI review failed: {str(error)}",
        )