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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
          dic: string | null
          end_date: string | null
          ico: string | null
          id: string
          industry: string | null
          main_contact_email: string | null
          main_contact_name: string | null
          main_contact_phone: string | null
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
          dic?: string | null
          end_date?: string | null
          ico?: string | null
          id?: string
          industry?: string | null
          main_contact_email?: string | null
          main_contact_name?: string | null
          main_contact_phone?: string | null
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
          dic?: string | null
          end_date?: string | null
          ico?: string | null
          id?: string
          industry?: string | null
          main_contact_email?: string | null
          main_contact_name?: string | null
          main_contact_phone?: string | null
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
          capacity_hours_per_month: number | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          internal_hourly_cost: number | null
          is_freelancer: boolean | null
          monthly_fixed_cost: number | null
          notes: string | null
          phone: string | null
          position: string
          profile_id: string | null
          seniority: Database["public"]["Enums"]["seniority"]
          status: Database["public"]["Enums"]["colleague_status"] | null
          updated_at: string | null
        }
        Insert: {
          capacity_hours_per_month?: number | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          internal_hourly_cost?: number | null
          is_freelancer?: boolean | null
          monthly_fixed_cost?: number | null
          notes?: string | null
          phone?: string | null
          position: string
          profile_id?: string | null
          seniority?: Database["public"]["Enums"]["seniority"]
          status?: Database["public"]["Enums"]["colleague_status"] | null
          updated_at?: string | null
        }
        Update: {
          capacity_hours_per_month?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          internal_hourly_cost?: number | null
          is_freelancer?: boolean | null
          monthly_fixed_cost?: number | null
          notes?: string | null
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
          role_on_engagement: string | null
          start_date: string | null
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
          role_on_engagement?: string | null
          start_date?: string | null
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
          role_on_engagement?: string | null
          start_date?: string | null
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
      engagement_services: {
        Row: {
          billing_type: string | null
          created_at: string | null
          creative_boost_max_credits: number | null
          creative_boost_min_credits: number | null
          creative_boost_price_per_credit: number | null
          currency: string | null
          engagement_id: string
          id: string
          invoice_id: string | null
          invoiced_at: string | null
          invoiced_in_period: string | null
          invoicing_status: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          price: number | null
          selected_tier: Database["public"]["Enums"]["service_tier"] | null
          service_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_type?: string | null
          created_at?: string | null
          creative_boost_max_credits?: number | null
          creative_boost_min_credits?: number | null
          creative_boost_price_per_credit?: number | null
          currency?: string | null
          engagement_id: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          invoiced_in_period?: string | null
          invoicing_status?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          price?: number | null
          selected_tier?: Database["public"]["Enums"]["service_tier"] | null
          service_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_type?: string | null
          created_at?: string | null
          creative_boost_max_credits?: number | null
          creative_boost_min_credits?: number | null
          creative_boost_price_per_credit?: number | null
          currency?: string | null
          engagement_id?: string
          id?: string
          invoice_id?: string | null
          invoiced_at?: string | null
          invoiced_in_period?: string | null
          invoicing_status?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          price?: number | null
          selected_tier?: Database["public"]["Enums"]["service_tier"] | null
          service_id?: string | null
          updated_at?: string | null
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
            foreignKeyName: "engagement_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          currency: string | null
          end_date: string | null
          freelo_url: string | null
          id: string
          monthly_fee: number | null
          name: string
          notes: string | null
          notice_period_months: number | null
          offer_url: string | null
          one_off_fee: number | null
          platforms: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["engagement_status"] | null
          type: Database["public"]["Enums"]["engagement_type"]
          updated_at: string | null
        }
        Insert: {
          billing_model?: Database["public"]["Enums"]["billing_model"]
          client_id: string
          contact_person_id?: string | null
          contract_url?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          freelo_url?: string | null
          id?: string
          monthly_fee?: number | null
          name: string
          notes?: string | null
          notice_period_months?: number | null
          offer_url?: string | null
          one_off_fee?: number | null
          platforms?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["engagement_status"] | null
          type?: Database["public"]["Enums"]["engagement_type"]
          updated_at?: string | null
        }
        Update: {
          billing_model?: Database["public"]["Enums"]["billing_model"]
          client_id?: string
          contact_person_id?: string | null
          contract_url?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          freelo_url?: string | null
          id?: string
          monthly_fee?: number | null
          name?: string
          notes?: string | null
          notice_period_months?: number | null
          offer_url?: string | null
          one_off_fee?: number | null
          platforms?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["engagement_status"] | null
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
      extra_works: {
        Row: {
          amount: number
          approval_date: string | null
          approved_by: string | null
          billing_period: string
          client_id: string
          colleague_id: string
          created_at: string | null
          currency: string | null
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
          work_date: string
        }
        Insert: {
          amount: number
          approval_date?: string | null
          approved_by?: string | null
          billing_period: string
          client_id: string
          colleague_id: string
          created_at?: string | null
          currency?: string | null
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
          work_date: string
        }
        Update: {
          amount?: number
          approval_date?: string | null
          approved_by?: string | null
          billing_period?: string
          client_id?: string
          colleague_id?: string
          created_at?: string | null
          currency?: string | null
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
        ]
      }
      issued_invoices: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          engagement_id: string | null
          engagement_name: string | null
          fakturoid_id: string | null
          fakturoid_url: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          issued_by: string | null
          line_items: Json | null
          month: number
          total_amount: number
          year: number
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          engagement_id?: string | null
          engagement_name?: string | null
          fakturoid_id?: string | null
          fakturoid_url?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          issued_by?: string | null
          line_items?: Json | null
          month: number
          total_amount: number
          year: number
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          engagement_id?: string | null
          engagement_name?: string | null
          fakturoid_id?: string | null
          fakturoid_url?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          issued_by?: string | null
          line_items?: Json | null
          month?: number
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
          created_at: string | null
          created_by: string | null
          currency: string | null
          dic: string | null
          estimated_price: number | null
          ico: string | null
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
          owner_id: string | null
          potential_service: string | null
          potential_services: Json | null
          probability_percent: number | null
          source: Database["public"]["Enums"]["lead_source"] | null
          source_custom: string | null
          stage: Database["public"]["Enums"]["lead_stage"] | null
          summary: string | null
          updated_at: string | null
          updated_by: string | null
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
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          dic?: string | null
          estimated_price?: number | null
          ico?: string | null
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
          owner_id?: string | null
          potential_service?: string | null
          potential_services?: Json | null
          probability_percent?: number | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          dic?: string | null
          estimated_price?: number | null
          ico?: string | null
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
          owner_id?: string | null
          potential_service?: string | null
          potential_services?: Json | null
          probability_percent?: number | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          source_custom?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "colleagues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          category: Database["public"]["Enums"]["service_category"]
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          external_url: string | null
          id: string
          is_active: boolean | null
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          tier_pricing: Json | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          service_type?: Database["public"]["Enums"]["service_type"]
          tier_pricing?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          tier_pricing?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_super_admin: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_crm_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "management"
        | "project_manager"
        | "specialist"
        | "finance"
      billing_model: "fixed_fee" | "spend_based" | "hybrid"
      client_status: "lead" | "active" | "paused" | "lost" | "potential"
      client_tier: "standard" | "gold" | "platinum" | "diamond"
      colleague_status: "active" | "on_hold" | "left"
      cost_model: "hourly" | "fixed_monthly" | "percentage"
      engagement_status:
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      engagement_type: "retainer" | "one_off" | "internal"
      extra_work_status:
        | "pending_approval"
        | "in_progress"
        | "ready_to_invoice"
        | "invoiced"
      invoice_status: "draft" | "ready" | "issued" | "paid"
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
      seniority: "junior" | "mid" | "senior" | "partner"
      service_category:
        | "performance"
        | "creative"
        | "lead_gen"
        | "analytics"
        | "consulting"
      service_tier: "growth" | "pro" | "elite"
      service_type: "core" | "addon"
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
      app_role: [
        "admin",
        "management",
        "project_manager",
        "specialist",
        "finance",
      ],
      billing_model: ["fixed_fee", "spend_based", "hybrid"],
      client_status: ["lead", "active", "paused", "lost", "potential"],
      client_tier: ["standard", "gold", "platinum", "diamond"],
      colleague_status: ["active", "on_hold", "left"],
      cost_model: ["hourly", "fixed_monthly", "percentage"],
      engagement_status: [
        "planned",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      engagement_type: ["retainer", "one_off", "internal"],
      extra_work_status: [
        "pending_approval",
        "in_progress",
        "ready_to_invoice",
        "invoiced",
      ],
      invoice_status: ["draft", "ready", "issued", "paid"],
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
    },
  },
} as const
