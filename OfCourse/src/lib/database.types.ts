// Types for the Supabase schema in supabase/migrations.
// Hand-written to match the Phase 1 migration. Once a Supabase project is
// linked, regenerate with:  npm run db:types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string };

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: { id: string; name: string; short_name: string | null; domain: string } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          domain: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["universities"]["Insert"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          university_id: string;
          code: string;
          slug: string;
          name: string;
          description: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          university_id: string;
          code: string;
          slug: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "courses_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      course_units: {
        Row: { id: string; course_id: string; position: number; name: string };
        Insert: { id?: string; course_id: string; position: number; name: string };
        Update: Partial<Database["public"]["Tables"]["course_units"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "course_units_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string; course_id: string; title: string };
        Update: { title?: string; updated_at?: string };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant";
          content: string;
          sources: Json;
          status: "answer" | "no_results";
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          role: "user" | "assistant";
          content: string;
          sources?: Json;
          status?: "answer" | "no_results";
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      comment_votes: {
        Row: { comment_id: string; user_id: string; value: number; created_at: string };
        Insert: { comment_id: string; user_id: string; value: number };
        Update: { value?: number };
        Relationships: [];
      };
      majors: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      post_embeddings: {
        Row: {
          post_id: string;
          course_id: string;
          // pgvector values come back from the API as a string like "[0.1,...]".
          embedding: string;
          model: string;
          content_hash: string;
          updated_at: string;
        };
        Insert: {
          post_id: string;
          course_id: string;
          embedding: string | number[];
          model: string;
          content_hash: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_embeddings"]["Insert"]>;
        Relationships: [];
      };
      ai_search_log: {
        Row: {
          id: number;
          user_id: string;
          course_id: string | null;
          question: string;
          source_count: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          course_id?: string | null;
          question: string;
          source_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["ai_search_log"]["Insert"]>;
        Relationships: [];
      };
      course_ratings: {
        Row: {
          user_id: string;
          course_id: string;
          workload_hours: number;
          difficulty: number;
          would_take_again: boolean;
          semester: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          workload_hours: number;
          difficulty: number;
          would_take_again: boolean;
          semester?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["course_ratings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "course_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_ratings_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          username: string | null;
          university_id: string | null;
          major: string | null;
          grad_year: number | null;
          bio: string | null;
          avatar_url: string | null;
          verified: boolean;
          verified_at: string | null;
          terms_accepted_at: string | null;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id: string;
          name?: string | null;
          username?: string | null;
          university_id?: string | null;
          major?: string | null;
          grad_year?: number | null;
          bio?: string | null;
          avatar_url?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      course_members: {
        Row: {
          user_id: string;
          course_id: string;
          semester: string | null;
          joined_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          semester?: string | null;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "course_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_members_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          course_id: string;
          author_id: string;
          title: string;
          content: string;
          type: Database["public"]["Enums"]["post_type"];
          semester: string | null;
          integrity_attested_at: string;
          vote_score: number;
          comment_count: number;
          hot_score: number;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          course_id: string;
          author_id: string;
          title: string;
          content?: string;
          type?: Database["public"]["Enums"]["post_type"];
          semester?: string | null;
          integrity_attested_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "posts_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_comment_id: string | null;
          content: string;
          deleted_at: string | null;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          content: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: { id: string; post_id: string; user_id: string; value: number } & Timestamps;
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          value: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["votes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: { user_id: string; post_id: string } & Timestamps;
        Insert: { user_id: string; post_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: { id: string; course_id: string; name: string; unit_id: string | null } & Timestamps;
        Insert: {
          id?: string;
          course_id: string;
          name: string;
          unit_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["topics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "topics_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      post_topics: {
        Row: { post_id: string; topic_id: string };
        Insert: { post_id: string; topic_id: string };
        Update: Partial<Database["public"]["Tables"]["post_topics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "post_topics_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      course_rating_stats: {
        Row: {
          course_id: string;
          rating_count: number;
          avg_workload_hours: number;
          avg_difficulty: number;
          would_take_again_pct: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      claim_university_verification: { Args: never; Returns: string | null };
      can_participate: { Args: { p_course_id: string }; Returns: boolean };
      post_course_id: { Args: { p_post_id: string }; Returns: string | null };
      comment_course_id: { Args: { p_comment_id: string }; Returns: string | null };
      accept_terms: { Args: never; Returns: string | null };
      university_for_email: { Args: { email: string }; Returns: string | null };
      match_course_posts: {
        Args: { query_embedding: string | number[]; p_course_id: string; match_count?: number };
        Returns: { post_id: string; similarity: number }[];
      };
    };
    Enums: {
      post_type:
        | "note"
        | "study_guide"
        | "explanation"
        | "advice"
        | "experience"
        | "discussion"
        | "resource";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
