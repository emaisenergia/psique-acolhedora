import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type PatientAuthContextType = {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const PatientAuthContext = createContext<PatientAuthContextType | null>(null);

const STORAGE_KEY = "patient-auth";

export const PatientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEmail(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (e: string, p: string) => {
    // Demo credentials (as in UI card)
    const demoEmail = "maria.santos@email.com";
    const demoPass = "MinhaSenh@123";
    const ok = (e === demoEmail && p === demoPass) || (e.length > 3 && p.length >= 6);
    if (ok) {
      localStorage.setItem(STORAGE_KEY, e);
      setEmail(e);
      setIsAuthenticated(true);
    }
    return ok;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEmail(null);
    setIsAuthenticated(false);
  };

  return (
    <PatientAuthContext.Provider value={{ isAuthenticated, email, login, logout }}>
      {children}
    </PatientAuthContext.Provider>
  );
};

export const usePatientAuth = () => {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error("usePatientAuth must be used within PatientAuthProvider");
  return ctx;
};

export const PatientProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = usePatientAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/portal" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
};

