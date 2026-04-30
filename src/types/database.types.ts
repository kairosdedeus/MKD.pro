export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          auth_user_id: string | null
          nome: string
          email: string
          telefone: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          nome: string
          email: string
          telefone?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          nome?: string
          email?: string
          telefone?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          nome: string
          codigo: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      team_types: {
        Row: {
          id: string
          nome: string
          codigo: string
          permite_multiplas: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          permite_multiplas?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          permite_multiplas?: boolean
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          nome: string
          team_type_id: string
          leader_id: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          team_type_id: string
          leader_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          team_type_id?: string
          leader_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          ativo?: boolean
          created_at?: string
        }
      }
      team_functions: {
        Row: {
          id: string
          nome: string
          team_type_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          team_type_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          team_type_id?: string
          created_at?: string
        }
      }
      team_member_functions: {
        Row: {
          id: string
          team_member_id: string
          function_id: string
          created_at: string
        }
        Insert: {
          id?: string
          team_member_id: string
          function_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_member_id?: string
          function_id?: string
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          team_id: string
          date: string
          title: string | null
          notes: string | null
          status: string
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          date: string
          title?: string | null
          notes?: string | null
          status?: string
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          date?: string
          title?: string | null
          notes?: string | null
          status?: string
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule_members: {
        Row: {
          id: string
          schedule_id: string
          team_member_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          team_member_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          team_member_id?: string
          notes?: string | null
          created_at?: string
        }
      }
      schedule_member_functions: {
        Row: {
          id: string
          schedule_member_id: string
          function_id: string
          created_at: string
        }
        Insert: {
          id?: string
          schedule_member_id: string
          function_id: string
          created_at?: string
        }
        Update: {
          id?: string
          schedule_member_id?: string
          function_id?: string
          created_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          name: string
          artist: string | null
          original_key: string | null
          reference_url: string | null
          audio_path: string | null
          has_virtual_instruments: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          artist?: string | null
          original_key?: string | null
          reference_url?: string | null
          audio_path?: string | null
          has_virtual_instruments?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          artist?: string | null
          original_key?: string | null
          reference_url?: string | null
          audio_path?: string | null
          has_virtual_instruments?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule_songs: {
        Row: {
          id: string
          schedule_id: string
          song_id: string
          original_key: string | null
          execution_key: string | null
          order_index: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          song_id: string
          original_key?: string | null
          execution_key?: string | null
          order_index: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          song_id?: string
          original_key?: string | null
          execution_key?: string | null
          order_index?: number
          notes?: string | null
          created_at?: string
        }
      }
      cells: {
        Row: {
          id: string
          name: string
          leader_id: string | null
          address: string | null
          weekday: string | null
          meeting_time: string | null
          notes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          leader_id?: string | null
          address?: string | null
          weekday?: string | null
          meeting_time?: string | null
          notes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          leader_id?: string | null
          address?: string | null
          weekday?: string | null
          meeting_time?: string | null
          notes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cell_members: {
        Row: {
          id: string
          cell_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          cell_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          cell_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      cell_meetings: {
        Row: {
          id: string
          cell_id: string
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cell_id: string
          date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cell_id?: string
          date?: string
          notes?: string | null
          created_at?: string
        }
      }
      cell_attendance: {
        Row: {
          id: string
          cell_meeting_id: string
          user_id: string
          present: boolean
          created_at: string
        }
        Insert: {
          id?: string
          cell_meeting_id: string
          user_id: string
          present?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          cell_meeting_id?: string
          user_id?: string
          present?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_gerencial: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_team_leader: {
        Args: { team_uuid: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_uuid: string }
        Returns: boolean
      }
      is_cell_leader: {
        Args: { cell_uuid: string }
        Returns: boolean
      }
      create_user_with_auth: {
        Args: {
          p_nome: string
          p_email: string
          p_password: string
          p_telefone?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
