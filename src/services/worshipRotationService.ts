/**
 * Serviço de Rodízio de Equipes Fixas
 *
 * Gerencia o rodízio automático de equipes fixas seguindo as regras:
 * - Equipe X sempre no 1º final de semana do mês
 * - Demais equipes em sequência configurável: A1, B1, C1, A2, B2, C2
 * - Continuidade entre meses baseada no histórico
 */

import { supabase } from "@/lib/supabaseClient";

// ============================================
// CONSTANTS
// ============================================

const FIRST_WEEKEND_MAX_DAY = 7;
const TABLE_NAME = "worship_fixed_teams";
const SCHEDULES_TABLE = "schedules";

// ============================================
// TYPES
// ============================================

export interface RotationTeam {
  id: string;
  nome: string;
  codigo: string;
  order_index: number;
  is_first_weekend: boolean;
  is_active_rotation: boolean;
}

export interface RotationSequence {
  firstWeekendTeam: RotationTeam | null;
  rotationTeams: RotationTeam[];
}

export interface TeamSuggestion {
  team: RotationTeam | null;
  reason: string;
}

// ============================================
// PRIVATE HELPERS
// ============================================

/**
 * Type-safe wrapper para operações do Supabase
 */
const getSupabaseClient = () => supabase as any;

/**
 * Separa equipe do primeiro final de semana das demais
 */
function separateFirstWeekendTeam(teams: any[]): {
  firstWeekend: any | null;
  rotation: any[];
} {
  const firstWeekend = teams.find((team) => team.is_first_weekend) || null;
  const rotation = teams.filter((team) => !team.is_first_weekend);
  return { firstWeekend, rotation };
}

/**
 * Calcula o índice da próxima equipe no rodízio circular
 */
function getNextRotationIndex(
  currentIndex: number,
  totalTeams: number,
): number {
  if (currentIndex === -1 || currentIndex === totalTeams - 1) {
    return 0; // Volta para o início
  }
  return currentIndex + 1;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Obtém a sequência completa de rodízio
 */
export async function getRotationSequence(
  _teamId: string,
): Promise<RotationSequence> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("is_active_rotation", true)
    .order("order_index");

  if (error) throw error;

  const { firstWeekend, rotation } = separateFirstWeekendTeam(data || []);

  return {
    firstWeekendTeam: firstWeekend,
    rotationTeams: rotation,
  };
}

/**
 * Atualiza a ordem de rodízio das equipes
 */
export async function updateRotationOrder(
  teams: Array<{ id: string; order_index: number }>,
): Promise<void> {
  const client = getSupabaseClient();

  const updates = teams.map((team) =>
    client
      .from(TABLE_NAME)
      .update({ order_index: team.order_index })
      .eq("id", team.id),
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r: any) => r.error);

  if (errors.length > 0) {
    throw new Error("Erro ao atualizar ordem de rodízio");
  }
}

/**
 * Define qual equipe é a do primeiro final de semana
 */
export async function setFirstWeekendTeam(teamId: string): Promise<void> {
  const client = getSupabaseClient();

  // Remove flag de todas as equipes
  await client.from(TABLE_NAME).update({ is_first_weekend: false });

  // Define a nova equipe
  const { error } = await client
    .from(TABLE_NAME)
    .update({ is_first_weekend: true, order_index: 0 })
    .eq("id", teamId);

  if (error) throw error;
}

/**
 * Ativa/desativa uma equipe no rodízio
 */
export async function toggleTeamRotation(
  teamId: string,
  isActive: boolean,
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from(TABLE_NAME)
    .update({ is_active_rotation: isActive })
    .eq("id", teamId);

  if (error) throw error;
}

/**
 * Verifica se uma data é o primeiro final de semana do mês
 */
export function isFirstWeekendOfMonth(date: Date): boolean {
  return date.getDate() <= FIRST_WEEKEND_MAX_DAY;
}

/**
 * Busca a última equipe escalada (exceto equipe X)
 */
async function getLastScheduledTeam(
  teamId: string,
  beforeDate: Date,
): Promise<number> {
  const firstDayOfMonth = new Date(
    beforeDate.getFullYear(),
    beforeDate.getMonth(),
    1,
  );
  const dateString = firstDayOfMonth.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from(SCHEDULES_TABLE)
    .select(
      `
      id,
      date,
      fixed_team_id,
      worship_fixed_teams!inner (
        id,
        nome,
        codigo,
        order_index,
        is_first_weekend,
        is_active_rotation
      )
    `,
    )
    .eq("team_id", teamId)
    .lt("date", dateString)
    .eq("worship_fixed_teams.is_active_rotation", true)
    .eq("worship_fixed_teams.is_first_weekend", false)
    .order("date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro ao buscar última escala:", error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const lastTeam = (data[0] as any).worship_fixed_teams;
  return lastTeam?.order_index || 0;
}

/**
 * Obtém a próxima equipe no rodízio baseado no histórico
 */
export async function getNextRotationTeam(
  teamId: string,
  date: Date,
): Promise<RotationTeam | null> {
  // Se for primeiro final de semana, retornar equipe X
  if (isFirstWeekendOfMonth(date)) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("is_first_weekend", true)
      .eq("is_active_rotation", true)
      .single();

    if (error) {
      console.error("Erro ao buscar equipe do 1º final de semana:", error);
      return null;
    }

    return data;
  }

  // Buscar última equipe escalada
  const lastOrderIndex = await getLastScheduledTeam(teamId, date);

  // Buscar todas as equipes do rodízio (exceto equipe X)
  const { data: rotationTeams, error: teamsError } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("is_active_rotation", true)
    .eq("is_first_weekend", false)
    .order("order_index");

  if (teamsError || !rotationTeams || rotationTeams.length === 0) {
    console.error("Erro ao buscar equipes de rodízio:", teamsError);
    return null;
  }

  // Encontrar próxima equipe na sequência
  const currentIndex = (rotationTeams as any[]).findIndex(
    (team: any) => team.order_index === lastOrderIndex,
  );

  const nextIndex = getNextRotationIndex(currentIndex, rotationTeams.length);

  return (rotationTeams as any[])[nextIndex];
}

/**
 * Obtém sugestão de equipe para uma data específica
 */
export async function suggestTeamForDate(
  teamId: string,
  date: Date,
): Promise<TeamSuggestion> {
  const team = await getNextRotationTeam(teamId, date);

  if (!team) {
    return {
      team: null,
      reason: "Nenhuma equipe disponível no rodízio",
    };
  }

  if (team.is_first_weekend) {
    return {
      team,
      reason: "Equipe fixa do 1º final de semana do mês",
    };
  }

  return {
    team,
    reason: "Próxima equipe na sequência de rodízio",
  };
}

// ============================================
// EXPORTS
// ============================================

export const worshipRotationService = {
  getRotationSequence,
  updateRotationOrder,
  setFirstWeekendTeam,
  toggleTeamRotation,
  isFirstWeekendOfMonth,
  getNextRotationTeam,
  suggestTeamForDate,
};
