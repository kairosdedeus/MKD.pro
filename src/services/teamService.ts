import { supabase } from '@/lib/supabaseClient'
import { TeamFormData, Team, TeamType, TeamFunction } from '@/types'

// Normaliza os membros para que functions seja um array plano
function normalizeTeam(team: any): Team {
  return {
    ...team,
    members: (team.members || []).map((m: any) => ({
      ...m,
      functions: (m.functions || []).map((f: any) => f.function).filter(Boolean),
    })),
  }
}

export const teamService = {
  async getTeamTypes() {
    const { data, error } = await supabase
      .from('team_types')
      .select('*')
      .order('nome')

    if (error) throw error
    return data as TeamType[]
  },

  async getTeams(teamTypeCode?: string) {
    // 1. Buscar equipes
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_type:team_types (*),
        leader:users_profile (*)
      `)
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    if (!teams || teams.length === 0) return []

    console.log('Teams encontradas:', teams.length, teams.map(t => t.nome))

    // 2. Buscar membros de todas as equipes
    const teamIds = teams.map(t => t.id)
    const { data: allMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `)
      .in('team_id', teamIds)

    if (membersError) console.error('Erro ao buscar membros:', membersError)
    console.log('Membros encontrados:', allMembers?.length, allMembers)

    // 3. Montar resultado
    const result = teams.map(team => ({
      ...team,
      members: (allMembers || [])
        .filter(m => m.team_id === team.id)
        .map(m => ({
          ...m,
          functions: (m.functions || []).map((f: any) => f.function).filter(Boolean),
        })),
    }))

    console.log('Resultado final:', result.map(t => ({ nome: t.nome, membros: t.members?.length })))

    // 4. Filtrar por tipo se necessário
    if (teamTypeCode) {
      return result.filter(t => t.team_type?.codigo === teamTypeCode) as Team[]
    }

    return result as Team[]
  },

  async getTeamById(id: string) {
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_type:team_types (*),
        leader:users_profile (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Buscar membros separadamente
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `)
      .eq('team_id', id)
      .order('created_at')

    return {
      ...team,
      members: (members || []).map(m => ({
        ...m,
        functions: (m.functions || []).map((f: any) => f.function).filter(Boolean),
      })),
    } as Team
  },

  async createTeam(teamData: TeamFormData) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        nome: teamData.nome,
        team_type_id: teamData.team_type_id,
        leader_id: teamData.leader_id || null,
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Montar lista de membros: líder, quando houver, + membros selecionados (sem duplicatas)
    const allMemberIds = Array.from(
      new Set([teamData.leader_id, ...teamData.member_ids].filter(Boolean))
    )

    console.log('Criando equipe:', team.id, 'com membros:', allMemberIds)

    if (allMemberIds.length > 0) {
      const members = allMemberIds.map((userId) => ({
        team_id: team.id,
        user_id: userId,
        ativo: true,
      }))

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(members)

      if (membersError) {
        console.error('Erro ao inserir membros:', membersError)
        throw membersError
      }

      console.log('Membros inseridos com sucesso:', allMemberIds.length)
    }

    return team
  },

  async updateTeam(teamId: string, teamData: Partial<TeamFormData>) {
    const updatePayload: { nome?: string; leader_id?: string | null } = {}
    if (teamData.nome !== undefined) updatePayload.nome = teamData.nome
    if ('leader_id' in teamData) updatePayload.leader_id = teamData.leader_id || null

    const { data, error } = await supabase
      .from('teams')
      .update(updatePayload)
      .eq('id', teamId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async addMember(teamId: string, userId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
  },

  async getTeamMembers(teamId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `)
      .eq('team_id', teamId)
      .eq('ativo', true)
      .order('created_at')

    if (error) throw error

    // Normalizar funções para o formato esperado
    return (data || []).map((m: any) => ({
      ...m,
      functions: m.functions?.map((f: any) => f.function).filter(Boolean) || [],
    }))
  },

  async getTeamFunctions(teamTypeId: string) {
    const { data, error } = await supabase
      .from('team_functions')
      .select('*')
      .eq('team_type_id', teamTypeId)
      .order('nome')

    if (error) throw error
    return data as TeamFunction[]
  },

  async updateMemberFunctions(memberId: string, functionIds: string[]) {
    // Remover funções existentes
    await supabase
      .from('team_member_functions')
      .delete()
      .eq('team_member_id', memberId)

    // Adicionar novas funções
    if (functionIds.length > 0) {
      const functions = functionIds.map((functionId) => ({
        team_member_id: memberId,
        function_id: functionId,
      }))

      const { error } = await supabase
        .from('team_member_functions')
        .insert(functions)

      if (error) throw error
    }
  },

  async deactivateTeam(teamId: string) {
    const { data, error } = await supabase
      .from('teams')
      .update({ ativo: false })
      .eq('id', teamId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
