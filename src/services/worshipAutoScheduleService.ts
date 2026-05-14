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

const FIRST_WEEKEND_TEAM_CODE = "X";
const TEAM_SEQUENCE = ["A-1", "B-1", "C-1", "A-2", "B-2", "C-2"];
const REQUIRED_PRESET_CODES = [FIRST_WEEKEND_TEAM_CODE, ...TEAM_SEQUENCE];
const DRUMMER_SEQUENCE = ["Thiago", "Isadora"];
const BASS_SEQUENCE = ["Ari", "Nilson", "Daniel"];

interface AutoScheduleState {
  lastTeamCode?: string;
  lastDrummerName?: string;
  lastBassistName?: string;
}

export interface WorshipAutoScheduleResult {
  created: number;
  skipped: number;
  weekends: number;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getTeamCode(value: string) {
  const normalized = normalizeText(value);
  return REQUIRED_PRESET_CODES.find((code) =>
    normalized.includes(normalizeText(code)),
  );
}

function getFunction(functions: TeamFunction[], name: string) {
  const fn = functions.find(
    (item) => normalizeText(item.nome) === normalizeText(name),
  );
  if (!fn) throw new Error(`Funcao "${name}" nao cadastrada para Louvor.`);
  return fn;
}

function findMember(members: TeamMember[], name: string) {
  const wanted = normalizeText(name);
  const member = members.find((item) => {
    const current = normalizeText(item.user?.nome || "");
    return (
      current === wanted || current.includes(wanted) || wanted.includes(current)
    );
  });

  if (!member)
    throw new Error(`Membro "${name}" nao encontrado na equipe de Louvor.`);
  return member;
}

function nextFromCycle<T>(cycle: T[], last?: T) {
  if (!last) return cycle[0];
  const currentIndex = cycle.findIndex((item) => item === last);
  if (currentIndex < 0) return cycle[0];
  return cycle[(currentIndex + 1) % cycle.length];
}

function buildWeekendBlocks(monthDate: Date) {
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

function addMemberFunction(
  selected: Map<string, ScheduleFormData["members"][number]>,
  member: TeamMember,
  fn: TeamFunction,
) {
  const current = selected.get(member.id) || {
    team_member_id: member.id,
    function_ids: [],
  };

  if (!current.function_ids.includes(fn.id)) {
    current.function_ids.push(fn.id);
  }

  selected.set(member.id, current);
}

function buildPresetMap(presets: WorshipFixedTeam[]) {
  return new Map(
    presets
      .map((preset) => {
        const code = getTeamCode(preset.nome);
        return [code, preset] as const;
      })
      .filter(([code]) => Boolean(code)),
  );
}

function buildMembersForTeam(
  preset: WorshipFixedTeam,
  members: TeamMember[],
  functions: TeamFunction[],
  drummerName: string,
  bassistName: string,
) {
  const selected = new Map<string, ScheduleFormData["members"][number]>();
  const bateria = getFunction(functions, "Bateria");
  const baixo = getFunction(functions, "Baixo");
  const teclado = getFunction(functions, "Teclado");
  const guitarra = getFunction(functions, "Guitarra");

  preset.members.forEach((item) => {
    const member = members.find(
      (memberItem) => memberItem.id === item.team_member_id,
    );
    const fn = functions.find(
      (functionItem) => functionItem.id === item.function_id,
    );
    if (member && fn) addMemberFunction(selected, member, fn);
  });

  addMemberFunction(selected, findMember(members, drummerName), bateria);
  addMemberFunction(selected, findMember(members, bassistName), baixo);
  addMemberFunction(selected, findMember(members, "Michael"), teclado);
  addMemberFunction(selected, findMember(members, "Vinicius"), guitarra);

  const nilson = findMember(members, "Nilson");
  const nilsonEntry = selected.get(nilson.id);
  if (
    nilsonEntry?.function_ids.includes(bateria.id) &&
    nilsonEntry.function_ids.includes(baixo.id)
  ) {
    throw new Error(
      "Validacao: Nilson nao pode tocar bateria e baixo no mesmo dia.",
    );
  }

  const michael = findMember(members, "Michael");
  const vinicius = findMember(members, "Vinicius");

  if (!selected.get(michael.id)?.function_ids.includes(teclado.id)) {
    throw new Error("Validacao: Michael precisa estar escalado no teclado.");
  }

  if (!selected.get(vinicius.id)?.function_ids.includes(guitarra.id)) {
    throw new Error("Validacao: Vinicius precisa estar escalado na guitarra.");
  }

  return Array.from(selected.values());
}

function identifyPresetFromSchedule(
  schedule: Schedule,
  presets: WorshipFixedTeam[],
) {
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

function identifyFunctionMember(schedule: Schedule, functionName: string) {
  return (schedule.members || []).find((member) =>
    (member.functions || []).some(
      (fn) => normalizeText(fn.nome) === normalizeText(functionName),
    ),
  )?.team_member?.user?.nome;
}

async function loadContinuityState(
  teamId: string,
  beforeDate: string,
  presets: WorshipFixedTeam[],
) {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      members:schedule_members (
        *,
        team_member:team_members (
          *,
          user:users_profile (*)
        ),
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
    // Identifica o código da equipe desta escala
    const preset = identifyPresetFromSchedule(schedule, presets);
    const code = preset
      ? getTeamCode(preset.nome)
      : getTeamCode(schedule.title || "");

    if (!state.lastTeamCode && code) {
      state.lastTeamCode = code;
    }

    state.lastDrummerName ||= identifyFunctionMember(schedule, "Bateria");

    // Para o rodízio de baixistas, ignora escalas da Equipe X (1ª semana do mês),
    // pois Daniel é fixo nela e não representa a posição real do rodízio.
    // Busca o último baixista que tocou em uma semana de rodízio normal.
    if (!state.lastBassistName && code !== FIRST_WEEKEND_TEAM_CODE) {
      state.lastBassistName = identifyFunctionMember(schedule, "Baixo");
    }

    if (state.lastTeamCode && state.lastDrummerName && state.lastBassistName)
      break;
  }

  return state;
}

async function ensureFunctions(teamTypeId: string, requiredNames: string[]) {
  const existing = await teamService.getTeamFunctions(teamTypeId);
  const missing = requiredNames.filter(
    (name) =>
      !existing.some((fn) => normalizeText(fn.nome) === normalizeText(name)),
  );

  if (missing.length > 0) {
    const { error } = await supabase
      .from("team_functions")
      .insert(missing.map((nome) => ({ nome, team_type_id: teamTypeId })));

    if (error) throw error;
  }

  return teamService.getTeamFunctions(teamTypeId);
}

export const worshipAutoScheduleService = {
  async generateMonthly(
    teamId: string,
    monthDate = new Date(),
  ): Promise<WorshipAutoScheduleResult> {
    const team = await teamService.getTeamById(teamId);
    if (!team.team_type_id)
      throw new Error("Equipe de Louvor sem tipo configurado.");

    const [presets, members, functions] = await Promise.all([
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
    ]);

    const presetMap = buildPresetMap(presets);
    const missingPresets = REQUIRED_PRESET_CODES.filter(
      (code) => !presetMap.has(code),
    );
    if (missingPresets.length > 0) {
      throw new Error(
        `Cadastre as equipes padrao antes de gerar: ${missingPresets.join(", ")}.`,
      );
    }

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthStartText = format(monthStart, "yyyy-MM-dd");
    const weekendBlocks = buildWeekendBlocks(monthDate);
    const continuity = await loadContinuityState(
      teamId,
      monthStartText,
      presets,
    );

    const existingSchedules = await scheduleService.getSchedulesByMonth(
      teamId,
      monthDate,
    );
    const existingDates = new Set(
      existingSchedules.map((schedule) => schedule.date),
    );

    let created = 0;
    let skipped = 0;
    let lastTeamCode = continuity.lastTeamCode;
    let lastDrummerName = continuity.lastDrummerName;
    let lastBassistName = continuity.lastBassistName;

    for (const [blockIndex, blockDates] of weekendBlocks.entries()) {
      const teamCode =
        blockIndex === 0
          ? FIRST_WEEKEND_TEAM_CODE
          : nextFromCycle(TEAM_SEQUENCE, lastTeamCode);

      const preset = presetMap.get(teamCode)!;

      const drummerName =
        teamCode === FIRST_WEEKEND_TEAM_CODE
          ? "Nilson"
          : nextFromCycle(DRUMMER_SEQUENCE, lastDrummerName);

      // Rodízio de baixistas: Daniel fixo na 1ª semana (Equipe X).
      // Nas demais semanas, rodízio sequencial entre Daniel, Ari e Nilson.
      // Se Nilson for selecionado como baixista mas já estiver na bateria,
      // avança para o próximo da sequência (sem contar como "usado" no rodízio).
      let bassistName: string;
      if (teamCode === FIRST_WEEKEND_TEAM_CODE) {
        bassistName = "Daniel";
      } else {
        bassistName = nextFromCycle(BASS_SEQUENCE, lastBassistName);
        if (bassistName === "Nilson" && drummerName === "Nilson") {
          bassistName = nextFromCycle(BASS_SEQUENCE, "Nilson");
        }
      }

      const scheduleMembers = buildMembersForTeam(
        preset,
        members,
        functions,
        drummerName,
        bassistName,
      );

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

        await scheduleService.createSchedule({
          team_id: teamId,
          date: dateText,
          title: `Equipe ${teamCode} - Louvor`,
          notes: `Gerada automaticamente. Bateria: ${drummerName}. Baixo: ${bassistName}.`,
          status: "draft",
          members: scheduleMembers,
          songs: [],
        });

        existingDates.add(dateText);
        created += 1;
      }

      lastTeamCode =
        teamCode === FIRST_WEEKEND_TEAM_CODE ? lastTeamCode : teamCode;
      lastDrummerName = drummerName;
      lastBassistName = bassistName;
    }

    return {
      created,
      skipped,
      weekends: weekendBlocks.length,
    };
  },
};
