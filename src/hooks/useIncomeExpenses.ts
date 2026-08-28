import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { taxcenda } from "@/integrations/supabase/taxcenda";

export interface IncomeExpenseItem {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string | null;
  amount: number;
  tax_year: number | null;
  document_url: string | null;
  source_document_id: string | null;
  transaction_date: string | null;
  entry_kind: string;
  vendor_name: string | null;
  business_use_percentage: number;
  review_status: string;
  created_source: string;
  created_at: string;
}

export interface NewFinancialEntry {
  type: "income" | "expense";
  category: string;
  description?: string;
  amount: number;
  entryKind?: string;
  transactionDate?: string;
  vendorName?: string;
  businessUsePercentage?: number;
  sourceDocumentId?: string;
  documentUrl?: string;
  createdSource?: "manual" | "document_ai" | "bank_feed" | "import";
}

export const useIncomeExpenses = () => {
  const [items, setItems] = useState<IncomeExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await taxcenda
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

  const addItem = async (item: NewFinancialEntry) => {
    if (!user) return false;
    const { data: engagements } = await taxcenda
      .from("tax_engagements")
      .select("*")
      .eq("user_id", user.id)
      .order("tax_year", { ascending: false })
      .limit(1);
    const engagement = engagements?.[0] ?? null;

    const { data: inserted, error } = await taxcenda.from("income_expenses").insert({
      user_id: user.id,
      type: item.type,
      category: item.category,
      description: item.description || null,
      amount: item.amount,
      tax_year: engagement?.tax_year ?? new Date().getUTCFullYear() - 1,
      entity_id: engagement?.entity_id ?? null,
      engagement_id: engagement?.id ?? null,
      source_document_id: item.sourceDocumentId ?? null,
      document_url: item.documentUrl ?? null,
      transaction_date: item.transactionDate || new Date().toISOString().slice(0, 10),
      entry_kind: item.entryKind || (item.type === "income" ? "gross_income" : "operating_expense"),
      vendor_name: item.vendorName?.trim() || null,
      business_use_percentage: item.businessUsePercentage ?? 100,
      review_status: "confirmed",
      created_source: item.createdSource || "manual",
    }).select("*").single();

    if (error) {
      toast({ title: "Error adding entry", description: error.message, variant: "destructive" });
      return false;
    } else {
      if (item.entryKind === "capital_asset" && engagement && inserted) {
        const { error: assetError } = await taxcenda.from("fixed_assets").insert({
          engagement_id: engagement.id,
          entity_id: engagement.entity_id,
          user_id: user.id,
          source_document_id: item.sourceDocumentId ?? null,
          source_entry_id: inserted.id,
          description: item.description?.trim() || item.vendorName?.trim() || item.category,
          asset_class: item.category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "other",
          placed_in_service_date: item.transactionDate || new Date().toISOString().slice(0, 10),
          cost: item.amount,
          business_use_percentage: item.businessUsePercentage ?? 100,
          status: "needs_review",
        });
        if (assetError) {
          toast({ title: "Entry saved; asset needs attention", description: assetError.message, variant: "destructive" });
        }
      }
      toast({ title: "Entry added successfully" });
      fetchItems();
      return true;
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await taxcenda.from("income_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entry deleted" });
      fetchItems();
    }
  };

  return { items, loading, addItem, deleteItem, refetch: fetchItems };
};
