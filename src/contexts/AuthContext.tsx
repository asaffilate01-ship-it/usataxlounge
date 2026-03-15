import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthenticatorAssuranceLevels } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type MFAStatus = "loading" | "enrolled" | "not_enrolled" | "verified";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: "admin" | "client" | null;
  profile: { full_name: string; avatar_url: string | null; phone: string | null } | null;
  mfaStatus: MFAStatus;
  refreshMFAStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  profile: null,
  mfaStatus: "loading",
  refreshMFAStatus: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "client" | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; phone: string | null } | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>("loading");

  const fetchUserData = async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).single(),
    ]);

    if (rolesRes.data && rolesRes.data.length > 0) {
      const roles = rolesRes.data.map((r) => r.role);
      setUserRole(roles.includes("admin") ? "admin" : "client");
    }

    if (profileRes.data) {
      setProfile(profileRes.data);
    }
  };

  const refreshMFAStatus = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      setMfaStatus("not_enrolled");
      return;
    }

    if (data.currentLevel === "aal2") {
      setMfaStatus("verified");
    } else if (data.nextLevel === "aal2") {
      // User has a factor enrolled but hasn't verified this session
      setMfaStatus("enrolled");
    } else {
      setMfaStatus("not_enrolled");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
          setTimeout(() => refreshMFAStatus(), 0);
        } else {
          setUserRole(null);
          setProfile(null);
          setMfaStatus("loading");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        refreshMFAStatus();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
    setMfaStatus("loading");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, profile, mfaStatus, refreshMFAStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
