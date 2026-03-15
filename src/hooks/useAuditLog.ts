import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = useCallback(
    async (action: string, resourceType: string, resourceId?: string, details?: Record<string, unknown>) => {
      if (!user) return;
      await supabase.from("audit_logs" as any).insert({
        admin_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details: details || {},
      } as any);
    },
    [user]
  );

  return { logAction };
};
