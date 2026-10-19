import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BrainCircuit, Eye, EyeOff, UserPlus, Loader2, Info } from "lucide-react";

export const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeforcesHandle, setCodeforcesHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ email, password, codeforcesHandle });
      navigate("/login");
    } catch (err) {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 relative overflow-hidden">
        <div className="flex justify-center mb-6 text-primary">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <BrainCircuit size={40} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center tracking-tight text-foreground">Join CodeUp Engine</h2>
        <p className="text-center text-xs text-muted-foreground mt-1 mb-6">
          Connect your Codeforces handle to start receiving personalized problem sets
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Codeforces Handle
              </label>
              <span className="text-[10px] text-muted-foreground">Must be an existing handle</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. tourist, petr"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={codeforcesHandle}
              onChange={(e) => setCodeforcesHandle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground flex items-start gap-2">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <span>
              On registration, you are credited 50 tokens and initialized with a base 1200 rating across all 38 topics.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-xl font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
