import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

interface User {
  _id: string;
  email: string;
  codeforcesHandle: string;
  baseTokens: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUserTokens: (tokens: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me");
      if (res.data.success) {
        setUser(res.data.data.profile);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    fetchProfile();

    const handleSessionExpired = () => {
      setSessionExpired(true);
      setUser(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (data: any) => {
    try {
      const res = await api.post("/auth/login", data);
      if (res.data.success) {
        if (res.data.data.accessToken) {
          localStorage.setItem("accessToken", res.data.data.accessToken);
        }
        if (res.data.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.data.refreshToken);
        }
        setSessionExpired(false);
        await fetchProfile();
        toast.success("Welcome back! Logged in successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.data.success) {
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setSessionExpired(false);
      toast.info("Logged out safely");
    }
  };

  const updateUserTokens = (tokens: number) => {
    if (user) {
      setUser({ ...user, baseTokens: tokens });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        sessionExpired,
        setSessionExpired,
        login,
        register,
        logout,
        updateUserTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
