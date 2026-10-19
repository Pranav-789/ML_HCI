import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Lock, LogIn, X, Loader2 } from "lucide-react";

export const SessionExpiredModal: React.FC = () => {
  const { sessionExpired, setSessionExpired, login, user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sessionExpired) return null;

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      setSessionExpired(false);
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        <button
          onClick={() => setSessionExpired(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-primary">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Session Paused</h2>
            <p className="text-xs text-muted-foreground">Your session has expired for your account safety</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          To protect your Codeforces analytics and token balance, your session was safely locked. Please confirm your credentials to continue right where you left off.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleReLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Securing Session...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Continue Session
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
