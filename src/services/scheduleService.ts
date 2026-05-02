import { supabase } from "@/lib/supabaseClient";
import { Schedule, ScheduleFormData } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";

export const scheduleService = {
  async getSchedulesByMonth(teamId: string, date: Date) {
    const start = startOfMonth(date).toISOString().split("T")[0];
    const end = endOfMonth(date).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
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
      `,
      )
      .eq("team_id", teamId)
      .gte("date", start)
      .lte("date", end)
      .order("date");

    if (error) throw error;

    // Normalizar funções dos membros
    return (data || []).map((schedule: any) => ({
      ...schedule,
      members: (schedule.members || []).map((m: any) => ({
        ...m,
        functions: (m.functions || [])
          .map((f: any) => f.function)
          .filter(Boolean),
      })),
    }));
  },

  async getScheduleByDate(teamId: string, date: string) {
    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
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
      `,
      )
      .eq("team_id", teamId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      members: (data.members || []).map((m: any) => ({
        ...m,
        functions: (m.functions || [])
          .map((f: any) => f.function)
          .filter(Boolean),
      })),
    };
  },

  async createSchedule(scheduleData: ScheduleFormData) {
    const { data: authData } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("auth_user_id", authData.user?.id)
      .single();

    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .insert({
        team_id: scheduleData.team_id,
        date: scheduleData.date,
        title: scheduleData.title,
        notes: scheduleData.notes,
        status: scheduleData.status,
        created_by: userProfile?.id,
      })
      .select()
      .single();

    if (scheduleError) {
      if (scheduleError.code === "23505") {
        throw new Error(
          `Já existe uma escala para esta equipe no dia ${scheduleData.date}. Edite a escala existente ou escolha outra data.`,
        );
      }
      throw scheduleError;
    }

    // Adicionar membros
    if (scheduleData.members.length > 0) {
      for (const member of scheduleData.members) {
        const { data: scheduleMember, error: memberError } = await supabase
          .from("schedule_members")
          .insert({
            schedule_id: schedule.id,
            team_member_id: member.team_member_id,
            notes: member.notes,
          })
          .select()
          .single();

        if (memberError) throw memberError;

        // Adicionar funções do membro
        if (member.function_ids.length > 0) {
          const functions = member.function_ids.map((functionId) => ({
            schedule_member_id: scheduleMember.id,
            function_id: functionId,
          }));

          const { error: functionsError } = await supabase
            .from("schedule_member_functions")
            .insert(functions);

          if (functionsError) throw functionsError;
        }
      }
    }

    // Adicionar músicas
    if (scheduleData.songs && scheduleData.songs.length > 0) {
      const songs = scheduleData.songs.map((song) => ({
        schedule_id: schedule.id,
        song_id: song.song_id,
        execution_key: song.execution_key,
        order_index: song.order_index,
        notes: song.notes,
      }));

      const { error: songsError } = await supabase
        .from("schedule_songs")
        .insert(songs);

      if (songsError) throw songsError;
    }

    return schedule;
  },

  async updateSchedule(
    scheduleId: string,
    scheduleData: Partial<ScheduleFormData>,
  ) {
    const { data: authData } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("auth_user_id", authData.user?.id)
      .single();

    // Atualizar dados básicos da escala
    const updateData: any = {
      title: scheduleData.title,
      status: scheduleData.status,
      date: scheduleData.date,
      updated_by: userProfile?.id,
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

    // Atualizar membros: deletar e reinserir
    if (scheduleData.members !== undefined) {
      // Buscar schedule_members existentes para deletar funções
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

      for (const member of scheduleData.members) {
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

        if (member.function_ids.length > 0) {
          const functions = member.function_ids.map((functionId) => ({
            schedule_member_id: scheduleMember.id,
            function_id: functionId,
          }));
          const { error: fnError } = await supabase
            .from("schedule_member_functions")
            .insert(functions);
          if (fnError) throw fnError;
        }
      }
    }

    // Atualizar músicas: deletar e reinserir
    if (scheduleData.songs !== undefined) {
      await supabase
        .from("schedule_songs")
        .delete()
        .eq("schedule_id", scheduleId);

      if (scheduleData.songs.length > 0) {
        const songs = scheduleData.songs.map((song) => ({
          schedule_id: scheduleId,
          song_id: song.song_id,
          execution_key: song.execution_key,
          order_index: song.order_index,
          notes: song.notes,
        }));
        const { error: songsError } = await supabase
          .from("schedule_songs")
          .insert(songs);
        if (songsError) throw songsError;
      }
    }

    return data;
  },

  async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
  },

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
};
