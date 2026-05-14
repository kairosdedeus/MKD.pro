import { supabase } from "@/lib/supabaseClient";
import { ScheduleFormData } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { notificationService } from "@/services/notificationService";

/**
 * Service para gerenciamento de escalas ministeriais.
 *
 * Responsabilidades:
 * - CRUD de escalas (criar, ler, atualizar, deletar)
 * - Gerenciamento de membros e funções nas escalas
 * - Gerenciamento de músicas nas escalas
 * - Detecção de conflitos de agenda
 * - Consultas por período e tipo de equipe
 *
 * @module scheduleService
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const SCHEDULE_SELECT_QUERY = `
  *,
  team:teams (*),
  members:schedule_members (
    *,
    team_member:team_members (
      *,
      user:users_profile (*)
    ),
    functions:schedule_member_functions (
      function:team_functions (*)
    )
  ),
  songs:schedule_songs (
    *,
    song:songs (*)
  )
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normaliza as funções dos membros da escala.
 * Extrai o objeto 'function' de cada item e remove valores nulos.
 */
function normalizeMemberFunctions(members: any[]): any[] {
  return (members || []).map((member) => ({
    ...member,
    functions: (member.functions || [])
      .map((f: any) => f.function)
      .filter(Boolean),
  }));
}

/**
 * Obtém o ID do usuário autenticado no sistema.
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: authData } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase
    .from("users_profile")
    .select("id")
    .eq("auth_user_id", authData.user?.id)
    .single();

  return userProfile?.id || null;
}

/**
 * Formata datas para o formato ISO (YYYY-MM-DD).
 */
function formatDateToISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function safelyNotify(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.warn("Não foi possível registrar notificação de escala:", error);
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export const scheduleService = {
  /**
   * Busca todas as escalas de uma equipe em um mês específico.
   *
   * @param teamId - ID da equipe
   * @param date - Data de referência (qualquer dia do mês)
   * @returns Array de escalas com membros, funções e músicas
   */
  async getSchedulesByMonth(teamId: string, date: Date) {
    const start = formatDateToISO(startOfMonth(date));
    const end = formatDateToISO(endOfMonth(date));

    const { data, error } = await supabase
      .from("schedules")
      .select(SCHEDULE_SELECT_QUERY)
      .eq("team_id", teamId)
      .gte("date", start)
      .lte("date", end)
      .order("date");

    if (error) throw error;

    return (data || []).map((schedule: any) => ({
      ...schedule,
      members: normalizeMemberFunctions(schedule.members),
    }));
  },

  /**
   * Busca uma escala específica por equipe e data.
   *
   * @param teamId - ID da equipe
   * @param date - Data da escala (formato YYYY-MM-DD)
   * @returns Escala encontrada ou null
   */
  async getScheduleByDate(teamId: string, date: string) {
    const { data, error } = await supabase
      .from("schedules")
      .select(SCHEDULE_SELECT_QUERY)
      .eq("team_id", teamId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      members: normalizeMemberFunctions(data.members),
    };
  },

  /**
   * Cria uma nova escala com membros, funções e músicas.
   *
   * @param scheduleData - Dados da escala a ser criada
   * @returns Escala criada
   * @throws Error se já existir escala para a equipe na data
   */
  async createSchedule(scheduleData: ScheduleFormData) {
    const userId = await getCurrentUserId();

    // Criar escala
    const schedule = await this._insertSchedule(scheduleData, userId);

    // Adicionar membros e funções
    if (scheduleData.members.length > 0) {
      await this._insertScheduleMembers(schedule.id, scheduleData.members);
    }

    // Adicionar músicas
    if (scheduleData.songs && scheduleData.songs.length > 0) {
      await this._insertScheduleSongs(schedule.id, scheduleData.songs);
    }

    await safelyNotify(() =>
      notificationService.notifyScheduleCreated(schedule.id),
    );

    return schedule;
  },

  /**
   * Insere os dados básicos da escala no banco.
   * @private
   */
  async _insertSchedule(scheduleData: ScheduleFormData, userId: string | null) {
    const { data: schedule, error } = await supabase
      .from("schedules")
      .insert({
        team_id: scheduleData.team_id,
        date: scheduleData.date,
        title: scheduleData.title,
        notes: scheduleData.notes,
        status: scheduleData.status,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `Já existe uma escala para esta equipe no dia ${scheduleData.date}. Edite a escala existente ou escolha outra data.`,
        );
      }
      throw error;
    }

    return schedule;
  },

  /**
   * Insere membros e suas funções na escala.
   * @private
   */
  async _insertScheduleMembers(
    scheduleId: string,
    members: ScheduleFormData["members"],
  ) {
    for (const member of members) {
      const { data: scheduleMember, error: memberError } = await supabase
        .from("schedule_members")
        .insert({
          schedule_id: scheduleId,
          team_member_id: member.team_member_id,
          notes: member.notes,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Adicionar funções do membro
      if (member.function_ids.length > 0) {
        await this._insertMemberFunctions(
          scheduleMember.id,
          member.function_ids,
        );
      }
    }
  },

  /**
   * Insere as funções de um membro na escala.
   * @private
   */
  async _insertMemberFunctions(
    scheduleMemberId: string,
    functionIds: string[],
  ) {
    const functions = functionIds.map((functionId) => ({
      schedule_member_id: scheduleMemberId,
      function_id: functionId,
    }));

    const { error } = await supabase
      .from("schedule_member_functions")
      .insert(functions);

    if (error) throw error;
  },

  /**
   * Insere músicas na escala.
   * @private
   */
  async _insertScheduleSongs(
    scheduleId: string,
    songs: NonNullable<ScheduleFormData["songs"]>,
  ) {
    const songsData = songs.map((song) => ({
      schedule_id: scheduleId,
      song_id: song.song_id,
      execution_key: song.execution_key,
      order_index: song.order_index,
      notes: song.notes,
    }));

    const { error } = await supabase.from("schedule_songs").insert(songsData);

    if (error) throw error;
  },

  /**
   * Atualiza uma escala existente.
   * Remove e recria membros e músicas para garantir consistência.
   *
   * @param scheduleId - ID da escala a ser atualizada
   * @param scheduleData - Dados parciais para atualização
   * @returns Escala atualizada
   */
  async updateSchedule(
    scheduleId: string,
    scheduleData: Partial<ScheduleFormData>,
  ) {
    const userId = await getCurrentUserId();
    const previousSchedule =
      await notificationService.getScheduleSnapshot(scheduleId);

    // Atualizar dados básicos
    const schedule = await this._updateScheduleBasicData(
      scheduleId,
      scheduleData,
      userId,
    );

    // Atualizar membros (deletar e reinserir)
    if (scheduleData.members !== undefined) {
      await this._deleteScheduleMembers(scheduleId);
      await this._insertScheduleMembers(scheduleId, scheduleData.members);
    }

    // Atualizar músicas (deletar e reinserir)
    if (scheduleData.songs !== undefined) {
      await this._deleteScheduleSongs(scheduleId);
      if (scheduleData.songs.length > 0) {
        await this._insertScheduleSongs(scheduleId, scheduleData.songs);
      }
    }

    await safelyNotify(() =>
      notificationService.notifyScheduleUpdated(
        scheduleId,
        previousSchedule?.status,
      ),
    );

    return schedule;
  },

  /**
   * Atualiza os dados básicos da escala (título, status, data, notas).
   * @private
   */
  async _updateScheduleBasicData(
    scheduleId: string,
    scheduleData: Partial<ScheduleFormData>,
    userId: string | null,
  ) {
    const updateData: any = {
      title: scheduleData.title,
      status: scheduleData.status,
      date: scheduleData.date,
      updated_by: userId,
    };

    // Incluir notes explicitamente, mesmo se for null
    if (scheduleData.notes !== undefined) {
      updateData.notes = scheduleData.notes;
    }

    const { data, error } = await supabase
      .from("schedules")
      .update(updateData)
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove todos os membros e suas funções de uma escala.
   * @private
   */
  async _deleteScheduleMembers(scheduleId: string) {
    // Buscar IDs dos membros para deletar suas funções
    const { data: existingMembers } = await supabase
      .from("schedule_members")
      .select("id")
      .eq("schedule_id", scheduleId);

    if (existingMembers && existingMembers.length > 0) {
      const memberIds = existingMembers.map((m) => m.id);
      await supabase
        .from("schedule_member_functions")
        .delete()
        .in("schedule_member_id", memberIds);
    }

    await supabase
      .from("schedule_members")
      .delete()
      .eq("schedule_id", scheduleId);
  },

  /**
   * Remove todas as músicas de uma escala.
   * @private
   */
  async _deleteScheduleSongs(scheduleId: string) {
    await supabase
      .from("schedule_songs")
      .delete()
      .eq("schedule_id", scheduleId);
  },

  /**
   * Deleta uma escala e todos os seus relacionamentos.
   * Os relacionamentos são deletados automaticamente via CASCADE no banco.
   *
   * @param scheduleId - ID da escala a ser deletada
   */
  async deleteSchedule(scheduleId: string) {
    const schedule = await notificationService.getScheduleSnapshot(scheduleId);

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;

    if (schedule) {
      await safelyNotify(() =>
        notificationService.notifyScheduleDeleted(schedule),
      );
    }
  },

  /**
   * Verifica conflitos de agenda para um usuário em uma data específica.
   *
   * @param userId - ID do usuário
   * @param date - Data para verificar conflitos
   * @returns Array de escalas onde o usuário já está escalado
   */
  async checkConflicts(userId: string, date: string) {
    const { data, error } = await supabase
      .from("schedule_members")
      .select(
        `
        *,
        schedule:schedules!inner (
          date,
          team:teams (nome)
        ),
        team_member:team_members!inner (
          user_id
        )
      `,
      )
      .eq("team_member.user_id", userId)
      .eq("schedule.date", date);

    if (error) throw error;
    return data;
  },

  /**
   * Verifica conflitos de escala para múltiplos membros numa data.
   * Retorna um mapa: user_id -> nome da equipe onde já está escalado.
   *
   * @param userIds - Array de IDs de usuários para verificar
   * @param date - Data para verificar conflitos (formato YYYY-MM-DD)
   * @param excludeTeamId - ID da equipe a ser ignorada (para edições)
   * @returns Mapa de conflitos: { userId: teamName }
   *
   * @example
   * const conflicts = await checkMembersConflicts(['user1', 'user2'], '2026-05-10', 'team-louvor')
   * // Retorna: { 'user1': 'Equipe Dança', 'user2': 'Equipe Mídia' }
   */
  async checkMembersConflicts(
    userIds: string[],
    date: string,
    excludeTeamId?: string,
  ): Promise<Record<string, string>> {
    if (!userIds.length || !date) return {};

    const { data, error } = await supabase
      .from("schedule_members")
      .select(
        `
        team_member:team_members!inner (
          user_id,
          user:users_profile (nome)
        ),
        schedule:schedules!inner (
          date,
          team_id,
          team:teams (nome)
        )
      `,
      )
      .eq("schedule.date", date)
      .in("team_member.user_id", userIds);

    if (error) throw error;

    const conflicts: Record<string, string> = {};

    (data || []).forEach((row: any) => {
      const teamId = row.schedule?.team_id;

      // Ignorar a própria equipe (para não bloquear edições)
      if (excludeTeamId && teamId === excludeTeamId) return;

      const userId = row.team_member?.user_id;
      const teamName = row.schedule?.team?.nome || "outra equipe";

      if (userId) {
        conflicts[userId] = teamName;
      }
    });

    return conflicts;
  },

  /**
   * Busca escalas de uma equipe por tipo (ex: "louvor") em um mês.
   * Útil para integração entre ministérios (ex: Dança visualizar músicas do Louvor).
   *
   * @param teamTypeCode - Código do tipo de equipe (ex: "louvor", "danca")
   * @param date - Data de referência (qualquer dia do mês)
   * @returns Array de escalas com músicas
   */
  async getSchedulesByTeamType(teamTypeCode: string, date: Date) {
    const start = formatDateToISO(startOfMonth(date));
    const end = formatDateToISO(endOfMonth(date));

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        id, date, title, status,
        team:teams!inner (
          id, nome,
          team_type:team_types!inner (codigo)
        ),
        songs:schedule_songs (
          order_index,
          execution_key,
          song:songs (
            id, name, artist, original_key, 
            has_virtual_instruments, audio_path, reference_url
          )
        )
      `,
      )
      .gte("date", start)
      .lte("date", end)
      .eq("team.team_type.codigo", teamTypeCode)
      .order("date");

    if (error) throw error;

    return (data || []) as unknown as Array<{
      id: string;
      date: string;
      title: string | null;
      status: string;
      team: { id: string; nome: string };
      songs: Array<{
        order_index: number;
        execution_key: string | null;
        song: {
          id: string;
          name: string;
          artist: string | null;
          original_key: string | null;
          has_virtual_instruments: boolean;
          audio_path: string | null;
          reference_url: string | null;
        };
      }>;
    }>;
  },
};
