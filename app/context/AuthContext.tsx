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
    const storedUser = localStorage.getItem("optimus_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.removeItem("optimus_user");
      }
    }
    setIsLoading(false);
  }, []);

  // 2. Login Function
  const login = (data: any) => {
    // API-യിൽ നിന്ന് വരുന്ന ഡാറ്റയിൽ നിന്ന് 'user' ഒബ്ജക്റ്റ് എടുക്കുന്നു
    const userToSave = data.user || data; 
    
    setUser(userToSave);
    // യൂസറെ LocalStorage-ൽ സേവ് ചെയ്യുന്നു
    localStorage.setItem("optimus_user", JSON.stringify(userToSave));
  };

  // 3. Logout Function
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("optimus_user");
    
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