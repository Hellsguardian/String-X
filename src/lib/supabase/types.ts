/**
 * Supabase Database Types definition
 */

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
      profiles: {
        Row: {
          id: string;
          user_code?: string;
          user_id?: string;
          phone?: string;
          college_name?: string;
          hostel?: string | null;
          full_name: string;
          gender: string;
          birth_year?: number | null;
          age?: number;
          university_id?: string | null;
          hostel_id?: string | null;
          course_id?: string | null;
          study_year?: string | null;
          home_state?: string | null;
          college_year?: string;
          department?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          instagram_id?: string | null;
          photo_url?: string | null;
          additional_photos?: string[] | null;
          face_verification_photo?: string | null;
          face_verification_path?: string | null;
          face_verified_at?: string | null;
          is_face_verified?: boolean;
          verification_status?: string;
          verification_rejection_reason?: string | null;
          is_premium?: boolean;
          premium_started_at?: string | null;
          premium_expires_at?: string | null;
          onboarding_status?: string;
          onboarding_step?: number;
          is_profile_completed?: boolean;
          is_onboarding_completed?: boolean;
          garba_level?: string | null;
          garba_level_title?: string | null;
          garba_energy?: string | null;
          navratri_vibes?: string[] | null;
          interests?: string[] | null;
          favourite_evening_spot?: string | null;
          navratri_excitement?: number | null;
          partner_gender_preference?: string | null;
          partner_vibe_preference?: string | null;
          answer_last_round?: string | null;
          answer_personality?: string | null;
          answer_partner_new_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      deleted_accounts: {
        Row: Database['public']['Tables']['profiles']['Row'] & {
          deleted_at: string;
        };
        Insert: Partial<Database['public']['Tables']['deleted_accounts']['Row']>;
        Update: Partial<Database['public']['Tables']['deleted_accounts']['Row']>;
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          bucket_id: string;
          storage_path: string;
          is_primary: boolean;
          display_order: number;
          upload_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profile_photos']['Row']>;
        Update: Partial<Database['public']['Tables']['profile_photos']['Row']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          tagline: string;
          short_desc: string;
          category: string;
          emoji: string;
          date: string;
          location: string;
          joined_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          answers: Json;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['event_participants']['Row']> & {
          event_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['event_participants']['Row']>;
      };
      matches: {
        Row: {
          id: string;
          event_id: string;
          user_a_id: string;
          user_b_id: string;
          compatibility_score: number;
          status: 'pending' | 'revealed' | 'connected';
          shared_highlights: string[] | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['matches']['Row']>;
        Update: Partial<Database['public']['Tables']['matches']['Row']>;
      };
    };
  };
}
