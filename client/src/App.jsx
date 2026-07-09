import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function App() {
  const [prUrl, setPrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [postingComment, setPostingComment] = useState(false);

  const review = result?.review;

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pr/history`);
      setHistory(response.data.reviews || []);
    } catch (error) {
      console.log("History fetch error:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const analyzePR = async () => {
    if (!prUrl.trim()) {
      toast.error("Please enter a GitHub Pull Request URL");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await axios.post(`${API_URL}/api/pr/analyze`, {
        prUrl,
      });

      setResult(response.data);
      toast.success("Pull Request analyzed successfully");
      fetchHistory();
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.error?.detail ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to analyze PR. Check backend and AI service.";

      toast.error(typeof message === "string" ? message : "Backend error occurred");
    } finally {
      setLoading(false);
    }
  };

  const postGithubComment = async () => {
    if (!result || !review || !prUrl.trim()) {
      toast.error("Analyze a PR first before posting comment");
      return;
    }

    try {
      setPostingComment(true);

      const response = await axios.post(`${API_URL}/api/pr/comment`, {
        prUrl,
        review,
      });

      toast.success("Review posted on GitHub PR");

      if (response.data.commentUrl) {
        window.open(response.data.commentUrl, "_blank");
      }
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        "Failed to post comment. Check GitHub token and repo permissions.";

      toast.error(message);
    } finally {
      setPostingComment(false);
    }
  };

  const downloadReport = () => {
    if (!result || !review) {
      toast.error("No review available to download");
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text("PullPilot AI - Pull Request Review Report", 14, y);

    y += 12;

    doc.setFontSize(11);
    doc.text(`Repository: ${result.repo}`, 14, y);
    y += 7;
    doc.text(`Pull Request: #${result.pullNumber}`, 14, y);
    y += 7;
    doc.text(`Changed Files: ${result.totalFiles}`, 14, y);
    y += 7;
    doc.text(`Quality Score: ${review.overallScore}/100`, 14, y);
    y += 7;
    doc.text(`Risk Level: ${review.riskLevel}`, 14, y);

    y += 12;

    doc.setFontSize(15);
    doc.text("Overall Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(
      review.summary || "No summary available",
      180
    );
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 6 + 8;

    const addSection = (title, items) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(15);
      doc.text(title, 14, y);
      y += 8;

      doc.setFontSize(10);

      if (!items || items.length === 0) {
        doc.text("No data available.", 14, y);
        y += 8;
        return;
      }

      items.forEach((item, index) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const text =
          typeof item === "string"
            ? `${index + 1}. ${item}`
            : `${index + 1}. ${item.title || item.filename || "Item"} - ${
                item.description || item.summary || item.suggestion || ""
              }`;

        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 14, y);
        y += lines.length * 6 + 4;
      });

      y += 5;
    };

    addSection("Issues Found", review.issues);
    addSection("Recommendations", review.recommendations);
    addSection("Tests To Add", review.testsToAdd);
    addSection("Positive Points", review.positivePoints);

    doc.save(`PullPilot-PR-${result.pullNumber}-Report.pdf`);
    toast.success("Report downloaded successfully");
  };

  const getRiskBadge = (risk) => {
    if (risk === "High") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (risk === "Medium") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }

    return "bg-green-50 text-green-700 border-green-200";
  };

  const getScoreStyle = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-gray-900">
      <Toaster position="top-right" />

      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FileCode size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                PullPilot AI
              </h1>
              <p className="text-sm text-gray-500">
                Pull Request Review Agent
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Backend Connected
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 mb-6">
              <Sparkles size={16} className="text-green-600" />
              AI-powered code review for GitHub PRs
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Review pull requests like a senior engineer.
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mb-8">
              Paste a public GitHub Pull Request URL and get a structured review
              with risk level, quality score, file-wise feedback, issues,
              testing suggestions, and improvement recommendations.
            </p>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Pull Request URL
              </label>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/facebook/react/pull/36874"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />

                <button
                  onClick={analyzePR}
                  disabled={loading}
                  className="rounded-xl bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={19} />
                      Reviewing...
                    </>
                  ) : (
                    <>
                      <Search size={19} />
                      Analyze PR
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Example: https://github.com/facebook/react/pull/36874
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">What PullPilot checks</h3>

            <div className="space-y-4">
              <FeatureItem
                icon={<AlertTriangle size={18} />}
                title="Bug and risk detection"
                text="Finds possible runtime errors, weak logic, and risky changes."
              />

              <FeatureItem
                icon={<ShieldCheck size={18} />}
                title="Security review"
                text="Checks for unsafe patterns, exposed logic, and validation issues."
              />

              <FeatureItem
                icon={<FileCode size={18} />}
                title="File-wise analysis"
                text="Reviews every changed file and explains the impact."
              />

              <FeatureItem
                icon={<CheckCircle size={18} />}
                title="Testing suggestions"
                text="Suggests practical test cases for changed functionality."
              />
            </div>
          </div>
        </section>

        {history.length > 0 && (
  <section className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-xl font-bold">Recent Reviews</h3>
        <p className="text-sm text-gray-500">
          Last analyzed pull requests saved in MongoDB
        </p>
      </div>

      <button
        onClick={fetchHistory}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
      >
        Refresh
      </button>
    </div>

    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Repository</th>
            <th className="text-left px-4 py-3 font-semibold">PR</th>
            <th className="text-left px-4 py-3 font-semibold">Score</th>
            <th className="text-left px-4 py-3 font-semibold">Risk</th>
            <th className="text-left px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {history.map((item) => (
            <tr key={item._id}>
              <td className="px-4 py-4">
                <p className="font-semibold text-gray-900">{item.repo}</p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {item.summary}
                </p>
              </td>

              <td className="px-4 py-4">
                <a
                  href={item.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  #{item.pullNumber}
                </a>
              </td>

              <td className="px-4 py-4 font-bold">
                {item.overallScore}/100
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskBadge(
                    item.riskLevel
                  )}`}
                >
                  {item.riskLevel}
                </span>
              </td>

              <td className="px-4 py-4 text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)}

        {result && review && (
          <section className="mt-10 grid lg:grid-cols-[280px_1fr] gap-8">
            <aside className="space-y-4">
              <MetricCard
                label="Repository"
                value={result.repo}
                small={`PR #${result.pullNumber}`}
              />

              <MetricCard
                label="Changed Files"
                value={result.totalFiles}
                small="Files analyzed"
              />

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 mb-2">Quality Score</p>
                <h3
                  className={`text-5xl font-extrabold ${getScoreStyle(
                    review.overallScore
                  )}`}
                >
                  {review.overallScore}
                </h3>
                <p className="text-sm text-gray-500 mt-1">out of 100</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 mb-3">Risk Level</p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getRiskBadge(
                    review.riskLevel
                  )}`}
                >
                  <ShieldCheck size={17} />
                  {review.riskLevel}
                </span>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-3">
  <button
    onClick={downloadReport}
    className="rounded-xl bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-gray-800"
  >
    Download PDF Report
  </button>

  <button
    onClick={postGithubComment}
    disabled={postingComment}
    className="rounded-xl border border-gray-300 bg-white text-gray-900 px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
  >
    {postingComment ? "Posting..." : "Post to GitHub PR"}
  </button>
</div>
              <Panel title="Overall Summary">
                <p className="text-gray-700 leading-relaxed">
                  {review.summary}
                </p>
              </Panel>

              <Panel title="Issues Found" icon={<AlertTriangle size={20} />}>
                {review.issues?.length > 0 ? (
                  <div className="space-y-4">
                    {review.issues.map((issue, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {issue.title}
                          </h4>

                          <span className="w-fit rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-xs font-mono text-gray-500 mb-3">
                          {issue.file}
                        </p>

                        <p className="text-gray-700 mb-3">
                          {issue.description}
                        </p>

                        <div className="rounded-lg bg-white border border-gray-200 p-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            Suggested Fix
                          </p>
                          <p className="text-sm text-gray-700">
                            {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No major issues found in this PR." />
                )}
              </Panel>

              <Panel title="File Reviews" icon={<FileCode size={20} />}>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">
                          File
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          Quality
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {review.fileReviews?.map((file, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4">
                            <p className="font-mono text-xs text-gray-900 mb-1">
                              {file.filename}
                            </p>
                            <p className="text-gray-600">{file.summary}</p>
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {file.status}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                              {file.quality}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="grid md:grid-cols-3 gap-5">
                <ListPanel
                  title="Recommendations"
                  items={review.recommendations}
                />

                <ListPanel title="Tests To Add" items={review.testsToAdd} />

                <ListPanel
                  title="Positive Points"
                  items={review.positivePoints}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function FeatureItem({ icon, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
        {icon}
      </div>

      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{text}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, small }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <h3 className="text-xl font-bold break-words">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{small}</p>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon && <div className="text-gray-700">{icon}</div>}
        <h3 className="text-xl font-bold">{title}</h3>
      </div>

      {children}
    </div>
  );
}

function ListPanel({ title, items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <h3 className="font-bold mb-4">{title}</h3>

      {items?.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="text-sm text-gray-700 leading-relaxed flex gap-2"
            >
              <span className="text-green-600 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="No data available." />
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
      {text}
    </div>
  );
}

export default App;