import { supabase } from '@/lib/supabaseClient'

export interface WorshipFixedTeamMemberInput {
  team_member_id: string
  function_ids: string[]
}

export interface WorshipFixedTeamMember {
  id: string
  preset_id: string
  team_member_id: string
  function_id: string
  sort_order: number
}

export interface WorshipFixedTeam {
  id: string
  team_id: string
  nome: string
  ativo: boolean
  members: WorshipFixedTeamMember[]
}

function isMissingTableError(error: any) {
  return error?.code === '42P01' || String(error?.message || '').includes('worship_fixed_teams')
}

export const worshipFixedTeamService = {
  async getByTeamId(teamId: string): Promise<WorshipFixedTeam[]> {
    const { data, error } = await (supabase as any)
      .from('worship_fixed_teams')
      .select(`
        *,
        members:worship_fixed_team_members (*)
      `)
      .eq('team_id', teamId)
      .eq('ativo', true)
      .order('nome')

    if (error) {
      if (isMissingTableError(error)) return []
      throw error
    }

    return (data || []).map((preset: any) => ({
      ...preset,
      members: (preset.members || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))
  },

  async create(teamId: string, nome: string, members: WorshipFixedTeamMemberInput[]) {
    const { data: preset, error: presetError } = await (supabase as any)
      .from('worship_fixed_teams')
      .insert({
        team_id: teamId,
        nome: nome.trim(),
      })
      .select()
      .single()

    if (presetError) {
      if (isMissingTableError(presetError)) {
        throw new Error('Execute o script supabase/utils/criar-equipes-fixas-louvor.sql no Supabase antes de salvar equipes fixas.')
      }
      throw presetError
    }

    const rows = members.flatMap((member, memberIndex) =>
      member.function_ids.map((functionId) => ({
        preset_id: preset.id,
        team_member_id: member.team_member_id,
        function_id: functionId,
        sort_order: memberIndex,
      }))
    )

    if (rows.length > 0) {
      const { error: membersError } = await (supabase as any)
        .from('worship_fixed_team_members')
        .insert(rows)

      if (membersError) throw membersError
    }

    return preset
  },

  async update(presetId: string, nome: string, members: WorshipFixedTeamMemberInput[]) {
    const { error: presetError } = await (supabase as any)
      .from('worship_fixed_teams')
      .update({ nome: nome.trim() })
      .eq('id', presetId)

    if (presetError) throw presetError

    const { error: deleteError } = await (supabase as any)
      .from('worship_fixed_team_members')
      .delete()
      .eq('preset_id', presetId)

    if (deleteError) throw deleteError

    const rows = members.flatMap((member, memberIndex) =>
      member.function_ids.map((functionId) => ({
        preset_id: presetId,
        team_member_id: member.team_member_id,
        function_id: functionId,
        sort_order: memberIndex,
      }))
    )

    if (rows.length > 0) {
      const { error: membersError } = await (supabase as any)
        .from('worship_fixed_team_members')
        .insert(rows)

      if (membersError) throw membersError
    }
  },

  async delete(presetId: string) {
    const { error } = await (supabase as any)
      .from('worship_fixed_teams')
      .delete()
      .eq('id', presetId)

    if (error) throw error
  },
}
