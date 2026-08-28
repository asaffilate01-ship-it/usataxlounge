import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";
import type { Json } from "./types";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type TaxEntity = {
  id: string;
  owner_user_id: string;
  client_id: string | null;
  legal_name: string;
  entity_type: string;
  tin_last4: string | null;
  accounting_method: string;
  base_currency: string;
  tax_home_state: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TaxEngagement = {
  id: string;
  entity_id: string;
  user_id: string;
  tax_year: number;
  scope: string[];
  workflow_status: string;
  progress: number;
  current_step: string;
  assigned_preparer: string | null;
  assigned_reviewer: string | null;
  materiality_threshold: number;
  due_date: string | null;
  locked_at: string | null;
  final_package_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type ClarificationQuestion = {
  id: string;
  engagement_id: string;
  user_id: string;
  source_document_id: string | null;
  source_entry_id: string | null;
  topic: string;
  question: string;
  context: string | null;
  impact: string | null;
  priority: string;
  status: string;
  answer: string | null;
  evidence_document_id: string | null;
  asked_by: string | null;
  answered_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FixedAsset = {
  id: string;
  engagement_id: string;
  entity_id: string;
  user_id: string;
  source_document_id: string | null;
  source_entry_id: string | null;
  description: string;
  asset_class: string;
  placed_in_service_date: string;
  cost: number;
  business_use_percentage: number;
  book_method: string;
  book_life_years: number | null;
  tax_method: string | null;
  recovery_period_years: number | null;
  convention: string | null;
  section_179_elected: number;
  bonus_depreciation_elected: boolean;
  prior_depreciation: number;
  current_depreciation: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DuplicateCandidate = {
  id: string;
  engagement_id: string | null;
  user_id: string;
  primary_document_id: string;
  candidate_document_id: string;
  match_type: string;
  score: number;
  reasons: Json;
  status: string;
  resolution_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type IntakeDocument = {
  id: string;
  user_id: string;
  client_id: string | null;
  entity_id: string | null;
  engagement_id: string | null;
  title: string;
  type: string;
  category: string | null;
  file_url: string | null;
  content: string | null;
  metadata: Json | null;
  status: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  content_sha256: string | null;
  document_date: string | null;
  amount: number | null;
  vendor_name: string | null;
  extraction_status: string;
  extraction_confidence: number | null;
  duplicate_status: string;
  superseded_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FinancialEntry = {
  id: string;
  user_id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  tax_year: number | null;
  document_url: string | null;
  entity_id: string | null;
  engagement_id: string | null;
  source_document_id: string | null;
  transaction_date: string | null;
  entry_kind: string;
  vendor_name: string | null;
  currency: string;
  business_use_percentage: number;
  review_status: string;
  review_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_source: string;
  created_at: string;
};

type TaxCendaDatabase = {
  public: {
    Tables: {
      tax_entities: Table<TaxEntity, Omit<TaxEntity, "id" | "created_at" | "updated_at" | "tin_last4" | "base_currency" | "status"> & Partial<Pick<TaxEntity, "id" | "created_at" | "updated_at" | "tin_last4" | "base_currency" | "status">>>;
      tax_engagements: Table<TaxEngagement, Pick<TaxEngagement, "entity_id" | "user_id" | "tax_year"> & Partial<Omit<TaxEngagement, "entity_id" | "user_id" | "tax_year">>>;
      clarification_questions: Table<ClarificationQuestion>;
      fixed_assets: Table<FixedAsset, Pick<FixedAsset, "engagement_id" | "entity_id" | "user_id" | "description" | "placed_in_service_date" | "cost"> & Partial<Omit<FixedAsset, "engagement_id" | "entity_id" | "user_id" | "description" | "placed_in_service_date" | "cost">>>;
      duplicate_candidates: Table<DuplicateCandidate>;
      documents: Table<IntakeDocument, Pick<IntakeDocument, "user_id" | "title"> & Partial<Omit<IntakeDocument, "user_id" | "title">>>;
      income_expenses: Table<FinancialEntry, Pick<FinancialEntry, "user_id" | "type" | "category" | "amount"> & Partial<Omit<FinancialEntry, "user_id" | "type" | "category" | "amount">>>;
      workflow_events: Table<{
        id: string;
        engagement_id: string;
        actor_user_id: string | null;
        from_status: string | null;
        to_status: string;
        reason: string | null;
        metadata: Json;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      answer_clarification_question: {
        Args: { p_question_id: string; p_answer: string; p_evidence_document_id?: string | null };
        Returns: undefined;
      };
      resolve_duplicate_candidate: {
        Args: { p_candidate_id: string; p_resolution: string; p_reason?: string | null };
        Returns: undefined;
      };
      advance_tax_engagement: {
        Args: { p_engagement_id: string; p_target_status: string; p_reason?: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const taxcenda = supabase as unknown as SupabaseClient<TaxCendaDatabase>;

export const filingTaxYear = (today = new Date()) => today.getUTCFullYear() - 1;
