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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academy_modules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          links: Json | null
          required: boolean | null
          sort_order: number
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          links?: Json | null
          required?: boolean | null
          sort_order?: number
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          links?: Json | null
          required?: boolean | null
          sort_order?: number
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          id: string
          user_id: string
          video_id: string
          watched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          watched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "academy_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_videos: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean | null
          links: Json | null
          module_id: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          links?: Json | null
          module_id: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          links?: Json | null
          module_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_rewards: {
        Row: {
          activity_date: string
          amount: number
          billing_type: string
          category: string
          client_name: string | null
          colleague_id: string
          created_at: string
          description: string
          hourly_rate: number | null
          hours: number | null
          id: string
          invoice_item_name: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          amount: number
          billing_type: string
          category: string
          client_name?: string | null
          colleague_id: string
          created_at?: string
          description: string
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_item_name: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          amount?: number
          billing_type?: string
          category?: string
          client_name?: string | null
          colleague_id?: string
          created_at?: string
          description?: string
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_item_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_rewards_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_history: {
        Row: {
          applicant_id: string
          change_type: Database["public"]["Enums"]["applicant_change_type"]
          changed_by: string | null
          changed_by_name: string
          created_at: string | null
          field_label: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          applicant_id: string
          change_type: Database["public"]["Enums"]["applicant_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          applicant_id?: string
          change_type?: Database["public"]["Enums"]["applicant_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_history_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      applicants: {
        Row: {
          avatar_url: string | null
          bank_account: string | null
          billing_city: string | null
          billing_street: string | null
          billing_zip: string | null
          birthday: string | null
          company_name: string | null
          converted_to_colleague_id: string | null
          cover_letter: string | null
          created_at: string | null
          cv_url: string | null
          dic: string | null
          email: string
          full_name: string
          hourly_rate: number | null
          ico: string | null
          id: string
          interview_invite_sent_at: string | null
          notes: Json | null
          onboarding_completed_at: string | null
          onboarding_sent_at: string | null
          owner_id: string | null
          personal_email: string | null
          phone: string | null
          position: string
          rejection_sent_at: string | null
          source: Database["public"]["Enums"]["applicant_source"] | null
          source_custom: string | null
          stage: Database["public"]["Enums"]["applicant_stage"] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account?: string | null
          billing_city?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          birthday?: string | null
          company_name?: string | null
          converted_to_colleague_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          dic?: string | null
          email: string
          full_name: string
          hourly_rate?: number | null
          ico?: string | null
          id?: string
          interview_invite_sent_at?: string | null
          notes?: Json | null
          onboarding_completed_at?: string | null
          onboarding_sent_at?: string | null
          owner_id?: string | null
          personal_email?: string | null
          phone?: string | null
          position: string
          rejection_sent_at?: string | null
          source?: Database["public"]["Enums"]["applicant_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["applicant_stage"] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account?: string | null
          billing_city?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          birthday?: string | null
          company_name?: string | null
          converted_to_colleague_id?: string | null
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          dic?: string | null
          email?: string
          full_name?: string
          hourly_rate?: number | null
          ico?: string | null
          id?: string
          interview_invite_sent_at?: string | null
          notes?: Json | null
          onboarding_completed_at?: string | null
          onboarding_sent_at?: string | null
          owner_id?: string | null
          personal_email?: string | null
          phone?: string | null
          position?: string
          rejection_sent_at?: string | null
          source?: Database["public"]["Enums"]["applicant_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["applicant_stage"] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicants_converted_to_colleague_id_fkey"
            columns: ["converted_to_colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_change_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          client_id: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          client_id: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          client_id?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_change_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          app_name: string | null
          console_logs: Json | null
          created_at: string | null
          description: string | null
          dom_snapshot: string | null
          environment: Json | null
          id: string
          network_logs: Json | null
          pr_url: string | null
          priority: string | null
          screenshot_url: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          app_name?: string | null
          console_logs?: Json | null
          created_at?: string | null
          description?: string | null
          dom_snapshot?: string | null
          environment?: Json | null
          id?: string
          network_logs?: Json | null
          pr_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          app_name?: string | null
          console_logs?: Json | null
          created_at?: string | null
          description?: string | null
          dom_snapshot?: string | null
          environment?: Json | null
          id?: string
          network_logs?: Json | null
          pr_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      calendar_tokens: {
        Row: {
          access_token: string
          expires_at: string
          refresh_token: string
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          expires_at: string
          refresh_token: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          refresh_token?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          is_decision_maker: boolean | null
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history: {
        Row: {
          change_type: Database["public"]["Enums"]["client_change_type"]
          changed_by: string | null
          changed_by_name: string
          client_id: string
          created_at: string | null
          field_label: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["client_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          client_id: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["client_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          client_id?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          acquisition_channel: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_street: string | null
          billing_zip: string | null
          brand_name: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          dic: string | null
          end_date: string | null
          fakturoid_subject_id: number | null
          ico: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          pinned_notes: string | null
          sales_representative_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          tier: Database["public"]["Enums"]["client_tier"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          brand_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          dic?: string | null
          end_date?: string | null
          fakturoid_subject_id?: number | null
          ico: string
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          pinned_notes?: string | null
          sales_representative_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          tier?: Database["public"]["Enums"]["client_tier"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          brand_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          dic?: string | null
          end_date?: string | null
          fakturoid_subject_id?: number | null
          ico?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          pinned_notes?: string | null
          sales_representative_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          tier?: Database["public"]["Enums"]["client_tier"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_sales_representative_id_fkey"
            columns: ["sales_representative_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      colleagues: {
        Row: {
          bank_account: string | null
          billing_city: string | null
          billing_street: string | null
          billing_zip: string | null
          birthday: string | null
          capacity_hours_per_month: number | null
          capacity_slots: Json | null
          company_name: string | null
          created_at: string | null
          dic: string | null
          email: string
          email_signature: string | null
          full_name: string
          ico: string | null
          id: string
          internal_hourly_cost: number | null
          is_freelancer: boolean | null
          max_engagements: number | null
          monthly_fixed_cost: number | null
          notes: string | null
          personal_email: string | null
          phone: string | null
          position: string
          profile_id: string | null
          seniority: Database["public"]["Enums"]["seniority"]
          status: Database["public"]["Enums"]["colleague_status"] | null
          updated_at: string | null
        }
        Insert: {
          bank_account?: string | null
          billing_city?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          birthday?: string | null
          capacity_hours_per_month?: number | null
          capacity_slots?: Json | null
          company_name?: string | null
          created_at?: string | null
          dic?: string | null
          email: string
          email_signature?: string | null
          full_name: string
          ico?: string | null
          id?: string
          internal_hourly_cost?: number | null
          is_freelancer?: boolean | null
          max_engagements?: number | null
          monthly_fixed_cost?: number | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          position: string
          profile_id?: string | null
          seniority: Database["public"]["Enums"]["seniority"]
          status?: Database["public"]["Enums"]["colleague_status"] | null
          updated_at?: string | null
        }
        Update: {
          bank_account?: string | null
          billing_city?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          birthday?: string | null
          capacity_hours_per_month?: number | null
          capacity_slots?: Json | null
          company_name?: string | null
          created_at?: string | null
          dic?: string | null
          email?: string
          email_signature?: string | null
          full_name?: string
          ico?: string | null
          id?: string
          internal_hourly_cost?: number | null
          is_freelancer?: boolean | null
          max_engagements?: number | null
          monthly_fixed_cost?: number | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          position?: string
          profile_id?: string | null
          seniority?: Database["public"]["Enums"]["seniority"]
          status?: Database["public"]["Enums"]["colleague_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colleagues_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_boost_client_months: {
        Row: {
          client_id: string
          colleague_id: string | null
          created_at: string | null
          engagement_id: string | null
          engagement_service_id: string | null
          id: string
          invoice_id: string | null
          invoiced_amount: number | null
          invoiced_at: string | null
          invoiced_credits: number | null
          max_credits: number
          min_credits: number
          month: number
          price_per_credit: number
          status: Database["public"]["Enums"]["month_status"] | null
          updated_at: string | null
          year: number
        }
        Insert: {
          client_id: string
          colleague_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          engagement_service_id?: string | null
          id?: string
          invoice_id?: string | null
          invoiced_amount?: number | null
          invoiced_at?: string | null
          invoiced_credits?: number | null
          max_credits?: number
          min_credits?: number
          month: number
          price_per_credit?: number
          status?: Database["public"]["Enums"]["month_status"] | null
          updated_at?: string | null
          year: number
        }
        Update: {
          client_id?: string
          colleague_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          engagement_service_id?: string | null
          id?: string
          invoice_id?: string | null
          invoiced_amount?: number | null
          invoiced_at?: string | null
          invoiced_credits?: number | null
          max_credits?: number
          min_credits?: number
          month?: number
          price_per_credit?: number
          status?: Database["public"]["Enums"]["month_status"] | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_boost_client_months_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_client_months_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_client_months_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_client_months_engagement_service_id_fkey"
            columns: ["engagement_service_id"]
            isOneToOne: false
            referencedRelation: "engagement_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_client_months_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "issued_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_boost_outputs: {
        Row: {
          client_id: string
          client_month_id: string | null
          colleague_id: string | null
          created_at: string | null
          express_count: number
          id: string
          month: number
          normal_count: number
          output_type_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          client_id: string
          client_month_id?: string | null
          colleague_id?: string | null
          created_at?: string | null
          express_count?: number
          id?: string
          month: number
          normal_count?: number
          output_type_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          client_id?: string
          client_month_id?: string | null
          colleague_id?: string | null
          created_at?: string | null
          express_count?: number
          id?: string
          month?: number
          normal_count?: number
          output_type_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_boost_outputs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_outputs_client_month_id_fkey"
            columns: ["client_month_id"]
            isOneToOne: false
            referencedRelation: "creative_boost_client_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_outputs_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_outputs_output_type_id_fkey"
            columns: ["output_type_id"]
            isOneToOne: false
            referencedRelation: "output_types"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_boost_public_shares: {
        Row: {
          brand_name: string | null
          client_id: string
          client_month_id: string
          client_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          max_credits: number
          month: number
          price_per_credit: number
          token: string
          updated_at: string
          valid_until: string | null
          view_count: number
          year: number
        }
        Insert: {
          brand_name?: string | null
          client_id: string
          client_month_id: string
          client_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_credits: number
          month: number
          price_per_credit: number
          token?: string
          updated_at?: string
          valid_until?: string | null
          view_count?: number
          year: number
        }
        Update: {
          brand_name?: string | null
          client_id?: string
          client_month_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          max_credits?: number
          month?: number
          price_per_credit?: number
          token?: string
          updated_at?: string
          valid_until?: string | null
          view_count?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_boost_public_shares_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_public_shares_client_month_id_fkey"
            columns: ["client_month_id"]
            isOneToOne: false
            referencedRelation: "creative_boost_client_months"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_boost_settings_history: {
        Row: {
          change_type: Database["public"]["Enums"]["settings_change_type"]
          changed_at: string | null
          changed_by: string
          changed_by_name: string
          client_id: string
          client_month_id: string
          field_name: string
          id: string
          month: number
          new_value: string | null
          old_value: string | null
          year: number
        }
        Insert: {
          change_type: Database["public"]["Enums"]["settings_change_type"]
          changed_at?: string | null
          changed_by: string
          changed_by_name: string
          client_id: string
          client_month_id: string
          field_name: string
          id?: string
          month: number
          new_value?: string | null
          old_value?: string | null
          year: number
        }
        Update: {
          change_type?: Database["public"]["Enums"]["settings_change_type"]
          changed_at?: string | null
          changed_by?: string
          changed_by_name?: string
          client_id?: string
          client_month_id?: string
          field_name?: string
          id?: string
          month?: number
          new_value?: string | null
          old_value?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_boost_settings_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_boost_settings_history_client_month_id_fkey"
            columns: ["client_month_id"]
            isOneToOne: false
            referencedRelation: "creative_boost_client_months"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_boost_share_outputs: {
        Row: {
          base_credits: number
          category: string
          credits: number
          express_count: number
          id: string
          normal_count: number
          output_type_name: string
          share_id: string
        }
        Insert: {
          base_credits: number
          category: string
          credits: number
          express_count?: number
          id?: string
          normal_count?: number
          output_type_name: string
          share_id: string
        }
        Update: {
          base_credits?: number
          category?: string
          credits?: number
          express_count?: number
          id?: string
          normal_count?: number
          output_type_name?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_boost_share_outputs_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "creative_boost_public_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: string[]
          body_template: string
          created_at: string
          description: string
          id: string
          name: string
          subject_template: string
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_variables?: string[]
          body_template: string
          created_at?: string
          description?: string
          id?: string
          name: string
          subject_template: string
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_variables?: string[]
          body_template?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          subject_template?: string
          template_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      engagement_assignments: {
        Row: {
          colleague_id: string
          cost_model: Database["public"]["Enums"]["cost_model"] | null
          created_at: string | null
          end_date: string | null
          engagement_id: string
          engagement_service_id: string | null
          hourly_cost: number | null
          id: string
          monthly_cost: number | null
          notes: string | null
          percentage_of_revenue: number | null
          reward_per_credit: number | null
          role_on_engagement: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          colleague_id: string
          cost_model?: Database["public"]["Enums"]["cost_model"] | null
          created_at?: string | null
          end_date?: string | null
          engagement_id: string
          engagement_service_id?: string | null
          hourly_cost?: number | null
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          percentage_of_revenue?: number | null
          reward_per_credit?: number | null
          role_on_engagement?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          colleague_id?: string
          cost_model?: Database["public"]["Enums"]["cost_model"] | null
          created_at?: string | null
          end_date?: string | null
          engagement_id?: string
          engagement_service_id?: string | null
          hourly_cost?: number | null
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          percentage_of_revenue?: number | null
          reward_per_credit?: number | null
          role_on_engagement?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_assignments_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_assignments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_assignments_engagement_service_id_fkey"
            columns: ["engagement_service_id"]
            isOneToOne: false
            referencedRelation: "engagement_services"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_history: {
        Row: {
          change_type: Database["public"]["Enums"]["engagement_change_type"]
          changed_by: string | null
          changed_by_name: string
          created_at: string | null
          engagement_id: string
          field_label: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          related_entity_id: string | null
          related_entity_name: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["engagement_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          engagement_id: string
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["engagement_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          engagement_id?: string
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_history_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_monthly_metrics: {
        Row: {
          cost_total: number
          created_at: string | null
          engagement_id: string
          id: string
          margin_amount: number
          margin_percent: number
          month: number
          notes: string | null
          revenue: number
          updated_at: string | null
          year: number
        }
        Insert: {
          cost_total?: number
          created_at?: string | null
          engagement_id: string
          id?: string
          margin_amount?: number
          margin_percent?: number
          month: number
          notes?: string | null
          revenue?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          cost_total?: number
          created_at?: string | null
          engagement_id?: string
          id?: string
          margin_amount?: number
          margin_percent?: number
          month?: number
          notes?: string | null
          revenue?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "engagement_monthly_metrics_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_services: {
        Row: {
          billing_type: string
          created_at: string | null
          creative_boost_max_credits: number | null
          creative_boost_min_credits: number | null
          creative_boost_price_per_credit: number | null
          currency: string
          engagement_id: string
          id: string
          invoice_id: string | null
          invoiced_at: string | null
          invoiced_in_period: string | null
          invoicing_status:
            | Database["public"]["Enums"]["one_off_invoicing_status"]
            | null
          is_active: boolean | null
          name: string
          notes: string | null
          price: number
          selected_tier: Database["public"]["Enums"]["service_tier"] | null
          service_id: string | null
          updated_at: string | null
          upsell_commission_percent: number | null
          upsold_by_id: string | null
        }
        Insert: {
          billing_type: string
          created_at?: string | null
          creative_boost_max_credits?: number | null
          creative_boost_min_credits?: number | null
          creative_boost_price_per_credit?: number | null
          currency?: string
          engagement_id: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          invoiced_in_period?: string | null
          invoicing_status?:
            | Database["public"]["Enums"]["one_off_invoicing_status"]
            | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          price: number
          selected_tier?: Database["public"]["Enums"]["service_tier"] | null
          service_id?: string | null
          updated_at?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
        }
        Update: {
          billing_type?: string
          created_at?: string | null
          creative_boost_max_credits?: number | null
          creative_boost_min_credits?: number | null
          creative_boost_price_per_credit?: number | null
          currency?: string
          engagement_id?: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          invoiced_in_period?: string | null
          invoicing_status?:
            | Database["public"]["Enums"]["one_off_invoicing_status"]
            | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          price?: number
          selected_tier?: Database["public"]["Enums"]["service_tier"] | null
          service_id?: string | null
          updated_at?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_services_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_services_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "issued_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_services_upsold_by_id_fkey"
            columns: ["upsold_by_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          billing_model: Database["public"]["Enums"]["billing_model"]
          client_id: string
          contact_person_id: string | null
          contract_url: string | null
          created_at: string | null
          currency: string
          deleted_at: string | null
          end_date: string | null
          freelo_url: string | null
          id: string
          managed_countries: string[] | null
          monthly_fee: number | null
          name: string
          notes: string | null
          notice_period_months: number | null
          offer_url: string | null
          one_off_fee: number | null
          platforms: string[] | null
          start_date: string
          status: Database["public"]["Enums"]["engagement_status"] | null
          termination_initiated_by: string | null
          termination_notes: string | null
          termination_reason: string | null
          type: Database["public"]["Enums"]["engagement_type"]
          updated_at: string | null
        }
        Insert: {
          billing_model: Database["public"]["Enums"]["billing_model"]
          client_id: string
          contact_person_id?: string | null
          contract_url?: string | null
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          end_date?: string | null
          freelo_url?: string | null
          id?: string
          managed_countries?: string[] | null
          monthly_fee?: number | null
          name: string
          notes?: string | null
          notice_period_months?: number | null
          offer_url?: string | null
          one_off_fee?: number | null
          platforms?: string[] | null
          start_date: string
          status?: Database["public"]["Enums"]["engagement_status"] | null
          termination_initiated_by?: string | null
          termination_notes?: string | null
          termination_reason?: string | null
          type: Database["public"]["Enums"]["engagement_type"]
          updated_at?: string | null
        }
        Update: {
          billing_model?: Database["public"]["Enums"]["billing_model"]
          client_id?: string
          contact_person_id?: string | null
          contract_url?: string | null
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          end_date?: string | null
          freelo_url?: string | null
          id?: string
          managed_countries?: string[] | null
          monthly_fee?: number | null
          name?: string
          notes?: string | null
          notice_period_months?: number | null
          offer_url?: string | null
          one_off_fee?: number | null
          platforms?: string[] | null
          start_date?: string
          status?: Database["public"]["Enums"]["engagement_status"] | null
          termination_initiated_by?: string | null
          termination_notes?: string | null
          termination_reason?: string | null
          type?: Database["public"]["Enums"]["engagement_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_work_approval_logs: {
        Row: {
          action: string
          created_at: string
          email: string | null
          extra_work_id: string
          id: string
          ip_address: string | null
          rejection_reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          extra_work_id: string
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          extra_work_id?: string
          id?: string
          ip_address?: string | null
          rejection_reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_work_approval_logs_extra_work_id_fkey"
            columns: ["extra_work_id"]
            isOneToOne: false
            referencedRelation: "extra_works"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_work_history: {
        Row: {
          change_type: Database["public"]["Enums"]["extra_work_change_type"]
          changed_by: string | null
          changed_by_name: string
          created_at: string | null
          extra_work_id: string
          field_label: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["extra_work_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          extra_work_id: string
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["extra_work_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          extra_work_id?: string
          field_label?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_work_history_extra_work_id_fkey"
            columns: ["extra_work_id"]
            isOneToOne: false
            referencedRelation: "extra_works"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_works: {
        Row: {
          amount: number
          approval_date: string | null
          approval_token: string | null
          approved_by: string | null
          billing_period: string
          client_approval_email: string | null
          client_approved_at: string | null
          client_id: string
          client_rejected_at: string | null
          client_rejection_reason: string | null
          colleague_id: string
          created_at: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          engagement_id: string | null
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          invoice_id: string | null
          invoice_number: string | null
          invoiced_at: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["extra_work_status"] | null
          updated_at: string | null
          upsell_commission_percent: number | null
          upsold_by_id: string | null
          work_date: string
        }
        Insert: {
          amount: number
          approval_date?: string | null
          approval_token?: string | null
          approved_by?: string | null
          billing_period: string
          client_approval_email?: string | null
          client_approved_at?: string | null
          client_id: string
          client_rejected_at?: string | null
          client_rejection_reason?: string | null
          colleague_id: string
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          engagement_id?: string | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoiced_at?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["extra_work_status"] | null
          updated_at?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
          work_date: string
        }
        Update: {
          amount?: number
          approval_date?: string | null
          approval_token?: string | null
          approved_by?: string | null
          billing_period?: string
          client_approval_email?: string | null
          client_approved_at?: string | null
          client_id?: string
          client_rejected_at?: string | null
          client_rejection_reason?: string | null
          colleague_id?: string
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          engagement_id?: string | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoiced_at?: string | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["extra_work_status"] | null
          updated_at?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_works_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_works_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_works_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_works_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "issued_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_works_upsold_by_id_fkey"
            columns: ["upsold_by_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_ideas: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string | null
          description: string
          id: string
          status: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category: Database["public"]["Enums"]["feedback_category"]
          created_at?: string | null
          description: string
          id?: string
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string | null
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["feedback_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ideas_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          colleague_id: string
          created_at: string | null
          id: string
          idea_id: string
          vote_type: string
        }
        Insert: {
          colleague_id: string
          created_at?: string | null
          id?: string
          idea_id: string
          vote_type: string
        }
        Update: {
          colleague_id?: string
          created_at?: string | null
          id?: string
          idea_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "feedback_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_log: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          is_success: boolean
          related_record_id: string | null
          related_table: string | null
          request_payload: Json | null
          response_payload: Json | null
          response_status: number | null
          service: string
          triggered_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_success: boolean
          related_record_id?: string | null
          related_table?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          service: string
          triggered_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          is_success?: boolean
          related_record_id?: string | null
          related_table?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          service?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          adjustment_amount: number | null
          adjustment_reason: string | null
          created_at: string | null
          currency: string
          engagement_id: string | null
          engagement_service_id: string | null
          extra_work_id: string | null
          final_amount: number
          hourly_rate: number | null
          hours: number | null
          id: string
          invoice_id: string
          is_approved: boolean | null
          is_reverse_charge: boolean | null
          line_description: string
          note: string | null
          period_end: string | null
          period_start: string | null
          prorated_amount: number | null
          prorated_days: number | null
          quantity: number
          source: Database["public"]["Enums"]["line_item_source"]
          source_amount: number | null
          source_description: string | null
          total_days_in_month: number | null
          unit_name: string | null
          unit_price: number
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          adjustment_amount?: number | null
          adjustment_reason?: string | null
          created_at?: string | null
          currency?: string
          engagement_id?: string | null
          engagement_service_id?: string | null
          extra_work_id?: string | null
          final_amount: number
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_id: string
          is_approved?: boolean | null
          is_reverse_charge?: boolean | null
          line_description: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          prorated_amount?: number | null
          prorated_days?: number | null
          quantity?: number
          source: Database["public"]["Enums"]["line_item_source"]
          source_amount?: number | null
          source_description?: string | null
          total_days_in_month?: number | null
          unit_name?: string | null
          unit_price: number
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          adjustment_amount?: number | null
          adjustment_reason?: string | null
          created_at?: string | null
          currency?: string
          engagement_id?: string | null
          engagement_service_id?: string | null
          extra_work_id?: string | null
          final_amount?: number
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_id?: string
          is_approved?: boolean | null
          is_reverse_charge?: boolean | null
          line_description?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          prorated_amount?: number | null
          prorated_days?: number | null
          quantity?: number
          source?: Database["public"]["Enums"]["line_item_source"]
          source_amount?: number | null
          source_description?: string | null
          total_days_in_month?: number | null
          unit_name?: string | null
          unit_price?: number
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_engagement_service_id_fkey"
            columns: ["engagement_service_id"]
            isOneToOne: false
            referencedRelation: "engagement_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_extra_work_id_fkey"
            columns: ["extra_work_id"]
            isOneToOne: false
            referencedRelation: "extra_works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "issued_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_invoices: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string
          engagement_id: string | null
          engagement_name: string | null
          fakturoid_id: string | null
          fakturoid_url: string | null
          id: string
          invoice_number: string
          issued_at: string
          issued_by: string | null
          line_items: Json | null
          month: number
          paid_at: string | null
          status: string | null
          total_amount: number
          year: number
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string
          engagement_id?: string | null
          engagement_name?: string | null
          fakturoid_id?: string | null
          fakturoid_url?: string | null
          id?: string
          invoice_number: string
          issued_at: string
          issued_by?: string | null
          line_items?: Json | null
          month: number
          paid_at?: string | null
          status?: string | null
          total_amount: number
          year: number
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string
          engagement_id?: string | null
          engagement_name?: string | null
          fakturoid_id?: string | null
          fakturoid_url?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          issued_by?: string | null
          line_items?: Json | null
          month?: number
          paid_at?: string | null
          status?: string | null
          total_amount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "issued_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_invoices_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          change_type: Database["public"]["Enums"]["lead_change_type"]
          changed_by: string | null
          changed_by_name: string
          created_at: string | null
          field_label: string | null
          field_name: string | null
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["lead_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["lead_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          access_received_at: string | null
          access_request_platforms: string[] | null
          access_request_sent_at: string | null
          ad_spend_monthly: number | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_street: string | null
          billing_zip: string | null
          client_message: string | null
          company_name: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_position: string | null
          contract_created_at: string | null
          contract_sent_at: string | null
          contract_signed_at: string | null
          contract_url: string | null
          converted_at: string | null
          converted_to_client_id: string | null
          converted_to_engagement_id: string | null
          court_file_number: string | null
          court_name: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          dic: string | null
          digisign_id: string | null
          estimated_price: number | null
          ico: string
          id: string
          industry: string | null
          notes: Json | null
          offer_created_at: string | null
          offer_sent_at: string | null
          offer_sent_by_id: string | null
          offer_type: string | null
          offer_url: string | null
          onboarding_form_completed_at: string | null
          onboarding_form_sent_at: string | null
          onboarding_form_url: string | null
          onboarding_project_contacts: Json | null
          onboarding_signatories: Json | null
          onboarding_start_date: string | null
          owner_id: string | null
          potential_service: string | null
          potential_services: Json | null
          probability_percent: number | null
          qualification_reason: string | null
          qualification_status: string | null
          qualified_at: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          source_custom: string | null
          stage: Database["public"]["Enums"]["lead_stage"] | null
          summary: string | null
          updated_at: string | null
          updated_by: string | null
          vat_payer_checked_at: string | null
          vat_payer_status: string | null
          website: string | null
        }
        Insert: {
          access_received_at?: string | null
          access_request_platforms?: string[] | null
          access_request_sent_at?: string | null
          ad_spend_monthly?: number | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          client_message?: string | null
          company_name: string
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_position?: string | null
          contract_created_at?: string | null
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          converted_at?: string | null
          converted_to_client_id?: string | null
          converted_to_engagement_id?: string | null
          court_file_number?: string | null
          court_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          dic?: string | null
          digisign_id?: string | null
          estimated_price?: number | null
          ico: string
          id?: string
          industry?: string | null
          notes?: Json | null
          offer_created_at?: string | null
          offer_sent_at?: string | null
          offer_sent_by_id?: string | null
          offer_type?: string | null
          offer_url?: string | null
          onboarding_form_completed_at?: string | null
          onboarding_form_sent_at?: string | null
          onboarding_form_url?: string | null
          onboarding_project_contacts?: Json | null
          onboarding_signatories?: Json | null
          onboarding_start_date?: string | null
          owner_id?: string | null
          potential_service?: string | null
          potential_services?: Json | null
          probability_percent?: number | null
          qualification_reason?: string | null
          qualification_status?: string | null
          qualified_at?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vat_payer_checked_at?: string | null
          vat_payer_status?: string | null
          website?: string | null
        }
        Update: {
          access_received_at?: string | null
          access_request_platforms?: string[] | null
          access_request_sent_at?: string | null
          ad_spend_monthly?: number | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_street?: string | null
          billing_zip?: string | null
          client_message?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_position?: string | null
          contract_created_at?: string | null
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          converted_at?: string | null
          converted_to_client_id?: string | null
          converted_to_engagement_id?: string | null
          court_file_number?: string | null
          court_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          dic?: string | null
          digisign_id?: string | null
          estimated_price?: number | null
          ico?: string
          id?: string
          industry?: string | null
          notes?: Json | null
          offer_created_at?: string | null
          offer_sent_at?: string | null
          offer_sent_by_id?: string | null
          offer_type?: string | null
          offer_url?: string | null
          onboarding_form_completed_at?: string | null
          onboarding_form_sent_at?: string | null
          onboarding_form_url?: string | null
          onboarding_project_contacts?: Json | null
          onboarding_signatories?: Json | null
          onboarding_start_date?: string | null
          owner_id?: string | null
          potential_service?: string | null
          potential_services?: Json | null
          probability_percent?: number | null
          qualification_reason?: string | null
          qualification_status?: string | null
          qualified_at?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vat_payer_checked_at?: string | null
          vat_payer_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_to_client_id_fkey"
            columns: ["converted_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_engagement_id_fkey"
            columns: ["converted_to_engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_offer_sent_by_id_fkey"
            columns: ["offer_sent_by_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_history: {
        Row: {
          change_type: Database["public"]["Enums"]["meeting_change_type"]
          changed_by: string | null
          changed_by_name: string
          created_at: string | null
          field_label: string | null
          field_name: string | null
          id: string
          meeting_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["meeting_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          meeting_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["meeting_change_type"]
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string | null
          field_label?: string | null
          field_name?: string | null
          id?: string
          meeting_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_history_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_status"] | null
          colleague_id: string | null
          created_at: string | null
          external_email: string | null
          external_name: string | null
          id: string
          meeting_id: string
          role: Database["public"]["Enums"]["participant_role"] | null
          updated_at: string | null
        }
        Insert: {
          attendance?: Database["public"]["Enums"]["attendance_status"] | null
          colleague_id?: string | null
          created_at?: string | null
          external_email?: string | null
          external_name?: string | null
          id?: string
          meeting_id: string
          role?: Database["public"]["Enums"]["participant_role"] | null
          updated_at?: string | null
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"] | null
          colleague_id?: string | null
          created_at?: string | null
          external_email?: string | null
          external_name?: string | null
          id?: string
          meeting_id?: string
          role?: Database["public"]["Enums"]["participant_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_colleague_id_fkey"
            columns: ["colleague_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          meeting_id: string
          priority: Database["public"]["Enums"]["meeting_task_priority"] | null
          status: Database["public"]["Enums"]["meeting_task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id: string
          priority?: Database["public"]["Enums"]["meeting_task_priority"] | null
          status?: Database["public"]["Enums"]["meeting_task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string
          priority?: Database["public"]["Enums"]["meeting_task_priority"] | null
          status?: Database["public"]["Enums"]["meeting_task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          ai_summary: string | null
          calendar_invites_sent_at: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number
          engagement_id: string | null
          google_event_id: string | null
          id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          transcript: string | null
          type: Database["public"]["Enums"]["meeting_type"]
          updated_at: string | null
        }
        Insert: {
          agenda?: string | null
          ai_summary?: string | null
          calendar_invites_sent_at?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          engagement_id?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title: string
          transcript?: string | null
          type: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string | null
        }
        Update: {
          agenda?: string | null
          ai_summary?: string | null
          calendar_invites_sent_at?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          engagement_id?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"] | null
          title?: string
          transcript?: string | null
          type?: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      modification_request_emails: {
        Row: {
          id: string
          modification_request_id: string
          sent_at: string
          sent_by_id: string | null
          sent_by_name: string
          sent_to: string
        }
        Insert: {
          id?: string
          modification_request_id: string
          sent_at?: string
          sent_by_id?: string | null
          sent_by_name: string
          sent_to: string
        }
        Update: {
          id?: string
          modification_request_id?: string
          sent_at?: string
          sent_by_id?: string | null
          sent_by_name?: string
          sent_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "modification_request_emails_modification_request_id_fkey"
            columns: ["modification_request_id"]
            isOneToOne: false
            referencedRelation: "modification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      modification_requests: {
        Row: {
          client_approved_at: string | null
          client_brand_name: string | null
          client_email: string | null
          client_id: string
          client_name: string
          created_at: string
          effective_from: string | null
          engagement_assignment_id: string | null
          engagement_id: string
          engagement_name: string
          engagement_service_id: string | null
          id: string
          note: string | null
          proposed_changes: Json
          rejection_reason: string | null
          request_type: Database["public"]["Enums"]["modification_request_type"]
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["modification_request_status"]
          updated_at: string
          upgrade_offer_token: string | null
          upgrade_offer_valid_until: string | null
          upsell_commission_percent: number | null
          upsold_by_id: string | null
          upsold_by_name: string | null
        }
        Insert: {
          client_approved_at?: string | null
          client_brand_name?: string | null
          client_email?: string | null
          client_id: string
          client_name: string
          created_at?: string
          effective_from?: string | null
          engagement_assignment_id?: string | null
          engagement_id: string
          engagement_name: string
          engagement_service_id?: string | null
          id?: string
          note?: string | null
          proposed_changes: Json
          rejection_reason?: string | null
          request_type: Database["public"]["Enums"]["modification_request_type"]
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["modification_request_status"]
          updated_at?: string
          upgrade_offer_token?: string | null
          upgrade_offer_valid_until?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
          upsold_by_name?: string | null
        }
        Update: {
          client_approved_at?: string | null
          client_brand_name?: string | null
          client_email?: string | null
          client_id?: string
          client_name?: string
          created_at?: string
          effective_from?: string | null
          engagement_assignment_id?: string | null
          engagement_id?: string
          engagement_name?: string
          engagement_service_id?: string | null
          id?: string
          note?: string | null
          proposed_changes?: Json
          rejection_reason?: string | null
          request_type?: Database["public"]["Enums"]["modification_request_type"]
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["modification_request_status"]
          updated_at?: string
          upgrade_offer_token?: string | null
          upgrade_offer_valid_until?: string | null
          upsell_commission_percent?: number | null
          upsold_by_id?: string | null
          upsold_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modification_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modification_requests_engagement_assignment_id_fkey"
            columns: ["engagement_assignment_id"]
            isOneToOne: false
            referencedRelation: "engagement_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modification_requests_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modification_requests_engagement_service_id_fkey"
            columns: ["engagement_service_id"]
            isOneToOne: false
            referencedRelation: "engagement_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modification_requests_upsold_by_id_fkey"
            columns: ["upsold_by_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      output_types: {
        Row: {
          base_credits: number
          category: Database["public"]["Enums"]["output_category"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_credits: number
          category: Database["public"]["Enums"]["output_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_credits?: number
          category?: Database["public"]["Enums"]["output_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      planned_engagements: {
        Row: {
          assigned_colleague_ids: string[]
          client_name: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          monthly_fee: number
          name: string
          notes: string
          probability_percent: number
          start_date: string
          updated_at: string
        }
        Insert: {
          assigned_colleague_ids?: string[]
          client_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          monthly_fee: number
          name: string
          notes?: string
          probability_percent: number
          start_date: string
          updated_at?: string
        }
        Update: {
          assigned_colleague_ids?: string[]
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          name?: string
          notes?: string
          probability_percent?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_engagements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_engagements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_notification_level: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_notification_level?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_notification_level?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      public_offers: {
        Row: {
          audit_summary: string | null
          company_name: string
          contact_name: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_note: string | null
          discount_scope: string | null
          estimated_start_date: string | null
          id: string
          is_active: boolean | null
          lead_id: string | null
          monthly_discount_percent: number | null
          notion_url: string | null
          offer_type: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          portfolio_links: Json | null
          recommendation_intro: string | null
          services: Json
          token: string
          total_price: number
          updated_at: string | null
          valid_until: string | null
          view_count: number | null
          viewed_at: string | null
          website: string | null
        }
        Insert: {
          audit_summary?: string | null
          company_name: string
          contact_name: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_note?: string | null
          discount_scope?: string | null
          estimated_start_date?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          monthly_discount_percent?: number | null
          notion_url?: string | null
          offer_type?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          portfolio_links?: Json | null
          recommendation_intro?: string | null
          services?: Json
          token: string
          total_price?: number
          updated_at?: string | null
          valid_until?: string | null
          view_count?: number | null
          viewed_at?: string | null
          website?: string | null
        }
        Update: {
          audit_summary?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_note?: string | null
          discount_scope?: string | null
          estimated_start_date?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          monthly_discount_percent?: number | null
          notion_url?: string | null
          offer_type?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          portfolio_links?: Json | null
          recommendation_intro?: string | null
          services?: Json
          token?: string
          total_price?: number
          updated_at?: string | null
          valid_until?: string | null
          view_count?: number | null
          viewed_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_targets: {
        Row: {
          created_at: string
          id: string
          month: number
          target_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          target_revenue: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          target_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          benefits: string[] | null
          billing_type: string
          category: Database["public"]["Enums"]["service_category"]
          code: string
          created_at: string | null
          credit_pricing: Json | null
          currency: string | null
          default_deliverables: string[] | null
          default_frequency: string | null
          default_requirements: string[] | null
          default_turnaround: string | null
          description: string | null
          external_url: string | null
          id: string
          is_active: boolean | null
          management_items: Json | null
          name: string
          offer_description: string | null
          platforms: string[] | null
          service_type: Database["public"]["Enums"]["service_type"]
          setup_items: Json | null
          tagline: string | null
          target_audience: string | null
          tier_comparison: Json | null
          tier_pricing: Json | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          benefits?: string[] | null
          billing_type?: string
          category: Database["public"]["Enums"]["service_category"]
          code: string
          created_at?: string | null
          credit_pricing?: Json | null
          currency?: string | null
          default_deliverables?: string[] | null
          default_frequency?: string | null
          default_requirements?: string[] | null
          default_turnaround?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          management_items?: Json | null
          name: string
          offer_description?: string | null
          platforms?: string[] | null
          service_type: Database["public"]["Enums"]["service_type"]
          setup_items?: Json | null
          tagline?: string | null
          target_audience?: string | null
          tier_comparison?: Json | null
          tier_pricing?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          benefits?: string[] | null
          billing_type?: string
          category?: Database["public"]["Enums"]["service_category"]
          code?: string
          created_at?: string | null
          credit_pricing?: Json | null
          currency?: string | null
          default_deliverables?: string[] | null
          default_frequency?: string | null
          default_requirements?: string[] | null
          default_turnaround?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          management_items?: Json | null
          name?: string
          offer_description?: string | null
          platforms?: string[] | null
          service_type?: Database["public"]["Enums"]["service_type"]
          setup_items?: Json | null
          tagline?: string | null
          target_audience?: string | null
          tier_comparison?: Json | null
          tier_pricing?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sop_articles: {
        Row: {
          attachments: Json | null
          category_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          owner_id: string | null
          search_text: string | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          attachments?: Json | null
          category_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          owner_id?: string | null
          search_text?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          attachments?: Json | null
          category_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          owner_id?: string | null
          search_text?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sop_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_articles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sop_update_suggestions: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          suggested_by: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggested_by: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_update_suggestions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "sop_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_update_suggestions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_update_suggestions_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_approvals: {
        Row: {
          approved_at: string
          approved_by: string
          created_at: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          can_edit_academy: boolean | null
          can_see_financials: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          last_login: string | null
          page_permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_edit_academy?: boolean | null
          can_see_financials?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          last_login?: string | null
          page_permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_edit_academy?: boolean | null
          can_see_financials?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          last_login?: string | null
          page_permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_client_lock: { Args: { p_client_id: string }; Returns: undefined }
      acquire_invoice_number_lock: { Args: never; Returns: undefined }
      apply_modification_request: {
        Args: { p_applied_by?: string; p_request_id: string }
        Returns: Json
      }
      approve_extra_work_by_token: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      approve_modification_request: {
        Args: { p_request_id: string; p_reviewed_by: string }
        Returns: {
          client_approved_at: string | null
          client_brand_name: string | null
          client_email: string | null
          client_id: string
          client_name: string
          created_at: string
          effective_from: string | null
          engagement_assignment_id: string | null
          engagement_id: string
          engagement_name: string
          engagement_service_id: string | null
          id: string
          note: string | null
          proposed_changes: Json
          rejection_reason: string | null
          request_type: Database["public"]["Enums"]["modification_request_type"]
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["modification_request_status"]
          updated_at: string
          upgrade_offer_token: string | null
          upgrade_offer_valid_until: string | null
          upsell_commission_percent: number | null
          upsold_by_id: string | null
          upsold_by_name: string | null
        }
        SetofOptions: {
          from: "*"
          to: "modification_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_edit_page: { Args: { page_name: string }; Returns: boolean }
      can_see_financials: { Args: { _user_id: string }; Returns: boolean }
      can_view_page: { Args: { page_name: string }; Returns: boolean }
      check_can_see_financials: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_has_crm_access: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_is_admin_or_management: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_is_super_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      client_accept_modification: {
        Args: { p_client_email: string; p_token: string }
        Returns: Json
      }
      convert_lead_to_client: {
        Args: {
          p_additional_contacts?: Json
          p_assignments?: Json
          p_client_data: Json
          p_engagement_data: Json
          p_lead_id: string
          p_primary_contact: Json
          p_services?: Json
        }
        Returns: Json
      }
      create_admin_notification: {
        Args: {
          p_exclude_user_id?: string
          p_link?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      create_creative_boost_share: {
        Args: { p_client_month_id: string }
        Returns: string
      }
      create_invoice_with_items:
        | {
            Args: {
              p_client_id: string
              p_client_name: string
              p_currency: string
              p_engagement_id: string
              p_engagement_name: string
              p_extra_work_ids?: string[]
              p_issued_by: string
              p_line_items: Json
              p_month: number
              p_one_off_service_ids?: string[]
              p_total_amount: number
              p_year: number
            }
            Returns: {
              client_id: string | null
              client_name: string | null
              created_at: string | null
              currency: string
              engagement_id: string | null
              engagement_name: string | null
              fakturoid_id: string | null
              fakturoid_url: string | null
              id: string
              invoice_number: string
              issued_at: string
              issued_by: string | null
              line_items: Json | null
              month: number
              paid_at: string | null
              status: string | null
              total_amount: number
              year: number
            }
            SetofOptions: {
              from: "*"
              to: "issued_invoices"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_client_id: string
              p_client_name: string
              p_creative_boost_client_month_ids?: string[]
              p_currency: string
              p_engagement_id: string
              p_engagement_name: string
              p_extra_work_ids?: string[]
              p_issued_by: string
              p_line_items: Json
              p_month: number
              p_one_off_service_ids?: string[]
              p_total_amount: number
              p_year: number
            }
            Returns: {
              client_id: string | null
              client_name: string | null
              created_at: string | null
              currency: string
              engagement_id: string | null
              engagement_name: string | null
              fakturoid_id: string | null
              fakturoid_url: string | null
              id: string
              invoice_number: string
              issued_at: string
              issued_by: string | null
              line_items: Json | null
              month: number
              paid_at: string | null
              status: string | null
              total_amount: number
              year: number
            }
            SetofOptions: {
              from: "*"
              to: "issued_invoices"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      days_in_month: {
        Args: { p_month: number; p_year: number }
        Returns: number
      }
      generate_invoice_number: { Args: { p_year?: number }; Returns: string }
      get_colleague_id: { Args: { _user_id: string }; Returns: string }
      get_creative_boost_share_by_token: {
        Args: { p_token: string }
        Returns: {
          brand_name: string
          client_name: string
          id: string
          is_active: boolean
          max_credits: number
          month: number
          outputs: Json
          price_per_credit: number
          token: string
          valid_until: string
          year: number
        }[]
      }
      get_extra_work_by_approval_token: {
        Args: { p_token: string }
        Returns: {
          amount: number
          client_approved_at: string
          client_name: string
          client_rejected_at: string
          client_rejection_reason: string
          colleague_name: string
          currency: string
          description: string
          engagement_name: string
          hourly_rate: number
          hours_worked: number
          id: string
          name: string
          status: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_crm_access: { Args: { _user_id: string }; Returns: boolean }
      has_full_client_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      increment_offer_view: {
        Args: { offer_token: string }
        Returns: undefined
      }
      increment_sop_view_count: {
        Args: { article_id: string }
        Returns: undefined
      }
      is_admin_or_management: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin_bypass_rls: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_user_super_admin: { Args: never; Returns: boolean }
      is_user_super_admin_v2: { Args: never; Returns: boolean }
      is_valid_email_format: { Args: { email: string }; Returns: boolean }
      log_applicant_change: {
        Args: {
          _applicant_id: string
          _change_type: Database["public"]["Enums"]["applicant_change_type"]
          _field_label?: string
          _field_name?: string
          _new_value?: string
          _old_value?: string
        }
        Returns: undefined
      }
      log_client_change: {
        Args: {
          _change_type: Database["public"]["Enums"]["client_change_type"]
          _client_id: string
          _field_label?: string
          _field_name?: string
          _new_value?: string
          _old_value?: string
        }
        Returns: undefined
      }
      log_engagement_change: {
        Args: {
          _change_type: Database["public"]["Enums"]["engagement_change_type"]
          _engagement_id: string
          _field_label?: string
          _field_name?: string
          _new_value?: string
          _old_value?: string
          _related_entity_id?: string
          _related_entity_name?: string
        }
        Returns: undefined
      }
      log_extra_work_change: {
        Args: {
          _change_type: Database["public"]["Enums"]["extra_work_change_type"]
          _extra_work_id: string
          _field_label?: string
          _field_name?: string
          _new_value?: string
          _old_value?: string
        }
        Returns: undefined
      }
      log_lead_change: {
        Args: {
          _change_type: Database["public"]["Enums"]["lead_change_type"]
          _field_label?: string
          _field_name?: string
          _lead_id: string
          _new_value?: string
          _old_value?: string
        }
        Returns: undefined
      }
      log_meeting_change: {
        Args: {
          _change_type: Database["public"]["Enums"]["meeting_change_type"]
          _field_label?: string
          _field_name?: string
          _meeting_id: string
          _new_value?: string
          _old_value?: string
        }
        Returns: undefined
      }
      reject_extra_work_by_token: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_reason: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      release_invoice_number_lock: { Args: never; Returns: undefined }
      restore_engagement: {
        Args: { p_engagement_id: string }
        Returns: undefined
      }
      set_contact_as_primary: { Args: { p_contact_id: string }; Returns: Json }
      soft_delete_client: { Args: { p_client_id: string }; Returns: undefined }
      soft_delete_contact: { Args: { p_contact_id: string }; Returns: Json }
      soft_delete_engagement: {
        Args: { p_engagement_id: string }
        Returns: undefined
      }
      soft_delete_extra_work: {
        Args: { p_extra_work_id: string }
        Returns: undefined
      }
      try_set_fakturoid_subject_id: {
        Args: { p_client_id: string; p_fakturoid_subject_id: number }
        Returns: {
          existing_subject_id: number
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "management"
        | "project_manager"
        | "specialist"
        | "finance"
        | "client"
      applicant_change_type:
        | "created"
        | "stage_change"
        | "field_update"
        | "note_added"
        | "converted"
        | "deleted"
      applicant_source:
        | "website"
        | "linkedin"
        | "referral"
        | "job_portal"
        | "other"
      applicant_stage:
        | "new_applicant"
        | "invited_interview"
        | "interview_done"
        | "offer_sent"
        | "hired"
        | "rejected"
        | "withdrawn"
      attendance_status: "pending" | "confirmed" | "declined" | "attended"
      billing_model: "fixed_fee" | "spend_based" | "hybrid"
      client_change_type:
        | "created"
        | "status_change"
        | "tier_change"
        | "field_update"
        | "contact_added"
        | "contact_removed"
        | "deleted"
      client_status: "lead" | "active" | "paused" | "lost" | "potential"
      client_tier: "standard" | "gold" | "platinum" | "diamond"
      colleague_status: "active" | "on_hold" | "left"
      cost_model: "hourly" | "fixed_monthly" | "percentage"
      engagement_change_type:
        | "created"
        | "status_change"
        | "field_update"
        | "service_added"
        | "service_removed"
        | "service_updated"
        | "colleague_assigned"
        | "colleague_removed"
        | "colleague_updated"
        | "end_date_set"
        | "deleted"
      engagement_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      engagement_type: "retainer" | "one_off" | "internal"
      extra_work_change_type:
        | "created"
        | "status_change"
        | "invoiced"
        | "field_update"
        | "deleted"
      extra_work_status:
        | "pending_approval"
        | "in_progress"
        | "ready_to_invoice"
        | "invoiced"
        | "rejected"
      feedback_category:
        | "process"
        | "service"
        | "communication"
        | "system"
        | "other"
      feedback_status:
        | "new"
        | "in_review"
        | "accepted"
        | "rejected"
        | "implemented"
      invoice_status: "draft" | "ready" | "issued" | "paid"
      lead_change_type:
        | "created"
        | "stage_change"
        | "field_update"
        | "owner_change"
        | "note_added"
        | "converted"
      lead_source:
        | "referral"
        | "inbound"
        | "cold_outreach"
        | "event"
        | "linkedin"
        | "website"
        | "other"
      lead_stage:
        | "new_lead"
        | "meeting_done"
        | "waiting_access"
        | "access_received"
        | "preparing_offer"
        | "offer_sent"
        | "won"
        | "lost"
        | "postponed"
      line_item_source:
        | "engagement"
        | "manual"
        | "creative_boost"
        | "extra_work"
        | "one_off"
      meeting_change_type:
        | "created"
        | "status_change"
        | "rescheduled"
        | "cancelled"
        | "field_update"
        | "participant_added"
        | "participant_removed"
        | "deleted"
      meeting_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      meeting_task_priority: "low" | "medium" | "high"
      meeting_task_status: "todo" | "in_progress" | "done"
      meeting_type: "internal" | "client"
      modification_request_status:
        | "pending"
        | "approved"
        | "client_approved"
        | "applied"
        | "rejected"
      modification_request_type:
        | "add_service"
        | "update_service_price"
        | "deactivate_service"
        | "add_assignment"
        | "update_assignment"
        | "remove_assignment"
      month_status: "active" | "inactive"
      notification_type:
        | "new_lead"
        | "form_completed"
        | "contract_signed"
        | "lead_converted"
        | "access_granted"
        | "offer_sent"
        | "colleague_birthday"
        | "new_feedback_idea"
      one_off_invoicing_status: "not_applicable" | "pending" | "invoiced"
      output_category:
        | "banner"
        | "banner_translation"
        | "banner_revision"
        | "ai_photo"
        | "video"
        | "video_translation"
        | "video_revision"
      participant_role: "organizer" | "required" | "optional"
      seniority: "junior" | "mid" | "senior" | "partner"
      service_category:
        | "performance"
        | "creative"
        | "lead_gen"
        | "analytics"
        | "consulting"
      service_tier: "growth" | "pro" | "elite"
      service_type: "core" | "addon"
      settings_change_type:
        | "max_credits"
        | "price_per_credit"
        | "status"
        | "colleague"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "admin",
        "management",
        "project_manager",
        "specialist",
        "finance",
        "client",
      ],
      applicant_change_type: [
        "created",
        "stage_change",
        "field_update",
        "note_added",
        "converted",
        "deleted",
      ],
      applicant_source: [
        "website",
        "linkedin",
        "referral",
        "job_portal",
        "other",
      ],
      applicant_stage: [
        "new_applicant",
        "invited_interview",
        "interview_done",
        "offer_sent",
        "hired",
        "rejected",
        "withdrawn",
      ],
      attendance_status: ["pending", "confirmed", "declined", "attended"],
      billing_model: ["fixed_fee", "spend_based", "hybrid"],
      client_change_type: [
        "created",
        "status_change",
        "tier_change",
        "field_update",
        "contact_added",
        "contact_removed",
        "deleted",
      ],
      client_status: ["lead", "active", "paused", "lost", "potential"],
      client_tier: ["standard", "gold", "platinum", "diamond"],
      colleague_status: ["active", "on_hold", "left"],
      cost_model: ["hourly", "fixed_monthly", "percentage"],
      engagement_change_type: [
        "created",
        "status_change",
        "field_update",
        "service_added",
        "service_removed",
        "service_updated",
        "colleague_assigned",
        "colleague_removed",
        "colleague_updated",
        "end_date_set",
        "deleted",
      ],
      engagement_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      engagement_type: ["retainer", "one_off", "internal"],
      extra_work_change_type: [
        "created",
        "status_change",
        "invoiced",
        "field_update",
        "deleted",
      ],
      extra_work_status: [
        "pending_approval",
        "in_progress",
        "ready_to_invoice",
        "invoiced",
        "rejected",
      ],
      feedback_category: [
        "process",
        "service",
        "communication",
        "system",
        "other",
      ],
      feedback_status: [
        "new",
        "in_review",
        "accepted",
        "rejected",
        "implemented",
      ],
      invoice_status: ["draft", "ready", "issued", "paid"],
      lead_change_type: [
        "created",
        "stage_change",
        "field_update",
        "owner_change",
        "note_added",
        "converted",
      ],
      lead_source: [
        "referral",
        "inbound",
        "cold_outreach",
        "event",
        "linkedin",
        "website",
        "other",
      ],
      lead_stage: [
        "new_lead",
        "meeting_done",
        "waiting_access",
        "access_received",
        "preparing_offer",
        "offer_sent",
        "won",
        "lost",
        "postponed",
      ],
      line_item_source: [
        "engagement",
        "manual",
        "creative_boost",
        "extra_work",
        "one_off",
      ],
      meeting_change_type: [
        "created",
        "status_change",
        "rescheduled",
        "cancelled",
        "field_update",
        "participant_added",
        "participant_removed",
        "deleted",
      ],
      meeting_status: ["scheduled", "in_progress", "completed", "cancelled"],
      meeting_task_priority: ["low", "medium", "high"],
      meeting_task_status: ["todo", "in_progress", "done"],
      meeting_type: ["internal", "client"],
      modification_request_status: [
        "pending",
        "approved",
        "client_approved",
        "applied",
        "rejected",
      ],
      modification_request_type: [
        "add_service",
        "update_service_price",
        "deactivate_service",
        "add_assignment",
        "update_assignment",
        "remove_assignment",
      ],
      month_status: ["active", "inactive"],
      notification_type: [
        "new_lead",
        "form_completed",
        "contract_signed",
        "lead_converted",
        "access_granted",
        "offer_sent",
        "colleague_birthday",
        "new_feedback_idea",
      ],
      one_off_invoicing_status: ["not_applicable", "pending", "invoiced"],
      output_category: [
        "banner",
        "banner_translation",
        "banner_revision",
        "ai_photo",
        "video",
        "video_translation",
        "video_revision",
      ],
      participant_role: ["organizer", "required", "optional"],
      seniority: ["junior", "mid", "senior", "partner"],
      service_category: [
        "performance",
        "creative",
        "lead_gen",
        "analytics",
        "consulting",
      ],
      service_tier: ["growth", "pro", "elite"],
      service_type: ["core", "addon"],
      settings_change_type: [
        "max_credits",
        "price_per_credit",
        "status",
        "colleague",
      ],
    },
  },
} as const
