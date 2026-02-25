import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MFAEnroll from "@/components/auth/MFAEnroll";
import MFAChallenge from "@/components/auth/MFAChallenge";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, userRole, mfaStatus, refreshMFAStatus, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // MFA bypassed for dev — re-enable for production
  // if (mfaStatus === "not_enrolled") {
  //   return <MFAEnroll onEnrolled={() => refreshMFAStatus()} onCancelled={() => signOut()} />;
  // }
  // if (mfaStatus === "enrolled") {
  //   return <MFAChallenge onVerified={() => refreshMFAStatus()} onSignOut={() => signOut()} />;
  // }
  // if (mfaStatus === "loading") {
  //   return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  // }

  // Admin can access client routes too
  if (requiredRole === "admin" && userRole !== "admin") {
    return <Navigate to="/client" replace />;
  }

  if (requiredRole === "client" && userRole !== "client" && userRole !== "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
