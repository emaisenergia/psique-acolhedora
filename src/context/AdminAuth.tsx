import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Include "editor" for backwards compatibility with existing routes
export type Role = "admin" | "psychologist" | "patient" | "editor";

type AdminProfile = {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  credential?: string;
  bio?: string;
  timezone: string;
};

// Extended user type that combines Supabase User with profile data
type ExtendedUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  credential?: string;
  bio?: string;
  timezone: string;
  roles: Role[];
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ExtendedUser | null;
  profile: AdminProfile | null;
  roles: Role[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  updateUser: (updates: Partial<AdminProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as AdminProfile);
      }

      // Fetch roles using RPC function
      const { data: rolesData } = await supabase
        .rpc("get_user_roles", { _user_id: userId });
      
      if (rolesData) {
        // Map database roles to include editor for backwards compatibility
        const mappedRoles = (rolesData as string[]).map(r => {
          if (r === "admin") return "admin" as Role;
          if (r === "psychologist") return "psychologist" as Role;
          if (r === "patient") return "patient" as Role;
          return r as Role;
        });
        setRoles(mappedRoles);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);
      
      if (!mounted) return;
      
      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          if (mounted) {
            await fetchUserData(newSession.user.id);
            setIsLoading(false);
          }
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    });

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (existingSession?.user) {
          setSession(existingSession);
          setSupabaseUser(existingSession.user);
          await fetchUserData(existingSession.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        // Manually set session and user immediately
        setSession(data.session);
        setSupabaseUser(data.user);
        await fetchUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: "Falha ao autenticar" };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (...checkRoles: Role[]) => {
    if (!supabaseUser) return false;
    if (checkRoles.length === 0) return true;
    // Admin has access to everything including editor routes
    if (roles.includes("admin")) return true;
    // Check for editor - admins and psychologists can access editor routes
    if (checkRoles.includes("editor") && (roles.includes("admin") || roles.includes("psychologist"))) {
      return true;
    }
    return checkRoles.some((r) => roles.includes(r));
  };

  const updateUser = async (updates: Partial<AdminProfile>) => {
    if (!supabaseUser) return;
    
    const { error } = await supabase
      .from("admin_profiles")
      .update(updates)
      .eq("user_id", supabaseUser.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  const isAuthenticated = !!session;

  // Construct extended user object that matches the old interface
  const user: ExtendedUser | null = supabaseUser && profile ? {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: profile.name,
    phone: profile.phone,
    credential: profile.credential,
    bio: profile.bio,
    timezone: profile.timezone,
    roles: roles,
  } : supabaseUser ? {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: supabaseUser.email?.split("@")[0] || "Usuário",
    timezone: "America/Sao_Paulo",
    roles: roles,
  } : null;

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      user, 
      profile,
      roles,
      login, 
      logout, 
      hasRole, 
      updateUser 
    }}>
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
  const { isAuthenticated, isLoading, hasRole } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (roles.length && !hasRole(...roles)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
