import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface IncomeExpenseItem {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string | null;
  amount: number;
  tax_year: number | null;
  document_url: string | null;
  created_at: string;
}

export const useIncomeExpenses = () => {
  const [items, setItems] = useState<IncomeExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("income_expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } else {
      setItems(data as IncomeExpenseItem[]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: { type: "income" | "expense"; category: string; description?: string; amount: number }) => {
    if (!user) return;
    const { error } = await supabase.from("income_expenses").insert({
      user_id: user.id,
      type: item.type,
      category: item.category,
      description: item.description || null,
      amount: item.amount,
    });

    if (error) {
      toast({ title: "Error adding entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entry added successfully" });
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("income_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entry deleted" });
      fetchItems();
    }
  };

  return { items, loading, addItem, deleteItem, refetch: fetchItems };
};
