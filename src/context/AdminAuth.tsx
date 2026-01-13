import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { storage, type AdminUser, seedDefaultUsers, type Role } from "@/lib/storage";

type AuthContextType = {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  updateUser: (updates: Partial<AdminUser>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getAuth());

  useEffect(() => {
    // Seed a default admin if none exists
    seedDefaultUsers();
    const token = storage.getAuth();
    if (token) {
      // token stores user id for demo
      const users = storage.getUsers();
      const found = users.find((u) => u.id === token);
      if (found) {
        setUser(found);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    const users = storage.getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    const ok = !!found;
    if (ok && found) {
      storage.setAuth(found.id);
      setUser(found);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    return ok;
  };

  const logout = () => {
    storage.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    if (roles.length === 0) return true;
    return roles.some((r) => user.roles.includes(r));
  };

  const updateUser = (updates: Partial<AdminUser>) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return prev;
      const next: AdminUser = { ...prev, ...updates };
      const users = storage.getUsers().map((u) => (u.id === prev.id ? next : u));
      storage.saveUsers(users);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};

export const ProtectedRoute = ({ children, roles = [] as Role[] }: { children: ReactNode; roles?: Role[] }) => {
  const { isAuthenticated, hasRole } = useAdminAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  if (roles.length && !hasRole(...roles)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};
