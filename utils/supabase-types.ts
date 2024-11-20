export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: {
          p_usename: string
        }
        Returns: {
          username: string
          password: string
        }[]
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
      actions: {
        Row: {
          bill_type: string | null
          cache_updated_at: string | null
          chamber: string
          congress: number | null
          created_at: string
          id: string
          introduced_at: string | null
          level: string
          number: number | null
          official_title: string | null
          popular_title: string | null
          session_id: number
          short_title: string | null
          source_url: string | null
          sponsor_id: string | null
          sponsor_type: string | null
          state: string | null
          status: string | null
          status_at: string | null
          summary: Json | null
          tags: string[] | null
          top_tag: string | null
          type: string
        }
        Insert: {
          bill_type?: string | null
          cache_updated_at?: string | null
          chamber?: string
          congress?: number | null
          created_at?: string
          id: string
          introduced_at?: string | null
          level?: string
          number?: number | null
          official_title?: string | null
          popular_title?: string | null
          session_id: number
          short_title?: string | null
          source_url?: string | null
          sponsor_id?: string | null
          sponsor_type?: string | null
          state?: string | null
          status?: string | null
          status_at?: string | null
          summary?: Json | null
          tags?: string[] | null
          top_tag?: string | null
          type?: string
        }
        Update: {
          bill_type?: string | null
          cache_updated_at?: string | null
          chamber?: string
          congress?: number | null
          created_at?: string
          id?: string
          introduced_at?: string | null
          level?: string
          number?: number | null
          official_title?: string | null
          popular_title?: string | null
          session_id?: number
          short_title?: string | null
          source_url?: string | null
          sponsor_id?: string | null
          sponsor_type?: string | null
          state?: string | null
          status?: string | null
          status_at?: string | null
          summary?: Json | null
          tags?: string[] | null
          top_tag?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "current_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_amendments: {
        Row: {
          action_id: string
          cache_updated_at: string | null
          chamber: string | null
          congress: number | null
          created_at: string
          description: string | null
          id: string
          introduced_at: string | null
          number: number | null
          sponsor_id: string | null
          status: string | null
          status_at: string | null
          type: string | null
        }
        Insert: {
          action_id: string
          cache_updated_at?: string | null
          chamber?: string | null
          congress?: number | null
          created_at?: string
          description?: string | null
          id: string
          introduced_at?: string | null
          number?: number | null
          sponsor_id?: string | null
          status?: string | null
          status_at?: string | null
          type?: string | null
        }
        Update: {
          action_id?: string
          cache_updated_at?: string | null
          chamber?: string | null
          congress?: number | null
          created_at?: string
          description?: string | null
          id?: string
          introduced_at?: string | null
          number?: number | null
          sponsor_id?: string | null
          status?: string | null
          status_at?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_amendments_action_id_fkey"
            columns: ["action_id"]
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_amendments_sponsor_id_fkey"
            columns: ["sponsor_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_cosponsors: {
        Row: {
          action_id: string
          original_cosponsor: boolean | null
          rep_id: string
          sponsored_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          action_id: string
          original_cosponsor?: boolean | null
          rep_id: string
          sponsored_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          action_id?: string
          original_cosponsor?: boolean | null
          rep_id?: string
          sponsored_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_cosponsors_action_id_fkey"
            columns: ["action_id"]
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_cosponsors_rep_id_fkey"
            columns: ["rep_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      db_updates: {
        Row: {
          error_data: Json | null
          last_run: string | null
          last_success: string | null
          result_data: Json | null
          script_id: string
          status: string | null
        }
        Insert: {
          error_data?: Json | null
          last_run?: string | null
          last_success?: string | null
          result_data?: Json | null
          script_id: string
          status?: string | null
        }
        Update: {
          error_data?: Json | null
          last_run?: string | null
          last_success?: string | null
          result_data?: Json | null
          script_id?: string
          status?: string | null
        }
        Relationships: []
      }
      rep_votes: {
        Row: {
          rep_id: string
          vote: string
          vote_id: string
        }
        Insert: {
          rep_id: string
          vote: string
          vote_id?: string
        }
        Update: {
          rep_id?: string
          vote?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rep_votes_rep_id_fkey"
            columns: ["rep_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_votes_vote_id_fkey"
            columns: ["vote_id"]
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      representatives: {
        Row: {
          created_at: string
          first_name: string
          full_name: string
          govtrack_id: string | null
          homepage: string | null
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string
          first_name?: string
          full_name?: string
          govtrack_id?: string | null
          homepage?: string | null
          id: string
          last_name?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          full_name?: string
          govtrack_id?: string | null
          homepage?: string | null
          id?: string
          last_name?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          chamber: string | null
          congress: number | null
          end_date: string | null
          id: number
          level: string
          start_date: string | null
          state: string | null
          title: string | null
        }
        Insert: {
          chamber?: string | null
          congress?: number | null
          end_date?: string | null
          id?: number
          level: string
          start_date?: string | null
          state?: string | null
          title?: string | null
        }
        Update: {
          chamber?: string | null
          congress?: number | null
          end_date?: string | null
          id?: number
          level?: string
          start_date?: string | null
          state?: string | null
          title?: string | null
        }
        Relationships: []
      }
      terms: {
        Row: {
          district: number | null
          party: string | null
          rep_id: string
          session_id: number
          state: string | null
        }
        Insert: {
          district?: number | null
          party?: string | null
          rep_id: string
          session_id: number
          state?: string | null
        }
        Update: {
          district?: number | null
          party?: string | null
          rep_id?: string
          session_id?: number
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_rep_id_fkey"
            columns: ["rep_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "current_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          action_id: string
          alternate_id: string | null
          cache_updated_at: string | null
          chamber: string | null
          congress: number | null
          created_at: string
          date: string | null
          id: string
          number: number | null
          question: string | null
          requires: string | null
          result: string | null
          session: number | null
          type: string | null
        }
        Insert: {
          action_id: string
          alternate_id?: string | null
          cache_updated_at?: string | null
          chamber?: string | null
          congress?: number | null
          created_at?: string
          date?: string | null
          id?: string
          number?: number | null
          question?: string | null
          requires?: string | null
          result?: string | null
          session?: number | null
          type?: string | null
        }
        Update: {
          action_id?: string
          alternate_id?: string | null
          cache_updated_at?: string | null
          chamber?: string | null
          congress?: number | null
          created_at?: string
          date?: string | null
          id?: string
          number?: number | null
          question?: string | null
          requires?: string | null
          result?: string | null
          session?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_action_id_fkey"
            columns: ["action_id"]
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_session_fkey"
            columns: ["session"]
            referencedRelation: "current_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_session_fkey"
            columns: ["session"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_reps: {
        Row: {
          chamber: string | null
          congress: number | null
          district: number | null
          full_name: string | null
          level: string | null
          party: string | null
          rep_id: string | null
          session_id: number | null
          state: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_rep_id_fkey"
            columns: ["rep_id"]
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "current_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      current_sessions: {
        Row: {
          chamber: string | null
          congress: number | null
          end_date: string | null
          id: number | null
          level: string | null
          start_date: string | null
          state: string | null
          title: string | null
        }
        Insert: {
          chamber?: string | null
          congress?: number | null
          end_date?: string | null
          id?: number | null
          level?: string | null
          start_date?: string | null
          state?: string | null
          title?: string | null
        }
        Update: {
          chamber?: string | null
          congress?: number | null
          end_date?: string | null
          id?: number | null
          level?: string | null
          start_date?: string | null
          state?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
