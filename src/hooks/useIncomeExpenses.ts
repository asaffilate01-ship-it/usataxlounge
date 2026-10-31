import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { taxcenda } from "@/integrations/supabase/taxcenda";
import { canEditEngagementEntries, validateFinancialEntry } from "@/lib/financialEntry";

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
  transactionDate: string;
  engagementId: string;
  vendorName?: string;
  businessUsePercentage: number;
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
    if (!user) { setItems([]); setLoading(false); return; }
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
    const validationError = validateFinancialEntry(item);
    if (validationError) {
      toast({ title: "Check your financial record", description: validationError, variant: "destructive" });
      return false;
    }
    if (!item.engagementId) {
      toast({ title: "Start your tax workspace first", description: "Choose a tax-year engagement before adding financial records.", variant: "destructive" });
      return false;
    }

    // Re-read the exact selected engagement; never silently attach a record to
    // the latest or a different taxpayer's entity or a completed filing year.
    const { data: engagement, error: engagementError } = await taxcenda
      .from("tax_engagements")
      .select("id, entity_id, tax_year, workflow_status")
      .eq("id", item.engagementId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (engagementError || !engagement || !canEditEngagementEntries(engagement.workflow_status)) {
      toast({
        title: "This tax year cannot accept new entries",
        description: engagementError?.message ?? "Open your tax workspace and use an engagement that is collecting records or answering client questions.",
        variant: "destructive",
      });
      return false;
    }

    const { data: inserted, error } = await taxcenda.from("income_expenses").insert({
      user_id: user.id,
      type: item.type,
      category: item.category.trim(),
      description: item.description?.trim() || null,
      amount: item.amount,
      tax_year: engagement.tax_year,
      entity_id: engagement.entity_id,
      engagement_id: engagement.id,
      source_document_id: item.sourceDocumentId ?? null,
      document_url: item.documentUrl ?? null,
      transaction_date: item.transactionDate,
      entry_kind: item.entryKind || (item.type === "income" ? "gross_income" : "operating_expense"),
      vendor_name: item.vendorName?.trim() || null,
      business_use_percentage: item.businessUsePercentage,
      // The client confirms the *source facts*. Only staff should approve the
      // accounting/tax treatment; a user-uploaded entry is not staff-reviewed.
      review_status: "unreviewed",
      created_source: item.createdSource || "manual",
    }).select("*").single();

    if (error) {
      toast({ title: "Error adding entry", description: error.message, variant: "destructive" });
      return false;
    }
    if (item.entryKind === "capital_asset" && inserted) {
      const { error: assetError } = await taxcenda.from("fixed_assets").insert({
        engagement_id: engagement.id,
        entity_id: engagement.entity_id,
        user_id: user.id,
        source_document_id: item.sourceDocumentId ?? null,
        source_entry_id: inserted.id,
        description: item.description?.trim() || item.vendorName?.trim() || item.category.trim(),
        asset_class: item.category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "other",
        placed_in_service_date: item.transactionDate,
        cost: item.amount,
        business_use_percentage: item.businessUsePercentage,
        status: "needs_review",
      });
      if (assetError) {
        toast({ title: "Entry saved; asset needs attention", description: assetError.message, variant: "destructive" });
      }
    }
    toast({ title: "Entry saved for professional review" });
    await fetchItems();
    return true;
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    const { error } = await taxcenda.from("income_expenses").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error deleting entry", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entry deleted" });
      fetchItems();
    }
  };

  return { items, loading, addItem, deleteItem, refetch: fetchItems };
};
