import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isStaffRole, useAuth } from "@/contexts/AuthContext";

export interface Filing {
  id: string;
  engagement_id: string | null;
  user_id: string;
  tax_year: number;
  form_type: string;
  status: string | null;
  file_url: string | null;
  irs_confirmation: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Filing status is read-only in the browser. Transmission/acceptance must be
 * written by an audited server-side provider adapter, never by a client hook.
 */
export const useFilings = (userId?: string) => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const { user, userRole } = useAuth();

  const fetchFilings = useCallback(async () => {
    const seq = ++requestSeq.current;
    if (!user || !userRole) {
      setFilings([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      let query = supabase
        .from("filings")
        .select("*")
        .order("created_at", { ascending: false });
      if (isStaffRole(userRole) && userId) {
        query = query.eq("user_id", userId);
      } else if (!isStaffRole(userRole)) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (seq !== requestSeq.current) return;
      if (error) {
        setFilings([]);
        setLoadError(error.message);
      } else {
        setFilings((data ?? []) as Filing[]);
      }
    } catch (error) {
      if (seq !== requestSeq.current) return;
      setFilings([]);
      setLoadError(error instanceof Error ? error.message : "Unable to load filing records.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [user, userRole, userId]);

  useEffect(() => {
    const sequence = requestSeq;
    void fetchFilings();
    return () => { sequence.current++; };
  }, [fetchFilings]);

  return { filings, loading, loadError, refetch: fetchFilings };
};
