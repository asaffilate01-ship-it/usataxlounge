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

export type OrganizerItem = {
  id: string;
  engagement_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  item_type: string;
  required: boolean;
  status: string;
  due_date: string | null;
  remind_at: string | null;
  last_reminded_at: string | null;
  reminder_count: number;
  document_id: string | null;
  assigned_by: string | null;
  completed_at: string | null;
  client_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientInvoice = {
  id: string;
  engagement_id: string | null;
  user_id: string;
  firm_id: string | null;
  invoice_number: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
  invoice_document_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_method: string | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientTaxPayment = {
  id: string;
  engagement_id: string;
  user_id: string;
  authority_type: string;
  authority_name: string;
  payment_type: string;
  tax_period: string;
  amount_cents: number;
  due_date: string;
  status: string;
  payment_method: string | null;
  voucher_document_id: string | null;
  provider_reference: string | null;
  confirmation_number: string | null;
  tracking_number: string | null;
  paid_at: string | null;
  client_marked_paid_at: string | null;
  professional_cleared_at: string | null;
  professional_cleared_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdAccess = {
  id: string;
  entity_id: string;
  owner_user_id: string;
  delegate_user_id: string | null;
  invited_email: string;
  relationship: string;
  access_level: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaxFirm = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientFirmConnection = {
  id: string;
  entity_id: string;
  owner_user_id: string;
  firm_id: string;
  status: string;
  connected_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: string;
  user_id: string;
  engagement_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  title: string;
  detail: string | null;
  resource_type: string | null;
  resource_id: string | null;
  action_url: string | null;
  undo_until: string | null;
  undone_at: string | null;
  metadata: Json;
  created_at: string;
};

export type DeviceSession = {
  id: string;
  user_id: string;
  device_key: string;
  device_label: string;
  platform: string | null;
  browser: string | null;
  last_seen_at: string;
  ip_hash: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type InstitutionDocumentRequest = {
  id: string;
  engagement_id: string;
  user_id: string;
  institution_name: string;
  form_type: string;
  provider_connection_id: string | null;
  status: string;
  expected_by: string | null;
  retrieved_document_id: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentAnnotation = {
  id: string;
  document_id: string;
  user_id: string;
  page_number: number | null;
  annotation_type: string;
  content: string;
  position: Json;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

type TaxCendaDatabase = {
  public: {
    Tables: {
      tax_entities: Table<
        TaxEntity,
        Omit<
          TaxEntity,
          | "id"
          | "created_at"
          | "updated_at"
          | "tin_last4"
          | "base_currency"
          | "status"
        > &
          Partial<
            Pick<
              TaxEntity,
              | "id"
              | "created_at"
              | "updated_at"
              | "tin_last4"
              | "base_currency"
              | "status"
            >
          >
      >;
      tax_engagements: Table<
        TaxEngagement,
        Pick<TaxEngagement, "entity_id" | "user_id" | "tax_year"> &
          Partial<Omit<TaxEngagement, "entity_id" | "user_id" | "tax_year">>
      >;
      clarification_questions: Table<ClarificationQuestion>;
      fixed_assets: Table<
        FixedAsset,
        Pick<
          FixedAsset,
          | "engagement_id"
          | "entity_id"
          | "user_id"
          | "description"
          | "placed_in_service_date"
          | "cost"
        > &
          Partial<
            Omit<
              FixedAsset,
              | "engagement_id"
              | "entity_id"
              | "user_id"
              | "description"
              | "placed_in_service_date"
              | "cost"
            >
          >
      >;
      duplicate_candidates: Table<DuplicateCandidate>;
      documents: Table<
        IntakeDocument,
        Pick<IntakeDocument, "user_id" | "title"> &
          Partial<Omit<IntakeDocument, "user_id" | "title">>
      >;
      income_expenses: Table<
        FinancialEntry,
        Pick<FinancialEntry, "user_id" | "type" | "category" | "amount"> &
          Partial<
            Omit<FinancialEntry, "user_id" | "type" | "category" | "amount">
          >
      >;
      organizer_items: Table<
        OrganizerItem,
        Pick<OrganizerItem, "engagement_id" | "user_id" | "title"> &
          Partial<Omit<OrganizerItem, "engagement_id" | "user_id" | "title">>
      >;
      invoices: Table<
        ClientInvoice,
        Pick<
          ClientInvoice,
          "user_id" | "invoice_number" | "description" | "amount_cents"
        > &
          Partial<
            Omit<
              ClientInvoice,
              "user_id" | "invoice_number" | "description" | "amount_cents"
            >
          >
      >;
      tax_payments: Table<
        ClientTaxPayment,
        Pick<
          ClientTaxPayment,
          | "engagement_id"
          | "user_id"
          | "authority_type"
          | "authority_name"
          | "payment_type"
          | "tax_period"
          | "amount_cents"
          | "due_date"
        > &
          Partial<
            Omit<
              ClientTaxPayment,
              | "engagement_id"
              | "user_id"
              | "authority_type"
              | "authority_name"
              | "payment_type"
              | "tax_period"
              | "amount_cents"
              | "due_date"
            >
          >
      >;
      household_access: Table<
        HouseholdAccess,
        Pick<HouseholdAccess, "entity_id" | "owner_user_id" | "invited_email"> &
          Partial<
            Omit<
              HouseholdAccess,
              "entity_id" | "owner_user_id" | "invited_email"
            >
          >
      >;
      tax_firms: Table<
        TaxFirm,
        Pick<TaxFirm, "name"> & Partial<Omit<TaxFirm, "name">>
      >;
      client_firm_connections: Table<
        ClientFirmConnection,
        Pick<ClientFirmConnection, "entity_id" | "owner_user_id" | "firm_id"> &
          Partial<
            Omit<
              ClientFirmConnection,
              "entity_id" | "owner_user_id" | "firm_id"
            >
          >
      >;
      activity_events: Table<ActivityEvent>;
      device_sessions: Table<
        DeviceSession,
        Pick<DeviceSession, "user_id" | "device_key" | "device_label"> &
          Partial<
            Omit<DeviceSession, "user_id" | "device_key" | "device_label">
          >
      >;
      institution_document_requests: Table<
        InstitutionDocumentRequest,
        Pick<
          InstitutionDocumentRequest,
          "engagement_id" | "user_id" | "institution_name" | "form_type"
        > &
          Partial<
            Omit<
              InstitutionDocumentRequest,
              "engagement_id" | "user_id" | "institution_name" | "form_type"
            >
          >
      >;
      document_annotations: Table<
        DocumentAnnotation,
        Pick<DocumentAnnotation, "document_id" | "user_id" | "content"> &
          Partial<
            Omit<DocumentAnnotation, "document_id" | "user_id" | "content">
          >
      >;
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
        Args: {
          p_question_id: string;
          p_answer: string;
          p_evidence_document_id?: string | null;
        };
        Returns: undefined;
      };
      resolve_duplicate_candidate: {
        Args: {
          p_candidate_id: string;
          p_resolution: string;
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      advance_tax_engagement: {
        Args: {
          p_engagement_id: string;
          p_target_status: string;
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      accept_household_invite: {
        Args: { p_invite_id: string };
        Returns: undefined;
      };
      complete_organizer_item: {
        Args: {
          p_item_id: string;
          p_document_id?: string | null;
          p_note?: string | null;
        };
        Returns: undefined;
      };
      mark_tax_payment_paid: {
        Args: { p_payment_id: string; p_confirmation?: string | null };
        Returns: undefined;
      };
      revoke_device_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
      revoke_firm_connection: {
        Args: { p_connection_id: string };
        Returns: undefined;
      };
      register_device_session: {
        Args: {
          p_device_key: string;
          p_device_label: string;
          p_platform?: string | null;
          p_browser?: string | null;
        };
        Returns: Array<{ session_id: string; is_revoked: boolean }>;
      };
      record_client_activity: {
        Args: {
          p_user_id: string;
          p_engagement_id: string | null;
          p_event_type: string;
          p_title: string;
          p_detail?: string | null;
          p_resource_type?: string | null;
          p_resource_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const taxcenda = supabase as unknown as SupabaseClient<TaxCendaDatabase>;

export const filingTaxYear = (today = new Date()) => today.getUTCFullYear() - 1;
