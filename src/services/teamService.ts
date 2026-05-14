import { supabase } from "@/lib/supabaseClient";
import { TeamFormData, Team, TeamType, TeamFunction } from "@/types";

export const teamService = {
  async getTeamTypes() {
    const { data, error } = await supabase
      .from("team_types")
      .select("*")
      .order("nome");

    if (error) throw error;
    return data as TeamType[];
  },

  async getTeams(teamTypeCode?: string) {
    // 1. Buscar equipes
    const { data: teams, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        team_type:team_types (*),
        leader:users_profile (*)
      `,
      )
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;
    if (!teams || teams.length === 0) return [];

    // 2. Buscar membros de todas as equipes
    const teamIds = teams.map((t) => t.id);
    const { data: allMembers, error: membersError } = await supabase
      .from("team_members")
      .select(
        `
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `,
      )
      .in("team_id", teamIds)
      .eq("ativo", true);

    if (membersError) console.error("Erro ao buscar membros:", membersError);

    // 3. Montar resultado
    const result = teams.map((team) => ({
      ...team,
      members: (allMembers || [])
        .filter((m) => m.team_id === team.id)
        .map((m) => ({
          ...m,
          functions: (m.functions || [])
            .map((f: any) => f.function)
            .filter(Boolean),
        })),
    }));

    // 4. Filtrar por tipo se necessário
    if (teamTypeCode) {
      return result.filter(
        (t) => t.team_type?.codigo === teamTypeCode,
      ) as Team[];
    }

    return result as Team[];
  },

  async getTeamById(id: string) {
    const { data: team, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        team_type:team_types (*),
        leader:users_profile (*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Buscar membros separadamente
    const { data: members } = await supabase
      .from("team_members")
      .select(
        `
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `,
      )
      .eq("team_id", id)
      .eq("ativo", true)
      .order("created_at");

    return {
      ...team,
      members: (members || []).map((m) => ({
        ...m,
        functions: (m.functions || [])
          .map((f: any) => f.function)
          .filter(Boolean),
      })),
    } as Team;
  },

  async createTeam(teamData: TeamFormData) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        nome: teamData.nome,
        team_type_id: teamData.team_type_id,
        leader_id: teamData.leader_id || null,
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Montar lista de membros: líder, quando houver, + membros selecionados (sem duplicatas)
    const allMemberIds = Array.from(
      new Set([teamData.leader_id, ...teamData.member_ids].filter(Boolean)),
    );

    if (allMemberIds.length > 0) {
      const members = allMemberIds.map((userId) => ({
        team_id: team.id,
        user_id: userId,
        ativo: true,
      }));

      const { error: membersError } = await supabase
        .from("team_members")
        .insert(members);

      if (membersError) {
        console.error("Erro ao inserir membros:", membersError);
        throw membersError;
      }
    }

    return team;
  },

  async updateTeam(teamId: string, teamData: Partial<TeamFormData>) {
    const updatePayload: { nome?: string; leader_id?: string | null } = {};
    if (teamData.nome !== undefined) updatePayload.nome = teamData.nome;
    if ("leader_id" in teamData)
      updatePayload.leader_id = teamData.leader_id || null;

    const { data, error } = await supabase
      .from("teams")
      .update(updatePayload)
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addMember(teamId: string, userId: string) {
    const { data, error } = await supabase
      .from("team_members")
      .upsert(
        {
          team_id: teamId,
          user_id: userId,
          ativo: true,
        },
        { onConflict: "team_id,user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from("team_members")
      .update({ ativo: false })
      .eq("id", memberId);

    if (error) throw error;
  },

  async getTeamMembers(teamId: string) {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
        *,
        user:users_profile (*),
        functions:team_member_functions (
          function:team_functions (*)
        )
      `,
      )
      .eq("team_id", teamId)
      .eq("ativo", true)
      .order("created_at");

    if (error) throw error;

    // Normalizar funções para o formato esperado
    return (data || []).map((m: any) => ({
      ...m,
      functions: m.functions?.map((f: any) => f.function).filter(Boolean) || [],
    }));
  },

  async getTeamFunctions(teamTypeId: string) {
    const { data, error } = await supabase
      .from("team_functions")
      .select("*")
      .eq("team_type_id", teamTypeId)
      .order("nome");

    if (error) throw error;
    return data as TeamFunction[];
  },

  async updateMemberFunctions(memberId: string, functionIds: string[]) {
    // Remover funções existentes
    await supabase
      .from("team_member_functions")
      .delete()
      .eq("team_member_id", memberId);

    // Adicionar novas funções
    if (functionIds.length > 0) {
      const functions = functionIds.map((functionId) => ({
        team_member_id: memberId,
        function_id: functionId,
      }));

      const { error } = await supabase
        .from("team_member_functions")
        .insert(functions);

      if (error) throw error;
    }
  },

  async deactivateTeam(teamId: string) {
    const { data, error } = await supabase
      .from("teams")
      .update({ ativo: false })
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
