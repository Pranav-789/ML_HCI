import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUserMetrics } from "../contexts/UserMetricsContext";
import { api } from "../services/api";
import { toast } from "react-toastify";
import { BrainCircuit, Loader2, ExternalLink } from "lucide-react";

export const Recommendations: React.FC = () => {
  const { user, updateUserTokens } = useAuth();
  const { metrics, refreshMetrics } = useUserMetrics();
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if ((user?.baseTokens ?? 0) < 5) {
      toast.error("Insufficient tokens. You need 5 tokens to generate a recommendation.");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await api.post("/recommendations/generate");
      if (res.data.success) {
        if (res.data.data?.remainingTokens !== undefined) {
          updateUserTokens(res.data.data.remainingTokens);
        } else {
          updateUserTokens(Math.max(0, (user?.baseTokens ?? 0) - 5));
        }
        await refreshMetrics();
        toast.success("Recommendations generated successfully!");
      } else {
        toast.error("Failed to generate recommendations");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error generating recommendations");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center mb-6 text-primary">
          <BrainCircuit size={64} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">AI Problem Engine</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Spend 5 tokens to spin up our machine learning pipeline. It analyzes your unique 38D Topic Elo vector and recent submission history to curate the perfect progressive problem set.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="relative group overflow-hidden rounded-full p-[2px] transition-all disabled:opacity-50"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3 px-8 py-4 bg-card border border-border rounded-full text-lg font-semibold hover:bg-muted transition-colors">
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin text-primary" />
                Generating recommendations...
              </>
            ) : (
              <>
                <BrainCircuit size={24} className="text-primary" />
                Generate Recommendations (5 Tokens)
              </>
            )}
          </div>
        </button>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Progressive Set</h2>
        
        {metrics?.activeRecommendations && metrics.activeRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.activeRecommendations.map((rec, idx) => (
              <div
                key={rec.problemId}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => window.open(`https://codeforces.com/problemset/problem/${rec.problemId.split("-")[0]}/${rec.problemId.split("-")[1]}`, "_blank")}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={20} className="text-primary" />
                </div>
                <div className="text-4xl font-bold text-muted/20 absolute -bottom-2 -right-2">
                  #{idx + 1}
                </div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    {rec.targetTopic}
                  </span>
                  <h3 className="text-xl font-bold mb-2">Problem {rec.problemId}</h3>
                  <p className="text-sm text-muted-foreground">
                    Recommended on {new Date(rec.recommendedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-lg">
              You have no active recommendations. Generate a set to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
