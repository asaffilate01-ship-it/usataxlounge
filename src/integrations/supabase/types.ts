export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_usage_events: {
        Row: {
          created_at: string
          id: string
          input_bytes: number
          operation: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_bytes?: number
          operation: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_bytes?: number
          operation?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_subtype: string | null
          account_type: string | null
          active: boolean
          connection_id: string
          created_at: string
          currency: string
          entity_id: string
          id: string
          mask: string | null
          name: string
          official_name: string | null
          provider_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_subtype?: string | null
          account_type?: string | null
          active?: boolean
          connection_id: string
          created_at?: string
          currency?: string
          entity_id: string
          id?: string
          mask?: string | null
          name: string
          official_name?: string | null
          provider_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_subtype?: string | null
          account_type?: string | null
          active?: boolean
          connection_id?: string
          created_at?: string
          currency?: string
          entity_id?: string
          id?: string
          mask?: string | null
          name?: string
          official_name?: string | null
          provider_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          consent_expires_at: string | null
          created_at: string
          entity_id: string
          id: string
          institution_name: string | null
          last_synced_at: string | null
          provider: string
          provider_item_reference: string
          secret_reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_expires_at?: string | null
          created_at?: string
          entity_id: string
          id?: string
          institution_name?: string | null
          last_synced_at?: string | null
          provider: string
          provider_item_reference: string
          secret_reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_expires_at?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          institution_name?: string | null
          last_synced_at?: string | null
          provider?: string
          provider_item_reference?: string
          secret_reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string
          amount: number
          authorized_date: string | null
          created_at: string
          description: string
          direction: string
          engagement_id: string | null
          id: string
          matched_income_expense_id: string | null
          merchant_name: string | null
          normalized_metadata: Json
          pending: boolean
          provider_transaction_id: string
          review_status: string
          suggested_category: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          authorized_date?: string | null
          created_at?: string
          description: string
          direction: string
          engagement_id?: string | null
          id?: string
          matched_income_expense_id?: string | null
          merchant_name?: string | null
          normalized_metadata?: Json
          pending?: boolean
          provider_transaction_id: string
          review_status?: string
          suggested_category?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          authorized_date?: string | null
          created_at?: string
          description?: string
          direction?: string
          engagement_id?: string | null
          id?: string
          matched_income_expense_id?: string | null
          merchant_name?: string | null
          normalized_metadata?: Json
          pending?: boolean
          provider_transaction_id?: string
          review_status?: string
          suggested_category?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_income_expense_id_fkey"
            columns: ["matched_income_expense_id"]
            isOneToOne: false
            referencedRelation: "income_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_accounts: {
        Row: {
          account_type: string
          active: boolean
          code: string
          created_at: string
          entity_id: string
          id: string
          name: string
          normal_balance: string
          system_account: boolean
          tax_line_code: string | null
          updated_at: string
        }
        Insert: {
          account_type: string
          active?: boolean
          code: string
          created_at?: string
          entity_id: string
          id?: string
          name: string
          normal_balance: string
          system_account?: boolean
          tax_line_code?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          active?: boolean
          code?: string
          created_at?: string
          entity_id?: string
          id?: string
          name?: string
          normal_balance?: string
          system_account?: boolean
          tax_line_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      clarification_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asked_by: string | null
          context: string | null
          created_at: string
          engagement_id: string
          evidence_document_id: string | null
          id: string
          impact: string | null
          priority: string
          question: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_document_id: string | null
          source_entry_id: string | null
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asked_by?: string | null
          context?: string | null
          created_at?: string
          engagement_id: string
          evidence_document_id?: string | null
          id?: string
          impact?: string | null
          priority?: string
          question: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          source_entry_id?: string | null
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asked_by?: string | null
          context?: string | null
          created_at?: string
          engagement_id?: string
          evidence_document_id?: string | null
          id?: string
          impact?: string | null
          priority?: string
          question?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          source_entry_id?: string | null
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarification_questions_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clarification_questions_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clarification_questions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clarification_questions_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "income_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_agent: string | null
          created_at: string
          date_of_birth: string | null
          deductions: string[] | null
          dependents: number | null
          email: string | null
          filing_status: string | null
          full_name: string | null
          id: string
          income_sources: string[] | null
          notes: string | null
          occupation: string | null
          phone: string | null
          ssn_encrypted: string | null
          ssn_last4: string | null
          status: string | null
          tax_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assigned_agent?: string | null
          created_at?: string
          date_of_birth?: string | null
          deductions?: string[] | null
          dependents?: number | null
          email?: string | null
          filing_status?: string | null
          full_name?: string | null
          id?: string
          income_sources?: string[] | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          status?: string | null
          tax_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          assigned_agent?: string | null
          created_at?: string
          date_of_birth?: string | null
          deductions?: string[] | null
          dependents?: number | null
          email?: string | null
          filing_status?: string | null
          full_name?: string | null
          id?: string
          income_sources?: string[] | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          status?: string | null
          tax_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          fields: Json | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields?: Json | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          amount: number | null
          category: string | null
          client_id: string | null
          content: string | null
          content_sha256: string | null
          created_at: string
          document_date: string | null
          duplicate_status: string
          engagement_id: string | null
          entity_id: string | null
          extraction_confidence: number | null
          extraction_status: string
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          original_filename: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          status: string | null
          superseded_by: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          client_id?: string | null
          content?: string | null
          content_sha256?: string | null
          created_at?: string
          document_date?: string | null
          duplicate_status?: string
          engagement_id?: string | null
          entity_id?: string | null
          extraction_confidence?: number | null
          extraction_status?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string | null
          superseded_by?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          client_id?: string | null
          content?: string | null
          content_sha256?: string | null
          created_at?: string
          document_date?: string | null
          duplicate_status?: string
          engagement_id?: string | null
          entity_id?: string | null
          extraction_confidence?: number | null
          extraction_status?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string | null
          superseded_by?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_candidates: {
        Row: {
          candidate_document_id: string
          created_at: string
          engagement_id: string | null
          id: string
          match_type: string
          primary_document_id: string
          reasons: Json
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          score: number
          status: string
          user_id: string
        }
        Insert: {
          candidate_document_id: string
          created_at?: string
          engagement_id?: string | null
          id?: string
          match_type: string
          primary_document_id: string
          reasons?: Json
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          score: number
          status?: string
          user_id: string
        }
        Update: {
          candidate_document_id?: string
          created_at?: string
          engagement_id?: string | null
          id?: string
          match_type?: string
          primary_document_id?: string
          reasons?: Json
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          score?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_candidate_document_id_fkey"
            columns: ["candidate_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_primary_document_id_fkey"
            columns: ["primary_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      filings: {
        Row: {
          created_at: string
          engagement_id: string | null
          file_url: string | null
          form_type: string
          id: string
          irs_confirmation: string | null
          status: string | null
          submitted_at: string | null
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          engagement_id?: string | null
          file_url?: string | null
          form_type: string
          id?: string
          irs_confirmation?: string | null
          status?: string | null
          submitted_at?: string | null
          tax_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          engagement_id?: string | null
          file_url?: string | null
          form_type?: string
          id?: string
          irs_confirmation?: string | null
          status?: string | null
          submitted_at?: string | null
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filings_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          asset_class: string
          bonus_depreciation_elected: boolean
          book_life_years: number | null
          book_method: string
          business_use_percentage: number
          convention: string | null
          cost: number
          created_at: string
          current_depreciation: number
          description: string
          engagement_id: string
          entity_id: string
          id: string
          notes: string | null
          placed_in_service_date: string
          prior_depreciation: number
          recovery_period_years: number | null
          section_179_elected: number
          source_document_id: string | null
          source_entry_id: string | null
          status: string
          tax_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string
          bonus_depreciation_elected?: boolean
          book_life_years?: number | null
          book_method?: string
          business_use_percentage?: number
          convention?: string | null
          cost: number
          created_at?: string
          current_depreciation?: number
          description: string
          engagement_id: string
          entity_id: string
          id?: string
          notes?: string | null
          placed_in_service_date: string
          prior_depreciation?: number
          recovery_period_years?: number | null
          section_179_elected?: number
          source_document_id?: string | null
          source_entry_id?: string | null
          status?: string
          tax_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string
          bonus_depreciation_elected?: boolean
          book_life_years?: number | null
          book_method?: string
          business_use_percentage?: number
          convention?: string | null
          cost?: number
          created_at?: string
          current_depreciation?: number
          description?: string
          engagement_id?: string
          entity_id?: string
          id?: string
          notes?: string | null
          placed_in_service_date?: string
          prior_depreciation?: number
          recovery_period_years?: number | null
          section_179_elected?: number
          source_document_id?: string | null
          source_entry_id?: string | null
          status?: string
          tax_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "income_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      income_expenses: {
        Row: {
          amount: number
          business_use_percentage: number
          category: string
          created_at: string
          created_source: string
          currency: string
          description: string | null
          document_url: string | null
          engagement_id: string | null
          entity_id: string | null
          entry_kind: string
          id: string
          review_reason: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_document_id: string | null
          tax_year: number | null
          transaction_date: string | null
          type: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          business_use_percentage?: number
          category: string
          created_at?: string
          created_source?: string
          currency?: string
          description?: string | null
          document_url?: string | null
          engagement_id?: string | null
          entity_id?: string | null
          entry_kind?: string
          id?: string
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          tax_year?: number | null
          transaction_date?: string | null
          type: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          business_use_percentage?: number
          category?: string
          created_at?: string
          created_source?: string
          currency?: string
          description?: string | null
          document_url?: string | null
          engagement_id?: string | null
          entity_id?: string | null
          entry_kind?: string
          id?: string
          review_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          tax_year?: number | null
          transaction_date?: string | null
          type?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_expenses_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_expenses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_expenses_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string
          engagement_id: string
          entity_id: string
          entry_date: string
          id: string
          posted_at: string | null
          posted_by: string | null
          reversal_of: string | null
          source_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          engagement_id: string
          entity_id: string
          entry_date: string
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reversal_of?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          engagement_id?: string
          entity_id?: string
          entry_date?: string
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reversal_of?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          consent_text: string | null
          consent_version: string | null
          created_at: string
          document_id: string | null
          email: string | null
          filing_id: string
          filing_snapshot_hash: string | null
          id: string
          ip_address: string | null
          signature_data: string | null
          signed_at: string | null
          typed_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          filing_id: string
          filing_snapshot_hash?: string | null
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signed_at?: string | null
          typed_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          filing_id?: string
          filing_snapshot_hash?: string | null
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signed_at?: string | null
          typed_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "filings"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_engagements: {
        Row: {
          assigned_preparer: string | null
          assigned_reviewer: string | null
          created_at: string
          current_step: string
          due_date: string | null
          entity_id: string
          final_package_hash: string | null
          id: string
          locked_at: string | null
          materiality_threshold: number
          progress: number
          scope: string[]
          tax_year: number
          updated_at: string
          user_id: string
          workflow_status: string
        }
        Insert: {
          assigned_preparer?: string | null
          assigned_reviewer?: string | null
          created_at?: string
          current_step?: string
          due_date?: string | null
          entity_id: string
          final_package_hash?: string | null
          id?: string
          locked_at?: string | null
          materiality_threshold?: number
          progress?: number
          scope?: string[]
          tax_year: number
          updated_at?: string
          user_id: string
          workflow_status?: string
        }
        Update: {
          assigned_preparer?: string | null
          assigned_reviewer?: string | null
          created_at?: string
          current_step?: string
          due_date?: string | null
          entity_id?: string
          final_package_hash?: string | null
          id?: string
          locked_at?: string | null
          materiality_threshold?: number
          progress?: number
          scope?: string[]
          tax_year?: number
          updated_at?: string
          user_id?: string
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_engagements_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "tax_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_entities: {
        Row: {
          accounting_method: string
          base_currency: string
          client_id: string | null
          created_at: string
          entity_type: string
          id: string
          legal_name: string
          owner_user_id: string
          status: string
          tax_home_state: string | null
          tin_last4: string | null
          updated_at: string
        }
        Insert: {
          accounting_method?: string
          base_currency?: string
          client_id?: string | null
          created_at?: string
          entity_type: string
          id?: string
          legal_name: string
          owner_user_id: string
          status?: string
          tax_home_state?: string | null
          tin_last4?: string | null
          updated_at?: string
        }
        Update: {
          accounting_method?: string
          base_currency?: string
          client_id?: string | null
          created_at?: string
          entity_type?: string
          id?: string
          legal_name?: string
          owner_user_id?: string
          status?: string
          tax_home_state?: string | null
          tin_last4?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_entities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          engagement_id: string
          from_status: string | null
          id: string
          metadata: Json
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          engagement_id: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          engagement_id?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "tax_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_tax_engagement: {
        Args: {
          p_engagement_id: string
          p_reason?: string
          p_target_status: string
        }
        Returns: undefined
      }
      answer_clarification_question: {
        Args: {
          p_answer: string
          p_evidence_document_id?: string
          p_question_id: string
        }
        Returns: undefined
      }
      check_contact_rate_limit: {
        Args: { sender_email: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tax_staff: { Args: { _user_id: string }; Returns: boolean }
      resolve_duplicate_candidate: {
        Args: {
          p_candidate_id: string
          p_reason?: string
          p_resolution: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "client" | "preparer" | "reviewer" | "compliance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client", "preparer", "reviewer", "compliance"],
    },
  },
} as const
