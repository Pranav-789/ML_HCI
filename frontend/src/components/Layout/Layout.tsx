import React, { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Coins, LogOut, LayoutDashboard, BrainCircuit } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Keyboard navigation shortcuts: Alt+D -> Dashboard, Alt+R -> Recommendations (Shneiderman Rule 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        navigate("/dashboard");
      } else if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        navigate("/recommendations");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      shortcut: "Alt+D",
    },
    {
      name: "Recommendations",
      path: "/recommendations",
      icon: <BrainCircuit size={20} />,
      shortcut: "Alt+R",
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:h-screen overflow-y-auto border-b md:border-b-0 md:border-r border-border p-4 flex flex-col justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 mb-6 text-primary px-2 hover:opacity-85 transition-opacity"
          >
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <BrainCircuit size={24} />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-foreground block leading-none">
                CodeUpEngine
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                Recommendation AI
              </span>
            </div>
          </Link>

          {/* Token Vault Affordance Card */}
          <div className="mb-6 bg-muted/60 p-4 rounded-xl flex items-center justify-between border border-border/80 shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Token Balance</p>
              <p className="font-extrabold text-xl text-foreground mt-0.5">
                {user?.baseTokens ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">5 tokens / rec</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Coins size={24} />
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-150 font-medium text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.shortcut}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-border flex flex-col gap-3 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user?.codeforcesHandle?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground">
                {user?.codeforcesHandle || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-semibold"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
