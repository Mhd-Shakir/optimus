"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// User Type Definition
interface User {
  id: string;
  username: string;
  role: string;
  team?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // പേജ് ലോഡ് ആവുമ്പോൾ ചെക്ക് ചെയ്യാൻ
  const router = useRouter();

  // 1. പേജ് റിഫ്രഷ് ചെയ്താലും യൂസർ ലോഗൗട്ട് ആവാതിരിക്കാൻ
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("optimus_user");
      if (savedUser) {
        let parsedUser = JSON.parse(savedUser);
        if (parsedUser.team === "Auris" || parsedUser.team === "Team A") {
            parsedUser.team = "Ignis";
            localStorage.setItem("optimus_user", JSON.stringify(parsedUser));
        } else if (parsedUser.team === "Libras" || parsedUser.team === "Team B") {
            parsedUser.team = "Ventus";
            localStorage.setItem("optimus_user", JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
    setIsLoading(false);
  }, []);

  const login = (data: any) => {
    const userToSave = data.user || data; 
    setUser(userToSave);
    try {
      localStorage.setItem("optimus_user", JSON.stringify(userToSave));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  // 3. Logout Function
  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem("optimus_user");
    } catch (e) {
      console.warn("Could not remove from localStorage", e);
    }
    
    try {
      // Backend-ൽ കുക്കി ക്ലിയർ ചെയ്യാൻ
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    }
    
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}