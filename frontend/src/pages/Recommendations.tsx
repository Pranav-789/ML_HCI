import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserMetrics } from "../contexts/UserMetricsContext";
import { api } from "../services/api";
import { toast } from "react-toastify";
import {
  BrainCircuit,
  Loader2,
  ExternalLink,
  Coins,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Search,
  Zap,
  Layers,
  Code2,
  Cpu,
  BarChart2,
  HelpCircle
} from "lucide-react";

interface PipelineStep {
  title: string;
  description: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    title: "1. Analyzing Submission History",
    description: "Evaluating win/loss results across 75 recent attempts",
  },
  {
    title: "2. Recalibrating 38D PvE Vector",
    description: "Calculating Elo fluctuations for each competitive topic",
  },
  {
    title: "3. Aspirational Vector Mutation",
    description: "Applying +100 ZPD boost to non-mastered topic ratings",
  },
  {
    title: "4. Qdrant Peer KNN Retrieval",
    description: "Discovering 5 nearest peer profiles one step ahead",
  },
  {
    title: "5. Assembling Progressive Set",
    description: "Filtering solved problems & ranking top 10 growth targets",
  },
];

// Helper to get an icon per topic category (Visual Dual-Coding for Color Blindness)
const getTopicIcon = (topic: string) => {
  const t = topic.toLowerCase();
  if (t.includes("dp") || t.includes("divide")) return <Layers size={16} />;
  if (t.includes("graph") || t.includes("tree") || t.includes("dfs")) return <Zap size={16} />;
  if (t.includes("math") || t.includes("number") || t.includes("combinatorics")) return <BarChart2 size={16} />;
  return <Code2 size={16} />;
};

