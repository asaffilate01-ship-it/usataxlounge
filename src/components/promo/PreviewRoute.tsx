import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasPreviewAccess } from "@/lib/previewAccess";

/** Keeps the full site behind the promo access code while in private preview. */
const PreviewRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  if (!hasPreviewAccess()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

export default PreviewRoute;
