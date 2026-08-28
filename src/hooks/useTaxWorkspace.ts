import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ClarificationQuestion,
  DuplicateCandidate,
  filingTaxYear,
  FixedAsset,
  IntakeDocument,
  taxcenda,
  TaxEngagement,
  TaxEntity,
} from "@/integrations/supabase/taxcenda";
import { getErrorMessage } from "@/lib/errors";

export type WorkspaceSnapshot = {
  entity: TaxEntity | null;
  engagement: TaxEngagement | null;
  questions: ClarificationQuestion[];
  duplicates: DuplicateCandidate[];
  assets: FixedAsset[];
  documents: IntakeDocument[];
};
const EMPTY_WORKSPACE: WorkspaceSnapshot = {
  entity: null,
  engagement: null,
  questions: [],
  duplicates: [],
  assets: [],
  documents: [],
};

export const useTaxWorkspace = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(EMPTY_WORKSPACE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!user) {
      setWorkspace(EMPTY_WORKSPACE);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: entities, error: entityError } = await taxcenda
      .from("tax_entities")
      .select("*")
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1);

    if (entityError) {
      toast({ title: "Unable to load tax workspace", description: entityError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const entity = entities?.[0] ?? null;
    if (!entity) {
      setWorkspace(EMPTY_WORKSPACE);
      setLoading(false);
      return;
    }

    const { data: engagements, error: engagementError } = await taxcenda
      .from("tax_engagements")
      .select("*")
      .eq("entity_id", entity.id)
      .order("tax_year", { ascending: false })
      .limit(1);

    if (engagementError) {
      toast({ title: "Unable to load tax year", description: engagementError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const engagement = engagements?.[0] ?? null;
    if (!engagement) {
      setWorkspace({ ...EMPTY_WORKSPACE, entity });
      setLoading(false);
      return;
    }

    const [questionsResult, duplicatesResult, assetsResult, documentsResult] = await Promise.all([
      taxcenda.from("clarification_questions").select("*").eq("engagement_id", engagement.id).order("created_at", { ascending: false }),
      taxcenda.from("duplicate_candidates").select("*").eq("engagement_id", engagement.id).order("created_at", { ascending: false }),
      taxcenda.from("fixed_assets").select("*").eq("engagement_id", engagement.id).order("placed_in_service_date", { ascending: false }),
      taxcenda.from("documents").select("*").eq("engagement_id", engagement.id).order("created_at", { ascending: false }),
    ]);

    const firstError = questionsResult.error || duplicatesResult.error || assetsResult.error || documentsResult.error;
    if (firstError) {
      toast({ title: "Some workspace items could not be loaded", description: firstError.message, variant: "destructive" });
    }

    setWorkspace({
      entity,
      engagement,
      questions: questionsResult.data ?? [],
      duplicates: duplicatesResult.data ?? [],
      assets: assetsResult.data ?? [],
      documents: documentsResult.data ?? [],
    });
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const initializeWorkspace = async (input?: {
    legalName?: string;
    entityType?: string;
    accountingMethod?: string;
    taxHomeState?: string;
    taxYear?: number;
  }) => {
    if (!user) return false;
    setSaving(true);

    try {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let entity = workspace.entity;
      if (!entity) {
        const { data, error } = await taxcenda
          .from("tax_entities")
          .insert({
            owner_user_id: user.id,
            client_id: client?.id ?? null,
            legal_name: input?.legalName?.trim() || profile?.full_name || "Individual taxpayer",
            entity_type: input?.entityType || "individual",
            accounting_method: input?.accountingMethod || "cash",
            tax_home_state: input?.taxHomeState?.trim().toUpperCase() || null,
          })
          .select("*")
          .single();
        if (error) throw error;
        entity = data;
      }

      const taxYear = input?.taxYear ?? filingTaxYear();
      const { data: existing } = await taxcenda
        .from("tax_engagements")
        .select("*")
        .eq("entity_id", entity.id)
        .eq("tax_year", taxYear)
        .maybeSingle();

      if (!existing) {
        const { error } = await taxcenda.from("tax_engagements").insert({
          entity_id: entity.id,
          user_id: user.id,
          tax_year: taxYear,
          scope: ["federal_income_tax"],
          workflow_status: "collecting",
          progress: 10,
          current_step: "Upload and confirm source records",
        });
        if (error) throw error;
      }

      toast({ title: `Tax year ${taxYear} workspace is ready` });
      await fetchWorkspace();
      return true;
    } catch (error) {
      toast({ title: "Unable to create tax workspace", description: getErrorMessage(error), variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    setSaving(true);
    const { error } = await taxcenda.rpc("answer_clarification_question", {
      p_question_id: questionId,
      p_answer: answer,
      p_evidence_document_id: null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Answer was not saved", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Answer sent for review" });
    await fetchWorkspace();
    return true;
  };

  const resolveDuplicate = async (candidateId: string, resolution: "confirmed_duplicate" | "keep_both") => {
    setSaving(true);
    const { error } = await taxcenda.rpc("resolve_duplicate_candidate", {
      p_candidate_id: candidateId,
      p_resolution: resolution,
      p_reason: resolution === "keep_both" ? "Client confirmed these are separate transactions" : "Client confirmed duplicate evidence",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Duplicate decision was not saved", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: resolution === "keep_both" ? "Both documents retained" : "Duplicate confirmed" });
    await fetchWorkspace();
    return true;
  };

  const addAsset = async (input: {
    description: string;
    assetClass: string;
    placedInServiceDate: string;
    cost: number;
    businessUsePercentage: number;
  }) => {
    if (!user || !workspace.entity || !workspace.engagement) return false;
    setSaving(true);
    const { error } = await taxcenda.from("fixed_assets").insert({
      engagement_id: workspace.engagement.id,
      entity_id: workspace.entity.id,
      user_id: user.id,
      description: input.description.trim(),
      asset_class: input.assetClass,
      placed_in_service_date: input.placedInServiceDate,
      cost: input.cost,
      business_use_percentage: input.businessUsePercentage,
      status: "needs_review",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Asset was not saved", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Asset added", description: "TaxCenda will ask for any facts needed to calculate depreciation." });
    await fetchWorkspace();
    return true;
  };

  return {
    ...workspace,
    loading,
    saving,
    initializeWorkspace,
    answerQuestion,
    resolveDuplicate,
    addAsset,
    refetch: fetchWorkspace,
  };
};