export const Recommendations: React.FC = () => {
  const { user, updateUserTokens } = useAuth();
  const { metrics, refreshMetrics } = useUserMetrics();

  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("codeup_bookmarked_problems");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [lastGeneratedSummary, setLastGeneratedSummary] = useState<{
    count: number;
    timestamp: Date;
    tokensUsed: number;
  } | null>(null);

  // Keyboard shortcut: Ctrl + Enter or Alt + G (Shneiderman Rule 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "Enter") || (e.altKey && (e.key === "g" || e.key === "G"))) {
        e.preventDefault();
        if (!isGenerating && (user?.baseTokens ?? 0) >= 5) {
          handleGenerate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGenerating, user?.baseTokens]);

  const toggleBookmark = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) {
        next.delete(problemId);
        toast.info(`Removed Problem ${problemId} from bookmarks`);
      } else {
        next.add(problemId);
        toast.success(`Bookmarked Problem ${problemId} for practice`);
      }
      try {
        localStorage.setItem("codeup_bookmarked_problems", JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if ((user?.baseTokens ?? 0) < 5) {
      toast.warn("Insufficient tokens. You need 5 tokens to generate recommendations.");
      return;
    }

    setIsGenerating(true);
    setPipelineStep(0);

    // Simulate multi-stage pipeline updates to ease cognitive wait (Slide 82: Computational Bound mitigation)
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const res = await api.post("/recommendations/generate");
      clearInterval(interval);
      setPipelineStep(PIPELINE_STEPS.length - 1);

      if (res.data.success) {
        if (res.data.data?.remainingTokens !== undefined) {
          updateUserTokens(res.data.data.remainingTokens);
        } else {
          updateUserTokens(Math.max(0, (user?.baseTokens ?? 0) - 5));
        }

        await refreshMetrics();
        setLastGeneratedSummary({
          count: res.data.data?.recommendations?.length || 10,
          timestamp: new Date(),
          tokensUsed: 5,
        });

        toast.success("Progressive problem set generated successfully!");
      } else {
        toast.error(res.data?.message || "Failed to generate recommendations");
      }
    } catch (err: any) {
      clearInterval(interval);
      const errMsg = err.response?.data?.message || err.message || "Failed to generate recommendations";
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Distinct topics for STM chunking (Miller's law <= 7 chunks)
  const availableTopics = useMemo(() => {
    if (!metrics?.activeRecommendations) return [];
    const topics = new Set<string>();
    metrics.activeRecommendations.forEach((r) => {
      if (r.targetTopic) topics.add(r.targetTopic);
    });
    return Array.from(topics);
  }, [metrics?.activeRecommendations]);

  // Filter recommendations based on search, topic, and bookmark
  const filteredRecommendations = useMemo(() => {
    if (!metrics?.activeRecommendations) return [];
    return metrics.activeRecommendations.filter((rec) => {
      const matchesTopic = selectedTopic === "all" || rec.targetTopic === selectedTopic;
      const matchesSearch =
        rec.problemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.targetTopic.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [metrics?.activeRecommendations, selectedTopic, searchQuery]);

  const hasTokens = (user?.baseTokens ?? 0) >= 5;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header & Mental Model Anchor */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles size={14} />
              <span>Zone of Proximal Development (ZPD) Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">AI Problem Engine</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
              Curates competitive programming problems based on peer vectors one step ahead of your 38-topic PvE ratings.
            </p>
          </div>

          {/* Token Affordance Card (Fitts' Law & Gulf of Execution) */}
          <div className="bg-muted/60 border border-border rounded-xl p-4 flex md:flex-col items-center justify-between md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Coins className="text-amber-500" size={22} />
              <div className="text-left md:text-right">
                <span className="text-xs text-muted-foreground block font-medium">Your Token Balance</span>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {user?.baseTokens ?? 0}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium bg-background px-2.5 py-1 rounded-md border border-border">
              Cost: 5 Tokens / run
            </span>
          </div>
        </div>

        {/* Primary Action Button with Fitts' Law Optimization */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <HelpCircle size={14} className="text-primary shrink-0" />
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px] text-foreground">
                Ctrl + Enter
              </kbd>{" "}
              or click to generate a tailored 10-problem set.
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !hasTokens}
            aria-label="Generate recommendations"
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-md ${
              hasTokens
                ? "bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.98] shadow-primary/25 cursor-pointer"
                : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin text-primary-foreground" />
                <span>Running Machine Learning Pipeline...</span>
              </>
            ) : !hasTokens ? (
              <>
                <Coins size={20} className="text-amber-500" />
                <span>Need 5 Tokens to Generate</span>
              </>
            ) : (
              <>
                <BrainCircuit size={20} />
                <span>Generate Recommendations (5 Tokens)</span>
              </>
            )}
          </button>
        </div>

        {/* Computational Bound Mitigation: Active Pipeline Progress Display */}
        {isGenerating && (
          <div className="mt-6 p-5 bg-background border border-primary/30 rounded-xl space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-primary flex items-center gap-1.5">
                <Cpu size={16} className="animate-pulse" />
                Pipeline Active: {PIPELINE_STEPS[pipelineStep].title}
              </span>
              <span className="text-muted-foreground">
                Step {pipelineStep + 1} of {PIPELINE_STEPS.length}
              </span>
            </div>

            {/* Visual Filling Bar (Slide 82) */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((pipelineStep + 1) / PIPELINE_STEPS.length) * 100}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {PIPELINE_STEPS[pipelineStep].description}
            </p>
          </div>
        )}
      </div>

      {/* Dialog Closure Banner (Shneiderman Rule 4) */}
      {lastGeneratedSummary && !isGenerating && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Progressive Set Ready ({lastGeneratedSummary.count} Target Problems)
              </p>
              <p className="text-xs text-muted-foreground">
                Generated at {lastGeneratedSummary.timestamp.toLocaleTimeString()} • 5 Tokens Deducted
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastGeneratedSummary(null)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Problem Set Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Progressive Problem Set</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any problem card to open its problem statement on Codeforces
            </p>
          </div>

          {/* STM Chunking: Search & Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problem or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44 md:w-56"
              />
            </div>
          </div>
        </div>

        {/* Topic Filter Chips (Miller's Law - 7 chunks) */}
        {availableTopics.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedTopic("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTopic === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              All Topics ({metrics?.activeRecommendations?.length || 0})
            </button>
            {availableTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  selectedTopic === topic
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {getTopicIcon(topic)}
                <span>{topic}</span>
              </button>
            ))}
          </div>
        )}

        {/* Problems Grid with Dual-Coding for Accessibility */}
        {filteredRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecommendations.map((rec, idx) => {
              const [contestId, index] = rec.problemId.split("-");
              const cfUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
              const isBookmarked = bookmarkedProblems.has(rec.problemId);

              return (
                <div
                  key={rec.problemId}
                  onClick={() => window.open(cfUrl, "_blank", "noopener,noreferrer")}
                  className="group bg-card border border-border rounded-xl p-5 hover:border-primary/60 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Decorative index badge */}
                  <div className="text-3xl font-black text-muted/30 absolute -bottom-1 -right-1 select-none">
                    #{idx + 1}
                  </div>

                  <div>
                    {/* Header: Topic Tag with Dual-Coding Icon + Bookmark */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                        {getTopicIcon(rec.targetTopic)}
                        <span>{rec.targetTopic}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleBookmark(rec.problemId, e)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isBookmarked
                              ? "text-amber-500 hover:bg-amber-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title={isBookmarked ? "Bookmarked for practice" : "Bookmark problem"}
                        >
                          <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>Problem {rec.problemId}</span>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1.5">
                      Targeting weakness in{" "}
                      <span className="font-semibold text-foreground">{rec.targetTopic}</span>
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground relative z-10">
                    <span>
                      {rec.recommendedAt ? new Date(rec.recommendedAt).toLocaleDateString() : "Active"}
                    </span>
                    <span className="text-primary font-medium group-hover:underline flex items-center gap-1">
                      Solve on Codeforces &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : metrics?.activeRecommendations && metrics.activeRecommendations.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              No recommendations match your current filter query "{searchQuery || selectedTopic}".
            </p>
            <button
              onClick={() => {
                setSelectedTopic("all");
                setSearchQuery("");
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BrainCircuit size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-bold">No Active Recommendations</h3>
              <p className="text-muted-foreground text-sm">
                Click "Generate Recommendations" above to run the machine learning vector clustering pipeline and curate your personal problem set.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
