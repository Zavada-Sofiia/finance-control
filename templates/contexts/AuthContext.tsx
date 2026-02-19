import { createContext, useContext, useEffect, useState } from "react";

type User = {
  username: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- INIT ----------
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // ---------- LOGIN ----------
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify({ username }));

      setToken(data.access_token);
      setUser({ username });

      return true;
    } catch {
      return false;
    }
  };

  // ---------- REGISTER ----------
  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify({ username }));

      setToken(data.access_token);
      setUser({ username });

      return true;
    } catch {
      return false;
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    fetch("/logout");
  };

  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------- HOOK ----------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
