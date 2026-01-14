import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type PatientProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
};

type PatientAuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  patient: PatientProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const PatientAuthContext = createContext<PatientAuthContextType | null>(null);

export const PatientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, email, phone, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setPatient(data);
    } else {
      // Patient might exist by email but not linked to user_id yet
      const { data: patientByEmail } = await supabase
        .from("patients")
        .select("id, name, email, phone, status")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (patientByEmail) {
        // Link the patient to the user
        await supabase
          .from("patients")
          .update({ user_id: userId })
          .eq("id", patientByEmail.id);
        setPatient(patientByEmail);
      } else {
        setPatient(null);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer profile fetch to avoid blocking
        setTimeout(() => {
          fetchPatientProfile(session.user.id, session.user.email || "");
        }, 0);
      } else {
        setPatient(null);
      }
      
      setIsLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPatientProfile(session.user.id, session.user.email || "");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if user has patient role
    const { data: roles } = await supabase.rpc("get_user_roles", { _user_id: data.user.id });
    const hasPatientRole = roles?.includes("patient");

    if (!hasPatientRole) {
      // Check if patient record exists
      const { data: patientRecord } = await supabase
        .from("patients")
        .select("id")
        .or(`user_id.eq.${data.user.id},email.eq.${email.toLowerCase()}`)
        .maybeSingle();

      if (!patientRecord) {
        await supabase.auth.signOut();
        return { success: false, error: "Você não possui um perfil de paciente cadastrado. Entre em contato com seu psicólogo." };
      }
    }

    return { success: true };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPatient(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/portal`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  return (
    <PatientAuthContext.Provider
      value={{
        isAuthenticated: !!user && !!patient,
        isLoading,
        user,
        patient,
        login,
        signup,
        logout,
        resetPassword,
      }}
    >
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
  const { isAuthenticated, isLoading } = usePatientAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
