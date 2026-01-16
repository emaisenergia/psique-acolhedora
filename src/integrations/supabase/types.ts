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
  public: {
    Tables: {
      activities: {
        Row: {
          assigned_by: string | null
          attachment_name: string | null
          attachment_url: string | null
          completed_at: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          due_date: string | null
          feedback_at: string | null
          feedback_thread: Json | null
          id: string
          patient_id: string
          patient_responses: Json | null
          psychologist_feedback: string | null
          response_history: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          completed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          feedback_at?: string | null
          feedback_thread?: Json | null
          id?: string
          patient_id: string
          patient_responses?: Json | null
          psychologist_feedback?: string | null
          response_history?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          completed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          feedback_at?: string | null
          feedback_thread?: Json | null
          id?: string
          patient_id?: string
          patient_responses?: Json | null
          psychologist_feedback?: string | null
          response_history?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_preferences: {
        Row: {
          allow_online_booking: boolean | null
          available_days: string[] | null
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          default_session_duration: number | null
          email_notifications: boolean | null
          id: string
          language: string | null
          reminder_hours_before: number | null
          session_interval: number | null
          session_reminders: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          allow_online_booking?: boolean | null
          available_days?: string[] | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          default_session_duration?: number | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          reminder_hours_before?: number | null
          session_interval?: number | null
          session_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          allow_online_booking?: boolean | null
          available_days?: string[] | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          default_session_duration?: number | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          reminder_hours_before?: number | null
          session_interval?: number | null
          session_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          bio: string | null
          created_at: string
          credential: string | null
          id: string
          name: string
          phone: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credential?: string | null
          id?: string
          name: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          credential?: string | null
          id?: string
          name?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          patient_id: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id?: string | null
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_favorite_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          last_used_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_knowledge_documents: {
        Row: {
          category: string | null
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          block_reason: string | null
          created_at: string
          date_time: string
          duration_minutes: number
          id: string
          meeting_url: string | null
          mode: string
          notes: string | null
          package_id: string | null
          patient_id: string | null
          payment_type: string | null
          payment_value: number | null
          psychologist_id: string | null
          service: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string | null
          block_reason?: string | null
          created_at?: string
          date_time: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          mode?: string
          notes?: string | null
          package_id?: string | null
          patient_id?: string | null
          payment_type?: string | null
          payment_value?: number | null
          psychologist_id?: string | null
          service?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string | null
          block_reason?: string | null
          created_at?: string
          date_time?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          mode?: string
          notes?: string | null
          package_id?: string | null
          patient_id?: string | null
          payment_type?: string | null
          payment_value?: number | null
          psychologist_id?: string | null
          service?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "session_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      file_tags: {
        Row: {
          bucket_id: string
          color: string | null
          created_at: string
          created_by: string | null
          file_path: string
          id: string
          tag: string
        }
        Insert: {
          bucket_id: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          file_path: string
          id?: string
          tag: string
        }
        Update: {
          bucket_id?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          notes: string | null
          revenue_goal: number
          sessions_goal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          revenue_goal?: number
          sessions_goal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          revenue_goal?: number
          sessions_goal?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          clinic: string | null
          created_at: string
          description: string | null
          id: string
          is_confirmed: boolean
          notes: string | null
          patient_id: string | null
          payment_method: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          clinic?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          clinic?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          coverage_percentage: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          id: string
          mood: string
          note: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          note: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          note?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string
          id: string
          insurance_id: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email: string
          id?: string
          insurance_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string
          id?: string
          insurance_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          day_of_month: number
          description: string | null
          id: string
          is_active: boolean
          last_generated_month: string | null
          notes: string | null
          payment_method: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          day_of_month?: number
          description?: string | null
          id?: string
          is_active?: boolean
          last_generated_month?: string | null
          notes?: string | null
          payment_method?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          day_of_month?: number
          description?: string | null
          id?: string
          is_active?: boolean
          last_generated_month?: string | null
          notes?: string | null
          payment_method?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      secure_messages: {
        Row: {
          author: string
          author_user_id: string | null
          content: string
          created_at: string
          id: string
          patient_id: string
          read: boolean
          urgent: boolean
        }
        Insert: {
          author: string
          author_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          patient_id: string
          read?: boolean
          urgent?: boolean
        }
        Update: {
          author?: string
          author_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          read?: boolean
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "secure_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      session_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changed_fields: Json | null
          id: string
          session_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          changed_fields?: Json | null
          id?: string
          session_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changed_fields?: Json | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          is_recording: boolean | null
          session_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          is_recording?: boolean | null
          session_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_recording?: boolean | null
          session_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_packages: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          price: number
          price_per_session: number | null
          start_date: string | null
          status: string
          total_sessions: number
          updated_at: string
          used_sessions: number
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          price?: number
          price_per_session?: number | null
          start_date?: string | null
          status?: string
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          price?: number
          price_per_session?: number | null
          start_date?: string | null
          status?: string
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ai_generated_summary: string | null
          ai_insights: Json | null
          appointment_id: string | null
          cancellation_reason: string | null
          clinical_observations: string | null
          created_at: string
          created_by: string | null
          detailed_notes: string | null
          duration_minutes: number | null
          id: string
          patient_id: string
          psychologist_id: string | null
          recurring_themes: Json | null
          session_date: string
          status: string
          summary: string | null
          transcription: string | null
          treatment_goals: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_generated_summary?: string | null
          ai_insights?: Json | null
          appointment_id?: string | null
          cancellation_reason?: string | null
          clinical_observations?: string | null
          created_at?: string
          created_by?: string | null
          detailed_notes?: string | null
          duration_minutes?: number | null
          id?: string
          patient_id: string
          psychologist_id?: string | null
          recurring_themes?: Json | null
          session_date?: string
          status?: string
          summary?: string | null
          transcription?: string | null
          treatment_goals?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_generated_summary?: string | null
          ai_insights?: Json | null
          appointment_id?: string | null
          cancellation_reason?: string | null
          clinical_observations?: string | null
          created_at?: string
          created_by?: string | null
          detailed_notes?: string | null
          duration_minutes?: number | null
          id?: string
          patient_id?: string
          psychologist_id?: string | null
          recurring_themes?: Json | null
          session_date?: string
          status?: string
          summary?: string | null
          transcription?: string | null
          treatment_goals?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      treatment_plan_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          treatment_plan_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          treatment_plan_id: string
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          treatment_plan_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_versions_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          approaches: string[] | null
          created_at: string
          created_by: string | null
          current_progress: number | null
          current_status: string | null
          current_status_notes: string | null
          discharge_objectives: Json | null
          estimated_sessions: number | null
          goal_results: Json | null
          id: string
          improvements: Json | null
          is_shared_with_patient: boolean
          last_review_date: string | null
          long_term_goals: Json | null
          next_review_date: string | null
          notes: string | null
          objectives: Json | null
          patient_id: string
          short_term_goals: Json | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approaches?: string[] | null
          created_at?: string
          created_by?: string | null
          current_progress?: number | null
          current_status?: string | null
          current_status_notes?: string | null
          discharge_objectives?: Json | null
          estimated_sessions?: number | null
          goal_results?: Json | null
          id?: string
          improvements?: Json | null
          is_shared_with_patient?: boolean
          last_review_date?: string | null
          long_term_goals?: Json | null
          next_review_date?: string | null
          notes?: string | null
          objectives?: Json | null
          patient_id: string
          short_term_goals?: Json | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approaches?: string[] | null
          created_at?: string
          created_by?: string | null
          current_progress?: number | null
          current_status?: string | null
          current_status_notes?: string | null
          discharge_objectives?: Json | null
          estimated_sessions?: number | null
          goal_results?: Json | null
          id?: string
          improvements?: Json | null
          is_shared_with_patient?: boolean
          last_review_date?: string | null
          long_term_goals?: Json | null
          next_review_date?: string | null
          notes?: string | null
          objectives?: Json | null
          patient_id?: string
          short_term_goals?: Json | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "psychologist" | "patient"
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
      app_role: ["admin", "psychologist", "patient"],
    },
  },
} as const
