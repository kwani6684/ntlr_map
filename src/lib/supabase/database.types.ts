export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          password_hash: string;
          profile_image_url: string | null;
          instagram_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          password_hash: string;
          profile_image_url?: string | null;
          instagram_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          profile_image_url?: string | null;
          instagram_id?: string | null;
        };
      };
      routes: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          creator_id: string;
          is_public: boolean;
          today_type: "다른하루" | "낯선하루";
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          creator_id: string;
          is_public?: boolean;
          today_type: "다른하루" | "낯선하루";
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          creator_id?: string;
          is_public?: boolean;
          today_type?: "다른하루" | "낯선하루";
        };
      };
      places: {
        Row: {
          id: string;
          created_at: string;
          route_id: string;
          place_name: string;
          address: string;
          latitude: number;
          longitude: number;
          kakao_place_id: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          route_id: string;
          place_name: string;
          address: string;
          latitude: number;
          longitude: number;
          kakao_place_id?: string | null;
          order_index: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          route_id?: string;
          place_name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          kakao_place_id?: string | null;
          order_index?: number;
        };
      };
      place_descriptions: {
        Row: {
          id: string;
          created_at: string;
          place_id: string;
          content: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          place_id: string;
          content: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          place_id?: string;
          content?: Json;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
