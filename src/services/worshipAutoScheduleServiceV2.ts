/**
 * Worship Auto Schedule Service V2
 *
 * Versão refatorada que usa APENAS IDs e busca regras do banco de dados.
 *
 * Mudanças principais:
 * - Usa tabelas de regras (worship_bassist_rotation_rules, worship_drummer_rotation_rules)
 * - Usa códigos imutáveis das equipes (equipe-x, equipe-a-1, etc)
 * - Elimina dependências de nomes
 * - Busca regras do banco em vez de hardcode
 */

import {
  addDays,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { scheduleService } from "@/services/scheduleService";
import { teamService } from "@/services/teamService";
import {
  worshipFixedTeamService,
  WorshipFixedTeam,
} from "@/services/worshipFixedTeamService";
import { Schedule, ScheduleFormData, TeamFunction, TeamMember } from "@/types";

// ============================================================================
// CONSTANTES
// ============================================================================

const FIRST_WEEKEND_TEAM_CODE = "equipe-x";
const TEAM_SEQUENCE = [
  "equipe-a-1",
  "equipe-b-1",
  "equipe-c-1",
  "equipe-a-2",
  "equipe-b-2",
  "equipe-c-2",
];
const REQUIRED_PRESET_CODES = [FIRST_WEEKEND_TEAM_CODE, ...TEAM_SEQUENCE];

// ============================================================================
// TIPOS
// ============================================================================

interface RotationRule {
  teamMemberId: string;
  orderIndex: number;
  isFixedTeamX: boolean;
  cannotPlayWhenDrumming?: boolean;
}

interface AutoScheduleState {
  lastTeamCode?: string;
  lastDrummerIndex?: number;
  lastBassistIndex?: number;
}

export interface WorshipAutoScheduleResult {
  created: number;
  skipped: number;
  weekends: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Busca regras de rodízio de baixistas do banco
 */
async function getBassistRotationRules(): Promise<RotationRule[]> {
  const { data, error } = await supabase
    .from("worship_bassist_rotation_rules")
    .select(
      "team_member_id, order_index, is_fixed_team_x, cannot_play_when_drumming",
    )
    .order("order_index");

  if (error) throw error;

  return (data || []).map((row) => ({
    teamMemberId: row.team_member_id,
    orderIndex: row.order_index,
    isFixedTeamX: row.is_fixed_team_x,
    cannotPlayWhenDrumming: row.cannot_play_when_drumming,
  }));
}

/**
 * Busca regras de rodízio de bateristas do banco
 */
async function getDrummerRotationRules(): Promise<RotationRule[]> {
  const { data, error } = await supabase
    .from("worship_drummer_rotation_rules")
    .select("team_member_id, order_index, is_fixed_team_x")
    .order("order_index");

  if (error) throw error;

  return (data || []).map((row) => ({
    teamMemberId: row.team_member_id,
    orderIndex: row.order_index,
    isFixedTeamX: row.is_fixed_team_x,
  }));
}

/**
 * Obtém o próximo item do rodízio baseado no índice
 */
function nextFromRotation<T extends { orderIndex: number }>(
  rules: T[],
  lastIndex?: number,
): T {
  if (lastIndex === undefined || lastIndex === null) {
    return rules[0];
  }

  const currentIdx = rules.findIndex((r) => r.orderIndex === lastIndex);
  if (currentIdx < 0) return rules[0];

  return rules[(currentIdx + 1) % rules.length];
}

/**
 * Constrói blocos de finais de semana do mês
 */
function buildWeekendBlocks(monthDate: Date): Date[][] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const blocks: Date[][] = [];
  let day = start;

  while (!isAfter(day, end)) {
    const weekday = getDay(day);

    if (weekday === 6) {
      const sunday = addDays(day, 1);
      blocks.push(isSameMonth(sunday, monthDate) ? [day, sunday] : [day]);
      day = addDays(day, 2);
      continue;
    }

    if (weekday === 0) {
      blocks.push([day]);
    }

    day = addDays(day, 1);
  }

  return blocks;
}

/**
 * Adiciona membro e função à seleção
 */
function addMemberFunction(
  selected: Map<string, ScheduleFormData["members"][number]>,
  teamMemberId: string,
  functionId: string,
) {
  const current = selected.get(teamMemberId) || {
    team_member_id: teamMemberId,
    function_ids: [],
  };

  if (!current.function_ids.includes(functionId)) {
    current.function_ids.push(functionId);
  }

  selected.set(teamMemberId, current);
}

/**
 * Constrói mapa de equipes fixas por código
 */
function buildPresetMap(
  presets: WorshipFixedTeam[],
): Map<string, WorshipFixedTeam> {
  return new Map(
    presets
      .map((preset) => [preset.codigo, preset] as const)
      .filter(([codigo]) => Boolean(codigo)),
  );
}

/**
 * Busca função por nome
 */
function getFunctionByName(
  functions: TeamFunction[],
  name: string,
): TeamFunction {
  const fn = functions.find((f) => f.nome === name);
  if (!fn) throw new Error(`Função "${name}" não encontrada`);
  return fn;
}

/**
 * Busca membro por ID
 */
function getMemberById(members: TeamMember[], id: string): TeamMember {
  const member = members.find((m) => m.id === id);
  if (!member) throw new Error(`Membro com ID "${id}" não encontrado`);
  return member;
}

/**
 * Busca IDs dos membros com funções fixas
 * Usa tabela de mapeamento em vez de emails
 */
async function getFixedFunctionAssignments(teamId: string): Promise<{
  tecladoMemberId: string;
  guitarraMemberId: string;
}> {
  const { data, error } = await supabase
    .from("worship_fixed_function_assignments")
    .select(
      `
      team_member_id,
      function:team_functions!inner (nome)
    `,
    )
    .eq("is_always_assigned", true)
    .in("function.nome", ["Teclado", "Guitarra"]);

  if (error) throw error;
  if (!data || data.length !== 2) {
    throw new Error(
      "Funções fixas não configuradas. Execute o script de migração.",
    );
  }

  const teclado = data.find((m: any) => m.function.nome === "Teclado");
  const guitarra = data.find((m: any) => m.function.nome === "Guitarra");

  if (!teclado || !guitarra) {
    throw new Error("Teclado ou Guitarra não configurados nas funções fixas");
  }

  return {
    tecladoMemberId: teclado.team_member_id,
    guitarraMemberId: guitarra.team_member_id,
  };
}

/**
 * Constrói membros para uma escala usando regras do banco
 */
async function buildMembersForTeam(
  preset: WorshipFixedTeam,
  members: TeamMember[],
  functions: TeamFunction[],
  drummerRule: RotationRule,
  bassistRule: RotationRule,
  fixedAssignments: { tecladoMemberId: string; guitarraMemberId: string },
): Promise<ScheduleFormData["members"]> {
  const selected = new Map<string, ScheduleFormData["members"][number]>();

  // Funções
  const bateria = getFunctionByName(functions, "Bateria");
  const baixo = getFunctionByName(functions, "Baixo");
  const teclado = getFunctionByName(functions, "Teclado");
  const guitarra = getFunctionByName(functions, "Guitarra");

  // Adicionar membros da equipe fixa (vocais e backs)
  preset.members.forEach((item) => {
    const member = members.find((m) => m.id === item.team_member_id);
    const fn = functions.find((f) => f.id === item.function_id);
    if (member && fn) {
      addMemberFunction(selected, member.id, fn.id);
    }
  });

  // Adicionar baterista
  addMemberFunction(selected, drummerRule.teamMemberId, bateria.id);

  // Adicionar baixista
  addMemberFunction(selected, bassistRule.teamMemberId, baixo.id);

  // Adicionar Michael (teclado) e Vinicius (guitarra)
  addMemberFunction(selected, fixedAssignments.tecladoMemberId, teclado.id);
  addMemberFunction(selected, fixedAssignments.guitarraMemberId, guitarra.id);

  // Validação: Nilson não pode tocar bateria e baixo no mesmo dia
  if (
    bassistRule.cannotPlayWhenDrumming &&
    bassistRule.teamMemberId === drummerRule.teamMemberId
  ) {
    const member = getMemberById(members, drummerRule.teamMemberId);
    throw new Error(
      `Validação: ${member.user?.nome || "Membro"} não pode tocar bateria e baixo no mesmo dia.`,
    );
  }

  return Array.from(selected.values());
}

/**
 * Identifica equipe fixa de uma escala existente
 */
function identifyPresetFromSchedule(
  schedule: Schedule,
  presets: WorshipFixedTeam[],
): WorshipFixedTeam | undefined {
  const schedulePairs = new Set(
    (schedule.members || []).flatMap((member) =>
      (member.functions || []).map((fn) => `${member.team_member_id}:${fn.id}`),
    ),
  );

  return presets.find(
    (preset) =>
      preset.members.length > 0 &&
      preset.members.every((member) =>
        schedulePairs.has(`${member.team_member_id}:${member.function_id}`),
      ),
  );
}

/**
 * Identifica o team_member_id que está em uma função específica
 */
function identifyFunctionMemberId(
  schedule: Schedule,
  functionName: string,
): string | undefined {
  return (schedule.members || []).find((member) =>
    (member.functions || []).some((fn) => fn.nome === functionName),
  )?.team_member_id;
}

/**
 * Carrega estado de continuidade das escalas anteriores
 */
async function loadContinuityState(
  teamId: string,
  beforeDate: string,
  presets: WorshipFixedTeam[],
  bassistRules: RotationRule[],
  drummerRules: RotationRule[],
): Promise<AutoScheduleState> {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      members:schedule_members (
        *,
        team_member_id,
        functions:schedule_member_functions (
          function:team_functions (*)
        )
      )
    `,
    )
    .eq("team_id", teamId)
    .lt("date", beforeDate)
    .order("date", { ascending: false })
    .limit(10);

  if (error) throw error;

  const schedules = (data || []).map((schedule: any) => ({
    ...schedule,
    members: (schedule.members || []).map((member: any) => ({
      ...member,
      functions: (member.functions || [])
        .map((fn: any) => fn.function)
        .filter(Boolean),
    })),
  })) as Schedule[];

  const state: AutoScheduleState = {};

  for (const schedule of schedules) {
    // Identifica código da equipe
    const preset = identifyPresetFromSchedule(schedule, presets);
    if (!state.lastTeamCode && preset?.codigo) {
      state.lastTeamCode = preset.codigo;
    }

    // Identifica baterista
    if (state.lastDrummerIndex === undefined) {
      const drummerMemberId = identifyFunctionMemberId(schedule, "Bateria");
      if (drummerMemberId) {
        const rule = drummerRules.find(
          (r) => r.teamMemberId === drummerMemberId,
        );
        if (rule) state.lastDrummerIndex = rule.orderIndex;
      }
    }

    // Identifica baixista (ignora Equipe X pois Daniel é fixo)
    if (
      state.lastBassistIndex === undefined &&
      preset?.codigo !== FIRST_WEEKEND_TEAM_CODE
    ) {
      const bassistMemberId = identifyFunctionMemberId(schedule, "Baixo");
      if (bassistMemberId) {
        const rule = bassistRules.find(
          (r) => r.teamMemberId === bassistMemberId,
        );
        if (rule) state.lastBassistIndex = rule.orderIndex;
      }
    }

    if (
      state.lastTeamCode &&
      state.lastDrummerIndex !== undefined &&
      state.lastBassistIndex !== undefined
    ) {
      break;
    }
  }

  return state;
}

/**
 * Garante que funções necessárias existem
 */
async function ensureFunctions(
  teamTypeId: string,
  requiredNames: string[],
): Promise<TeamFunction[]> {
  const existing = await teamService.getTeamFunctions(teamTypeId);
  const missing = requiredNames.filter(
    (name) => !existing.some((fn) => fn.nome === name),
  );

  if (missing.length > 0) {
    const { error } = await supabase
      .from("team_functions")
      .insert(missing.map((nome) => ({ nome, team_type_id: teamTypeId })));

    if (error) throw error;
  }

  return teamService.getTeamFunctions(teamTypeId);
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export const worshipAutoScheduleServiceV2 = {
  /**
   * Gera escalas automáticas para um mês usando regras do banco
   */
  async generateMonthly(
    teamId: string,
    monthDate = new Date(),
  ): Promise<WorshipAutoScheduleResult> {
    // Buscar dados básicos
    const team = await teamService.getTeamById(teamId);
    if (!team.team_type_id) {
      throw new Error("Equipe de Louvor sem tipo configurado.");
    }

    // Buscar regras de rodízio do banco
    const [bassistRules, drummerRules, presets, members, functions, fixedAssignments] =
      await Promise.all([
        getBassistRotationRules(),
        getDrummerRotationRules(),
        worshipFixedTeamService.getByTeamId(teamId),
        teamService.getTeamMembers(teamId),
        ensureFunctions(team.team_type_id, [
          "Vocal",
          "BackVocal",
          "Bateria",
          "Baixo",
          "Teclado",
          "Guitarra",
        ]),
        getFixedFunctionAssignments(teamId),
      ]);

    // Validar regras
    if (bassistRules.length === 0) {
      throw new Error(
        "Nenhuma regra de baixista configurada. Execute o script de migração.",
      );
    }
    if (drummerRules.length === 0) {
      throw new Error(
        "Nenhuma regra de baterista configurada. Execute o script de migração.",
      );
    }

    // Validar equipes fixas
    const presetMap = buildPresetMap(presets);
    const missingPresets = REQUIRED_PRESET_CODES.filter(
      (code) => !presetMap.has(code),
    );
    if (missingPresets.length > 0) {
      throw new Error(
        `Cadastre as equipes padrão antes de gerar: ${missingPresets.join(", ")}.`,
      );
    }

    // Preparar geração
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthStartText = format(monthStart, "yyyy-MM-dd");
    const weekendBlocks = buildWeekendBlocks(monthDate);

    // Carregar estado de continuidade
    const continuity = await loadContinuityState(
      teamId,
      monthStartText,
      presets,
      bassistRules,
      drummerRules,
    );

    // Buscar escalas existentes
    const existingSchedules = await scheduleService.getSchedulesByMonth(
      teamId,
      monthDate,
    );
    const existingDates = new Set(
      existingSchedules.map((schedule) => schedule.date),
    );

    // Estado do rodízio
    let created = 0;
    let skipped = 0;
    let lastTeamCode = continuity.lastTeamCode;
    let lastDrummerIndex = continuity.lastDrummerIndex;
    let lastBassistIndex = continuity.lastBassistIndex;

    // Gerar escalas
    for (const [blockIndex, blockDates] of weekendBlocks.entries()) {
      // Determinar equipe
      const teamCode =
        blockIndex === 0
          ? FIRST_WEEKEND_TEAM_CODE
          : TEAM_SEQUENCE[
              TEAM_SEQUENCE.indexOf(lastTeamCode || TEAM_SEQUENCE[0]) + 1
            ] || TEAM_SEQUENCE[0];

      const preset = presetMap.get(teamCode)!;

      // Determinar baterista
      const drummerRule =
        teamCode === FIRST_WEEKEND_TEAM_CODE
          ? drummerRules.find((r) => r.isFixedTeamX)!
          : nextFromRotation(
              drummerRules.filter((r) => !r.isFixedTeamX),
              lastDrummerIndex,
            );

      // Determinar baixista
      let bassistRule: RotationRule;
      if (teamCode === FIRST_WEEKEND_TEAM_CODE) {
        bassistRule = bassistRules.find((r) => r.isFixedTeamX)!;
      } else {
        bassistRule = nextFromRotation(
          bassistRules.filter((r) => !r.isFixedTeamX),
          lastBassistIndex,
        );

        // Se baixista não pode tocar quando está na bateria, pula
        if (
          bassistRule.cannotPlayWhenDrumming &&
          bassistRule.teamMemberId === drummerRule.teamMemberId
        ) {
          bassistRule = nextFromRotation(
            bassistRules.filter((r) => !r.isFixedTeamX),
            bassistRule.orderIndex,
          );
        }
      }

      // Construir membros da escala
      const scheduleMembers = await buildMembersForTeam(
        preset,
        members,
        functions,
        drummerRule,
        bassistRule,
        fixedAssignments,
      );

      // Criar escalas para cada dia do bloco
      for (const date of blockDates) {
        const dateText = format(date, "yyyy-MM-dd");

        if (
          existingDates.has(dateText) ||
          isBefore(date, monthStart) ||
          isAfter(date, monthEnd)
        ) {
          skipped += 1;
          continue;
        }

        // Buscar nomes para as notas (apenas para exibição)
        const drummerMember = getMemberById(members, drummerRule.teamMemberId);
        const bassistMember = getMemberById(members, bassistRule.teamMemberId);

        await scheduleService.createSchedule({
          team_id: teamId,
          date: dateText,
          title: preset.nome,
          notes: `Gerada automaticamente. Bateria: ${drummerMember.user?.nome}. Baixo: ${bassistMember.user?.nome}.`,
          status: "draft",
          members: scheduleMembers,
          songs: [],
        });

        existingDates.add(dateText);
        created += 1;
      }

      // Atualizar estado
      lastTeamCode = teamCode;
      lastDrummerIndex = drummerRule.orderIndex;
      lastBassistIndex = bassistRule.orderIndex;
    }

    return {
      created,
      skipped,
      weekends: weekendBlocks.length,
    };
  },
};
