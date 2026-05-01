export * from './database.types'

// Tipos de perfis
export type ProfileCode =
  | 'gerencial'
  | 'lider_louvor'
  | 'lider_danca'
  | 'lider_obreiros'
  | 'lider_midia'
  | 'lider_celula'
  | 'auxiliar_celula'
  | 'membro_louvor'
  | 'membro_danca'
  | 'membro_obreiro'
  | 'membro_midia'
  | 'membro_celula'

// Tipos de equipe
export type TeamTypeCode = 'louvor' | 'danca' | 'obreiros' | 'midia' | 'celula'

// Status de escala
export type ScheduleStatus = 'draft' | 'published' | 'completed'

// Tipos estendidos com relacionamentos
export interface UserProfile {
  id: string
  auth_user_id: string | null
  nome: string
  email: string
  telefone: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  profiles?: Profile[]
}

export interface Profile {
  id: string
  nome: string
  codigo: ProfileCode
  created_at: string
}

export interface UserProfileWithProfiles extends UserProfile {
  user_profiles: {
    profile: Profile
  }[]
}

export interface TeamType {
  id: string
  nome: string
  codigo: TeamTypeCode
  permite_multiplas: boolean
  created_at: string
}

export interface Team {
  id: string
  nome: string
  team_type_id: string
  leader_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  team_type?: TeamType
  leader?: UserProfile
  members?: TeamMember[]
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  ativo: boolean
  created_at: string
  user?: UserProfile
  functions?: TeamFunction[]
}

export interface TeamFunction {
  id: string
  nome: string
  team_type_id: string
  created_at: string
}

export interface Schedule {
  id: string
  team_id: string
  date: string
  title: string | null
  notes: string | null
  status: ScheduleStatus
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  team?: Team
  members?: ScheduleMember[]
  songs?: ScheduleSong[]
}

export interface ScheduleMember {
  id: string
  schedule_id: string
  team_member_id: string
  notes: string | null
  created_at: string
  team_member?: TeamMember
  functions?: TeamFunction[]
}

export interface Song {
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

export interface ScheduleSong {
  id: string
  schedule_id: string
  song_id: string
  original_key: string | null
  execution_key: string | null
  order_index: number
  notes: string | null
  created_at: string
  song?: Song
}

export interface Cell {
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
  leader?: UserProfile
  members?: CellMember[]
}

export interface CellMember {
  id: string
  cell_id: string
  user_id: string
  role: 'lider' | 'auxiliar' | 'membro'
  created_at: string
  user?: UserProfile
}

export interface CellMeeting {
  id: string
  cell_id: string
  date: string
  notes: string | null
  created_at: string
  attendance?: CellAttendance[]
}

export interface CellAttendance {
  id: string
  cell_meeting_id: string
  user_id: string
  present: boolean
  created_at: string
  user?: UserProfile
}

// Tipos para contexto de usuário
export interface UserContext {
  user: UserProfile
  profiles: Profile[]
  currentProfile: Profile | null
}

// Tipos para formulários
export interface LoginFormData {
  email: string
  password: string
}

export interface UserFormData {
  nome: string
  email: string
  telefone?: string
  password?: string
  profiles: string[]
}

export interface TeamFormData {
  nome: string
  team_type_id: string
  leader_id: string | null
  member_ids: string[]
}

export interface ScheduleFormData {
  team_id: string
  date: string
  title?: string
  notes?: string
  status: ScheduleStatus
  members: {
    team_member_id: string
    function_ids: string[]
    notes?: string
  }[]
  songs?: {
    song_id: string
    execution_key?: string
    order_index: number
    notes?: string
  }[]
}

export interface SongFormData {
  name: string
  artist?: string
  original_key?: string
  reference_url?: string
  audio_file?: File
  has_virtual_instruments: boolean
  notes?: string
}

export interface CellFormData {
  name: string
  leader_id: string
  address?: string
  weekday?: string
  meeting_time?: string
  notes?: string
  member_ids: string[]
  auxiliar_ids: string[]
}

// Tipos para dashboard
export interface DashboardStats {
  total_users: number
  total_teams: number
  total_schedules_month: number
  upcoming_schedules: Schedule[]
  most_scheduled_members: {
    user: UserProfile
    count: number
  }[]
  members_without_schedule: UserProfile[]
  schedules_by_ministry: {
    ministry: string
    count: number
  }[]
  incomplete_schedules: Schedule[]
  schedule_conflicts: {
    user: UserProfile
    schedules: Schedule[]
  }[]
}

// Tipos para permissões
export interface PermissionCheck {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}
