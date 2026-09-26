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
        Row: { id: string; name: string; domain: string } & Timestamps;
        Insert: { id?: string; name: string; domain: string; created_at?: string };
        Update: { id?: string; name?: string; domain?: string; created_at?: string };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          university_id: string;
          code: string;
          name: string;
          description: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          university_id: string;
          code: string;
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
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          content: string;
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
        Row: { id: string; course_id: string; name: string } & Timestamps;
        Insert: { id?: string; course_id: string; name: string; created_at?: string };
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
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
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
