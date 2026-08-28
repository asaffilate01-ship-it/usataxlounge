import { useState, useEffect, useCallback } from "react";
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

export const useFilings = (userId?: string) => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const fetchFilings = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from("filings")
      .select("*")
      .order("created_at", { ascending: false });

    // If admin viewing specific user, filter by that user
    if (isStaffRole(userRole) && userId) {
      query = query.eq("user_id", userId);
    } else if (userRole === "client" && user) {
      // Clients only see their own
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;
    if (data) setFilings(data as Filing[]);
    setLoading(false);
  }, [user, userRole, userId]);

  useEffect(() => {
    fetchFilings();
  }, [fetchFilings]);

  const addFiling = async (filing: { tax_year: number; form_type: string; status?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("filings").insert({
      user_id: user.id,
      tax_year: filing.tax_year,
      form_type: filing.form_type,
      status: filing.status || "draft",
    });
    if (!error) fetchFilings();
    return error;
  };

  const updateFiling = async (id: string, updates: Partial<Filing>) => {
    const { error } = await supabase.from("filings").update(updates).eq("id", id);
    if (!error) fetchFilings();
    return error;
  };

  return { filings, loading, addFiling, updateFiling, refetch: fetchFilings };
};
