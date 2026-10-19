import React, { useMemo, useState, useEffect } from "react";
import { useUserMetrics } from "../contexts/UserMetricsContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Coins,
  BrainCircuit,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

// Mapping of 38 indices to general CP topics
const TOPICS = [
  "implementation", "math", "greedy", "dp", "data structures",
  "brute force", "constructive algorithms", "graphs", "sortings",
  "binary search", "dfs and similar", "trees", "strings",
  "number theory", "combinatorics", "geometry", "bitmasks",
  "two pointers", "dsu", "shortest paths", "probabilities",
  "divide and conquer", "hashing", "games", "flows", "interactive",
  "matrices", "string suffix structures", "fft", "graph matchings",
  "ternary search", "expression parsing", "meet-in-the-middle",
  "2-sat", "chinese remainder theorem", "schedules",
  "*special", "Unknown"
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { metrics, loading, syncProfile } = useUserMetrics();
  const [isSyncing, setIsSyncing] = useState(false);

  // Keyboard shortcut: Alt + S or Ctrl + S for Sync (Shneiderman Rule 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === "s" || e.key === "S")) || (e.altKey && (e.key === "s" || e.key === "S"))) {
        e.preventDefault();
        if (!isSyncing && (user?.baseTokens ?? 0) >= 10) {
          handleSync();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSyncing, user?.baseTokens]);

  const handleSync = async () => {
    if ((user?.baseTokens ?? 0) < 10) {
      toast.warn("Insufficient tokens. Profile synchronization requires 10 tokens.");
      return;
    }

    setIsSyncing(true);
    try {
      await syncProfile();
      toast.success("Codeforces profile synchronized successfully (-10 tokens)");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to sync profile");
    } finally {
      setIsSyncing(false);
    }
  };

  // Top 8 topics for clean radar chart (Miller's law <= 7-8 chunks)
  const radarData = useMemo(() => {
    if (!metrics?.topicEloVector) return [];
    const fullData = metrics.topicEloVector.map((rating, index) => ({
      topic: TOPICS[index] || `Topic ${index}`,
      rating: Math.round(rating),
    }));
    return fullData.sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [metrics?.topicEloVector]);

  // Weakest topics (Top Growth Opportunities for ZPD recommendations)
  const growthTopics = useMemo(() => {
    if (!metrics?.topicEloVector) return [];
    const fullData = metrics.topicEloVector.map((rating, index) => ({
      topic: TOPICS[index] || `Topic ${index}`,
      rating: Math.round(rating),
    }));
    return fullData
      .filter((t) => t.topic !== "Unknown" && t.topic !== "*special")
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 3);
  }, [metrics?.topicEloVector]);

  const solvedCount = useMemo(() => {
    if (!metrics?.recentSubmissions) return 0;
    return metrics.recentSubmissions.filter((s) => s.correctSubmissions > 0).length;
  }, [metrics?.recentSubmissions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw size={32} className="animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading competitive profile...</p>
      </div>
    );
  }

  const hasSyncTokens = (user?.baseTokens ?? 0) >= 10;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Sync Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Codeforces: {user?.codeforcesHandle || "Unlinked"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Performance Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time PvE Elo ratings mapped across 38 competitive programming topics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing || !hasSyncTokens}
            aria-label="Sync Codeforces profile"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${
              hasSyncTokens
                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] cursor-pointer"
                : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70"
            }`}
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Profile (10 Tokens)"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Chunking into 4 distinct concepts - STM optimization) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Token Balance */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Available Tokens</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">{user?.baseTokens ?? 0}</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">Auto-refreshed weekly</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Coins size={24} />
          </div>
        </div>

        {/* Problems Attempted */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Unique Attempts</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {metrics?.recentSubmissions?.length || 0}
            </span>
            <span className="text-[11px] text-emerald-500 font-medium block mt-0.5">
              {solvedCount} Solved Correctly
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Active Recommendations */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Active Recs</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {metrics?.activeRecommendations?.length || 0}
            </span>
            <Link to="/recommendations" className="text-[11px] text-primary hover:underline font-medium block mt-0.5">
              View Problem Set &rarr;
            </Link>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <BrainCircuit size={24} />
          </div>
        </div>

        {/* Top Strength */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Top Strength</span>
            <span className="text-lg font-bold tracking-tight text-foreground capitalize truncate block max-w-[120px]">
              {radarData[0]?.topic || "Uncalibrated"}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Elo ~ {radarData[0]?.rating || 1200}
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart (2 cols on lg) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[440px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold tracking-tight">38D PvE Topic Elo Radar</h2>
              <p className="text-xs text-muted-foreground">Top 8 calibrated problem tags</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
              Base: 1200
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="topic"
                    tick={{ fill: "var(--color-foreground)", fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[1000, "dataMax + 150"]}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--color-foreground)",
                    }}
                  />
                  <Radar
                    name="Elo Rating"
                    dataKey="rating"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No topic data calibrated yet. Sync your profile to begin!
              </div>
            )}
          </div>
        </div>

        {/* ZPD Target Weaknesses (1 col on lg) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[440px]">
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Growth Focus</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">ZPD Aspirational Targets</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Topics with lowest Elo where the engine mutates by +100 to pull targeted peer problems.
            </p>

            <div className="mt-5 space-y-3">
              {growthTopics.map((item, idx) => (
                <div
                  key={item.topic}
                  className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold capitalize text-foreground">{item.topic}</p>
                      <p className="text-[11px] text-muted-foreground">Current Elo: {item.rating}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    +100 ZPD
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              to="/recommendations"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:opacity-90 transition-all shadow-sm"
            >
              <span>Practice Recommendations</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions Table with Dual-Coding for Accessibility (Slide 102 & 21) */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Recent Problem Attempts</h2>
            <p className="text-xs text-muted-foreground">Historical Codeforces submissions informing the PvE engine</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
            Showing latest 10 attempts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold text-xs border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Problem ID</th>
                <th className="px-6 py-3.5">Difficulty</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-center">Outcome</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics?.recentSubmissions?.slice(0, 10).map((sub) => {
                const [contestId, index] = sub.problemId.split("-");
                const cfUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
                const isSolved = sub.correctSubmissions > 0;

                return (
                  <tr key={sub.problemId} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{sub.problemId}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {sub.rating ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted border border-border">
                          {sub.rating}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unrated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {sub.solvedAt ? new Date(sub.solvedAt).toLocaleDateString() : "Historical"}
                    </td>
                    <td className="px-6 py-4">
                      {/* Dual-Coding for Accessibility: Icon + Clear Textual Label */}
                      <div className="flex items-center justify-center gap-1.5">
                        {isSolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={14} />
                            Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                            <XCircle size={14} />
                            Attempted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={cfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!metrics?.recentSubmissions || metrics.recentSubmissions.length === 0) && (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No recent submissions found. Click "Sync Profile" to pull your latest Codeforces history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
