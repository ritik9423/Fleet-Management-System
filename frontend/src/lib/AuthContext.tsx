import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";
import type { Role } from "@/types";

export interface AuthUser {
  username: string;
  role: Role;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickSetDemoUser: (role: Role) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      if (savedUser && savedToken && savedToken.startsWith("ey")) {
        return JSON.parse(savedUser);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem("token");
    if (saved && saved.startsWith("ey")) return saved;
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Periodic keepalive: pings backend health every 6 minutes so Render server & DB pool stay warm
  useEffect(() => {
    const keepAlive = setInterval(() => {
      api.get("/health").catch(() => {});
    }, 6 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      const data = res.data;
      const loggedUser: AuthUser = {
        username: data.username,
        role: data.role as Role,
      };
      setToken(data.token);
      setUser(loggedUser);
      return { success: true };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login failed. Please verify credentials.";
      return { success: false, error: msg };
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }) => {
    try {
      const res = await api.post("/auth/register", data);
      const resData = res.data;
      const registeredUser: AuthUser = {
        username: resData.username,
        role: resData.role as Role,
        email: data.email,
      };
      setToken(resData.token);
      setUser(registeredUser);
      return { success: true };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please check your inputs.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const quickSetDemoUser = async (role: Role) => {
    let username = "admin";
    let email = "admin@fleetops.com";
    if (role === "DISPATCHER") {
      username = "dispatcher";
      email = "dispatcher@fleetops.com";
    } else if (role === "DRIVER") {
      username = "rajesh.sharma";
      email = "rajesh@fleetops.com";
    }

    try {
      const res = await api.post("/auth/login", { username, password: "password" });
      if (res.data?.token) {
        setToken(res.data.token);
        setUser({ username, role, email });
        return;
      }
    } catch {
      // Fallback
    }

    setUser({ username, role, email });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        quickSetDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
