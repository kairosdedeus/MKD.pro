import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  CalendarCheck2,
  Users,
  Music,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Mic2,
  Guitar,
  Drum,
  Piano,
  Radio,
  MonitorPlay,
  Volume2,
  Circle,
  UserCheck,
  Copy,
  FileText,
  BellRing,
} from "lucide-react";
import { CreateScheduleModal } from "@/components/features/schedules/CreateScheduleModal";
import { ScheduleDetailModal } from "@/components/features/schedules/ScheduleDetailModal";
import { WorshipFixedTeamModal } from "@/components/features/schedules/WorshipFixedTeamModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSchedules, useDeleteSchedule } from "@/hooks/useSchedules";
import { useTeams } from "@/hooks/useTeams";
import { teamService } from "@/services/teamService";
import {
  worshipFixedTeamService,
  WorshipFixedTeam,
} from "@/services/worshipFixedTeamService";
import { worshipAutoScheduleService } from "@/services/worshipAutoScheduleService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  format,
  parseISO,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Schedule, TeamFunction, TeamMember } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { isGerencial, isLeader } from "@/lib/permissions";
import { useAuthStore } from "@/stores/authStore";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  published: {
    label: "Publicada",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  completed: { label: "Concluída", color: "bg-primary/15 text-primary" },
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFunctionPriority(functionName: string) {
  const normalized = normalizeText(functionName);
  if (normalized === "vocal") return 0;
  if (normalized === "backvocal" || normalized === "back vocal") return 1;
  return 2;
}

function getFunctionIcon(functionName: string) {
  const normalized = normalizeText(functionName);
  if (
    normalized === "vocal" ||
    normalized === "backvocal" ||
    normalized === "back vocal"
  )
    return Mic2;
  if (normalized === "guitarra" || normalized === "baixo") return Guitar;
  if (normalized === "bateria") return Drum;
  if (normalized === "teclado") return Piano;
  if (normalized === "som") return Volume2;
  if (normalized === "projecao") return MonitorPlay;
  if (normalized === "transmissao") return Radio;
  return Circle;
}

function getPresetMemberRows(
  preset: WorshipFixedTeam,
  teamMembers: TeamMember[] = [],
  teamFunctions: TeamFunction[] = [],
) {
  return Array.from(
    new Set(preset.members.map((member) => member.team_member_id)),
  )
    .map((memberId) => {
      const member = teamMembers.find((item) => item.id === memberId);
      const functions = preset.members
        .filter((item) => item.team_member_id === memberId)
        .map((item) => teamFunctions.find((fn) => fn.id === item.function_id))
        .filter(Boolean) as TeamFunction[];

      const sortedFunctions = functions.sort((a, b) => {
        const priorityDiff =
          getFunctionPriority(a.nome) - getFunctionPriority(b.nome);
        if (priorityDiff !== 0) return priorityDiff;
        return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
      });

      return {
        memberId,
        memberName: member?.user?.nome || "Membro removido",
        functions: sortedFunctions,
        priority: sortedFunctions[0]
          ? getFunctionPriority(sortedFunctions[0].nome)
          : 99,
      };
    })
    .sort((a, b) => {
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return a.memberName.localeCompare(b.memberName, "pt-BR", {
        sensitivity: "base",
      });
    });
}

function getScheduleMemberRows(schedule: Schedule) {
  return (schedule.members || [])
    .map((member) => {
      const functions = [...(member.functions || [])].sort((a, b) => {
        const priorityDiff =
          getFunctionPriority(a.nome) - getFunctionPriority(b.nome);
        if (priorityDiff !== 0) return priorityDiff;
        return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
      });

      return {
        id: member.id,
        name: member.team_member?.user?.nome || "Membro removido",
        functions,
        priority: functions[0] ? getFunctionPriority(functions[0].nome) : 99,
      };
    })
    .sort((a, b) => {
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
}

function groupSchedulesByWeekend(schedules: Schedule[]) {
  const groups = new Map<string, Schedule[]>();

  schedules.forEach((schedule) => {
    const date = parseISO(schedule.date);
    const weekday = getDay(date);
    const groupDate = weekday === 0 ? addDays(date, -1) : date;
    const key = format(groupDate, "yyyy-MM-dd");
    const current = groups.get(key) || [];
    current.push(schedule);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([key, groupSchedules]) => ({
      key,
      schedules: groupSchedules.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function getScheduleMembersByFunction(
  schedule: Schedule,
  functionNames: string[],
) {
  const wanted = functionNames.map(normalizeText);
  return (schedule.members || [])
    .filter((member) =>
      (member.functions || []).some((fn) =>
        wanted.includes(normalizeText(fn.nome)),
      ),
    )
    .map((member) => member.team_member?.user?.nome || "Membro removido")
    .filter(Boolean);
}

function getWhatsAppTeamName(schedule: Schedule) {
  return (schedule.title || "Equipe")
    .replace(/\s*-\s*Louvor\s*$/i, "")
    .replace(/^Equipe\s+/i, "")
    .trim();
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function formatWhatsAppNames(names: string[]) {
  return names.length > 0 ? names.map(getFirstName).join(", ") : "-";
}

function buildMonthlyWhatsAppText(
  schedules: Schedule[],
  monthDate: Date,
  teamName: string,
) {
  const month = format(monthDate, "MMMM", { locale: ptBR }).toUpperCase();
  const year = format(monthDate, "yyyy");
  const groups = groupSchedulesByWeekend(schedules).filter(
    (group) => group.schedules.length > 0,
  );

  const lines = [
    `🎶 ESCALA – ${month} / ${year}`,
    "",
    `📍 ${teamName.toUpperCase()}`,
  ];

  groups.forEach((group) => {
    const orderedSchedules = [...group.schedules].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const mainSchedule = orderedSchedules[0];
    const days = orderedSchedules
      .map((schedule) => format(parseISO(schedule.date), "dd"))
      .join(" e ");
    const ministers = getScheduleMembersByFunction(mainSchedule, ["Vocal"]);
    const backs = getScheduleMembersByFunction(mainSchedule, [
      "BackVocal",
      "Back Vocal",
    ]);
    const drummer = getScheduleMembersByFunction(mainSchedule, ["Bateria"]);
    const bassist = getScheduleMembersByFunction(mainSchedule, ["Baixo"]);
    const keyboardist = getScheduleMembersByFunction(mainSchedule, ["Teclado"]);
    const guitarist = getScheduleMembersByFunction(mainSchedule, ["Guitarra"]);

    lines.push(
      "",
      "",
      `🗓 ${days}`,
      "",
      `🎤 Equipe ${getWhatsAppTeamName(mainSchedule)}`,
      "",
      `🎙️ Ministros: ${formatWhatsAppNames(ministers)}`,
      `🎙️ Backs: ${formatWhatsAppNames(backs)}`,
      "",
      `🎹 Teclado: ${formatWhatsAppNames(keyboardist)}`,
      `🎸 Guitarra: ${formatWhatsAppNames(guitarist)}`,
      `🥁 Bateria: ${formatWhatsAppNames(drummer)}`,
      `🎸 Baixo: ${formatWhatsAppNames(bassist)}`,
    );
  });

  return lines.join("\n").trim();
}

export function WorshipDashboard() {
  const { toast } = useToast();
  const { user, profiles } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFixedTeamModal, setShowFixedTeamModal] = useState(false);
  const [showWhatsAppExport, setShowWhatsAppExport] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null,
  );
  const [selectedFixedTeamId, setSelectedFixedTeamId] = useState<string | null>(
    null,
  );
  const [fixedTeams, setFixedTeams] = useState<WorshipFixedTeam[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([]);
  const [editingFixedTeam, setEditingFixedTeam] =
    useState<WorshipFixedTeam | null>(null);
  const [deletingFixedTeam, setDeletingFixedTeam] =
    useState<WorshipFixedTeam | null>(null);
  const [loadingFixedTeams, setLoadingFixedTeams] = useState(false);
  const [generatingMonthlySchedule, setGeneratingMonthlySchedule] =
    useState(false);

  const { teams, loading: loadingTeams } = useTeams();
  const worshipTeam = teams.find((t) => t.team_type?.codigo === "louvor");

  const {
    schedules,
    loading: loadingSchedules,
    refetch,
  } = useSchedules(worshipTeam?.id || "", currentMonth);

  const deleteSchedule = useDeleteSchedule();

  const loadFixedTeamData = async () => {
    if (!worshipTeam) return;

    try {
      setLoadingFixedTeams(true);
      const [presets, functions] = await Promise.all([
        worshipFixedTeamService.getByTeamId(worshipTeam.id),
        worshipTeam.team_type_id
          ? teamService.getTeamFunctions(worshipTeam.team_type_id)
          : Promise.resolve([]),
      ]);
      setFixedTeams(presets);
      setTeamFunctions(functions);
    } catch (error) {
      console.error("Erro ao carregar equipes padrão:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar equipes padrão",
      });
    } finally {
      setLoadingFixedTeams(false);
    }
  };

  useEffect(() => {
    loadFixedTeamData();
  }, [worshipTeam?.id]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startWeekday = getDay(monthStart);
  const calendarDays = Array.from({ length: 42 }, (_, index) =>
    addDays(monthStart, index - startWeekday),
  );

  const getSchedulesForDay = (day: Date) =>
    schedules.filter((s) => s.date === format(day, "yyyy-MM-dd"));

  const isCurrentUserScheduled = (daySchedules: Schedule[]) =>
    !!user &&
    daySchedules.some((schedule) =>
      (schedule.members || []).some(
        (member) =>
          member.team_member?.user_id === user.id ||
          member.team_member?.user?.id === user.id,
      ),
    );

  const selectedDaySchedules = schedules.filter(
    (s) => s.date === format(selectedDate, "yyyy-MM-dd"),
  );
  const monthlyScheduleGroups = groupSchedulesByWeekend(schedules);
  const monthlyWhatsAppText = buildMonthlyWhatsAppText(
    schedules,
    currentMonth,
    worshipTeam?.nome || "MKD - Louvor",
  );

  const canManage =
    !!user &&
    (isGerencial(profiles || []) || isLeader(profiles || [], "louvor"));

  const sortedFixedTeams = [...fixedTeams].sort((a, b) => {
    const firstA =
      getPresetMemberRows(a, worshipTeam?.members || [], teamFunctions)[0]
        ?.memberName || a.nome;
    const firstB =
      getPresetMemberRows(b, worshipTeam?.members || [], teamFunctions)[0]
        ?.memberName || b.nome;
    const firstDiff = firstA.localeCompare(firstB, "pt-BR", {
      sensitivity: "base",
    });
    if (firstDiff !== 0) return firstDiff;
    return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
  });

  const handleDeleteSchedule = async (schedule: Schedule) => {
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast({ title: "Escala excluída com sucesso!" });
      setDeletingSchedule(null);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir escala" });
    }
  };

  const handleDeleteFixedTeam = async (preset: WorshipFixedTeam) => {
    try {
      await worshipFixedTeamService.delete(preset.id);
      toast({ title: "Equipe padrão excluída!" });
      setDeletingFixedTeam(null);
      loadFixedTeamData();
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir equipe padrão" });
    }
  };

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedFixedTeamId(null);
    setEditingSchedule(schedule);
    setShowCreateModal(true);
  };

  const handleCreateSchedule = (fixedTeamId?: string) => {
    setEditingSchedule(null);
    setSelectedFixedTeamId(fixedTeamId || null);
    setShowCreateModal(true);
  };

  const handleCalendarDayDoubleClick = (day: Date) => {
    const dateText = format(day, "yyyy-MM-dd");
    const daySchedule = schedules.find(
      (schedule) => schedule.date === dateText,
    );

    setSelectedDate(day);

    if (daySchedule) {
      handleEditSchedule(daySchedule);
      return;
    }

    handleCreateSchedule();
  };

  const handleGenerateMonthlySchedule = async () => {
    if (!worshipTeam) return;

    try {
      setGeneratingMonthlySchedule(true);
      const result = await worshipAutoScheduleService.generateMonthly(
        worshipTeam.id,
        currentMonth,
      );

      toast({
        title: "Escala mensal gerada",
        description: `${result.created} escala(s) criada(s). ${result.skipped} data(s) ja tinham escala e foram preservadas.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar escala mensal",
        description:
          error.message ||
          "Revise equipes padrao, membros e funcoes do Louvor.",
      });
    } finally {
      setGeneratingMonthlySchedule(false);
    }
  };

  const handleCopyWhatsAppExport = async () => {
    try {
      await navigator.clipboard.writeText(monthlyWhatsAppText);
      toast({ title: "Escala copiada para o WhatsApp!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Selecione o texto e copie manualmente.",
      });
    }
  };

  if (loadingTeams) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!worshipTeam) {
    return (
      <EmptyState
        icon={Users}
        title="Equipe de Louvor não encontrada"
        description="Crie uma equipe do tipo Louvor em Gerencial → Equipes para começar."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            🎵 Louvor
          </h1>
          <p className="text-muted-foreground mt-1">
            {worshipTeam.nome} · {worshipTeam.members?.length || 0} membros
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {canManage && (
            <>
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
                onClick={() => setShowWhatsAppExport(true)}
                disabled={schedules.length === 0}
              >
                <FileText className="h-4 w-4" />
                Exportar WhatsApp
              </Button>
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
                onClick={handleGenerateMonthlySchedule}
                disabled={generatingMonthlySchedule}
              >
                <Calendar className="h-4 w-4" />
                {generatingMonthlySchedule
                  ? "Gerando..."
                  : "Gerar Escala Mensal Automática"}
              </Button>
            </>
          )}
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => handleCreateSchedule()}
          >
            <Plus className="h-4 w-4" />
            Nova Escala
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            icon: Calendar,
            value: schedules.length,
            label: "Escalas este mês",
          },
          {
            icon: Users,
            value: worshipTeam.members?.length || 0,
            label: "Membros na equipe",
          },
          {
            icon: Music,
            value: schedules.reduce(
              (acc, s) => acc + (s.songs?.length || 0),
              0,
            ),
            label: "Músicas escaladas",
          },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2 space-y-6">
          {/* Calendário */}
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
            <CardHeader className="px-5 pb-2 pt-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl capitalize tracking-tight">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Selecione a data desejada
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-9 rounded-xl sm:inline-flex"
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(today);
                      setSelectedDate(today);
                    }}
                  >
                    Hoje
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-10 pt-2 sm:px-5">
              <div className="grid grid-cols-7 px-1">
                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-bold tracking-wide text-muted-foreground py-3"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((day) => {
                  const daySchedules = getSchedulesForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const hasSchedule = daySchedules.length > 0;
                  const isUserScheduled = isCurrentUserScheduled(daySchedules);
                  const inCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        if (!inCurrentMonth) setCurrentMonth(day);
                      }}
                      onDoubleClick={() => handleCalendarDayDoubleClick(day)}
                      className={`
                      group relative flex h-11 items-center justify-center overflow-hidden rounded-xl border text-sm font-bold transition-all sm:h-12
                      ${isSelected ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" : ""}
                      ${!isSelected && hasSchedule ? "border-primary/80 bg-background text-foreground hover:bg-primary/10 hover:shadow-sm" : ""}
                      ${!isSelected && !hasSchedule && inCurrentMonth ? "border-transparent text-foreground hover:border-primary/30 hover:bg-background/80" : ""}
                      ${!isSelected && !inCurrentMonth ? "border-transparent text-muted-foreground/30 hover:text-muted-foreground" : ""}
                      ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}
                    `}
                      title={`${format(day, "dd 'de' MMMM", { locale: ptBR })}${hasSchedule ? ` - ${daySchedules.length} escala(s)` : ""}${isUserScheduled ? " - você está escalado(a)" : ""}`}
                    >
                      <span className="relative z-10">{format(day, "d")}</span>
                      {hasSchedule && (
                        <span
                          className={`absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-background shadow-sm transition-transform group-hover:scale-110 sm:right-1.5 sm:top-1.5 sm:h-4 sm:w-4 ${
                            isSelected
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground shadow-primary/20"
                          }`}
                          aria-label={`${daySchedules.length} escala(s) neste dia`}
                        >
                          <CalendarCheck2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </span>
                      )}
                      {isUserScheduled && (
                        <span
                          className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background shadow-sm shadow-emerald-500/20 transition-transform group-hover:scale-110 sm:bottom-1.5 sm:right-1.5 sm:h-4 sm:w-4"
                          aria-label="Você está escalado(a) neste dia"
                        >
                          <UserCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Escalas do dia selecionado */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  Escala de{" "}
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                {!loadingSchedules && selectedDaySchedules.length === 0 && (
                  <Button
                    size="sm"
                    className="h-8 gap-1 self-start sm:self-auto"
                    onClick={() => handleCreateSchedule()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Escala
                  </Button>
                )}
                {!loadingSchedules && selectedDaySchedules.length > 0 && (
                  <div className="flex gap-2 self-start sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() =>
                        handleEditSchedule(selectedDaySchedules[0])
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() =>
                        setDeletingSchedule(selectedDaySchedules[0])
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : selectedDaySchedules.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma escala neste dia
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Escolha uma equipe padrão ou crie a escala manualmente.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedDaySchedules.map((schedule) => {
                    const status =
                      STATUS_LABELS[schedule.status] || STATUS_LABELS.draft;
                    const memberRows = getScheduleMemberRows(schedule);
                    const songs = [...(schedule.songs || [])].sort(
                      (a, b) => a.order_index - b.order_index,
                    );

                    return (
                      <div
                        key={schedule.id}
                        className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-colors hover:border-primary/40"
                      >
                        <button
                          type="button"
                          onClick={() => handleViewSchedule(schedule)}
                          className="w-full bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {schedule.title || "Escala sem título"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {memberRows.length} membro(s) · {songs.length}{" "}
                                música(s)
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                        </button>

                        <div className="space-y-3 p-3">
                          {memberRows.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                Funções
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {memberRows.map((row) => (
                                  <div
                                    key={row.id}
                                    className="rounded-lg border bg-muted/20 p-2"
                                  >
                                    <p className="text-sm font-medium text-foreground">
                                      {row.name}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {row.functions.length > 0 ? (
                                        row.functions.map((fn) => {
                                          const Icon = getFunctionIcon(fn.nome);
                                          return (
                                            <span
                                              key={fn.id}
                                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                                            >
                                              <Icon className="h-3 w-3" />
                                              {fn.nome}
                                            </span>
                                          );
                                        })
                                      ) : (
                                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                                          Sem função
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <Music className="h-3.5 w-3.5" />
                              Músicas
                            </div>
                            {songs.length > 0 ? (
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                {songs.slice(0, 5).map((song, index) => (
                                  <div
                                    key={song.id}
                                    className="flex items-center gap-2 rounded-lg bg-muted/30 px-2 py-1.5"
                                  >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                      {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-medium text-foreground">
                                        {song.song?.name || "Música removida"}
                                      </p>
                                      {(song.execution_key ||
                                        song.song?.artist) && (
                                        <p className="truncate text-[11px] text-muted-foreground">
                                          {song.song?.artist || "Sem artista"}
                                          {song.execution_key &&
                                            ` · Tom ${song.execution_key}`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {songs.length > 5 && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewSchedule(schedule)}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    Ver mais {songs.length - 5} música(s)
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                                Nenhuma música adicionada nesta escala
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 border-t bg-muted/20 p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleViewSchedule(schedule)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Detalhes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeletingSchedule(schedule)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <Card className="flex min-h-0 flex-col h-[300px] lg:h-[350px]">
            <CardHeader className="shrink-0 pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Music className="h-5 w-5 text-primary" />
                  Equipes padrão
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    setEditingFixedTeam(null);
                    setShowFixedTeamModal(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {loadingFixedTeams ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : fixedTeams.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma equipe padrão
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre formações fixas para montar escalas mais rápido.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sortedFixedTeams.map((preset) => {
                    const rows = getPresetMemberRows(
                      preset,
                      worshipTeam.members || [],
                      teamFunctions,
                    );
                    const vocalSummary = rows
                      .filter((row) => row.priority <= 1)
                      .slice(0, 3)
                      .map((row) => row.memberName)
                      .join(", ");

                    return (
                      <div
                        key={preset.id}
                        className="rounded-lg border border-border p-2.5 space-y-1.5 hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCreateSchedule(preset.id)}
                            className="min-w-0 flex-1 rounded-md text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            title="Criar escala usando esta equipe padrão"
                          >
                            <p className="font-semibold text-[13px] leading-4 truncate">
                              {preset.nome}
                            </p>
                            <p className="text-[11px] leading-4 text-muted-foreground truncate">
                              {vocalSummary || `${rows.length} membro(s)`}
                            </p>
                          </button>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingFixedTeam(preset);
                                setShowFixedTeamModal(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeletingFixedTeam(preset)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {rows.slice(0, 2).map((row) => (
                            <span
                              key={row.memberId}
                              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] leading-4 text-primary"
                            >
                              {row.functions[0]?.nome || "Função"}:{" "}
                              {row.memberName}
                            </span>
                          ))}
                          {rows.length > 2 && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-4 text-muted-foreground">
                              +{rows.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col h-[240px] lg:h-[280px]">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Membros da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              {!worshipTeam.members || worshipTeam.members.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Adicione membros em Gerencial → Equipes
                </div>
              ) : (
                <div className="space-y-1.5">
                  {worshipTeam.members
                    .filter((member) => member.ativo !== false)
                    .sort((a, b) =>
                      (a.user?.nome || "").localeCompare(
                        b.user?.nome || "",
                        "pt-BR",
                        { sensitivity: "base" },
                      ),
                    )
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {member.user?.nome?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-4 text-foreground">
                            {member.user?.nome || "Membro sem nome"}
                          </p>
                          <p className="truncate text-[10px] leading-3 text-muted-foreground">
                            {member.functions && member.functions.length > 0
                              ? member.functions.map((fn) => fn.nome).join(", ")
                              : "Sem função"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de todas as escalas do mês */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Todas as Escalas —{" "}
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyScheduleGroups.map((group) => {
                const firstSchedule = group.schedules[0];
                const lastSchedule =
                  group.schedules[group.schedules.length - 1];
                const firstDate = parseISO(firstSchedule.date);
                const lastDate = parseISO(lastSchedule.date);
                const sameTeam = group.schedules.every(
                  (schedule) => schedule.title === firstSchedule.title,
                );
                const totalMembers = group.schedules.reduce(
                  (acc, schedule) => acc + (schedule.members?.length || 0),
                  0,
                );
                const totalSongs = group.schedules.reduce(
                  (acc, schedule) => acc + (schedule.songs?.length || 0),
                  0,
                );

                return (
                  <div
                    key={group.key}
                    className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
                  >
                    <div className="flex flex-col gap-2 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Fim de semana
                        </p>
                        <h3 className="text-sm font-semibold text-foreground">
                          {format(firstDate, "dd 'de' MMMM", { locale: ptBR })}
                          {firstSchedule.date !== lastSchedule.date &&
                            ` e ${format(lastDate, "dd", { locale: ptBR })}`}
                        </h3>
                        {sameTeam && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {firstSchedule.title || "Escala sem título"}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-background px-2 py-1">
                          {group.schedules.length} dia(s)
                        </span>
                        <span className="rounded-full bg-background px-2 py-1">
                          {totalMembers} membro(s)
                        </span>
                        {totalSongs > 0 && (
                          <span className="rounded-full bg-background px-2 py-1">
                            {totalSongs} música(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 p-3 md:grid-cols-2">
                      {group.schedules.map((schedule) => {
                        const status =
                          STATUS_LABELS[schedule.status] || STATUS_LABELS.draft;
                        const date = parseISO(schedule.date);
                        const isUserScheduled = isCurrentUserScheduled([
                          schedule,
                        ]);

                        return (
                          <div
                            key={schedule.id}
                            className={`group rounded-lg border bg-card transition-colors hover:border-primary/50 hover:bg-accent/40 ${
                              isUserScheduled
                                ? "border-emerald-500/70 bg-emerald-500/5 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/25"
                                : "border-border"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleViewSchedule(schedule)}
                              className="w-full p-3 text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`relative flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${
                                    isUserScheduled
                                      ? "bg-emerald-500/15"
                                      : "bg-primary/10"
                                  }`}
                                >
                                  {isUserScheduled && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                                      <BellRing className="h-3 w-3" />
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] font-semibold uppercase ${
                                      isUserScheduled
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-primary"
                                    }`}
                                  >
                                    {format(date, "EEE", { locale: ptBR })}
                                  </span>
                                  <span
                                    className={`text-xl font-bold leading-none ${
                                      isUserScheduled
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-primary"
                                    }`}
                                  >
                                    {format(date, "dd")}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {schedule.title || "Escala sem título"}
                                    </p>
                                    {isUserScheduled && (
                                      <span className="hidden shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:inline-flex">
                                        Sua escala
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {isUserScheduled && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        <UserCheck className="h-3 w-3" />
                                        Você
                                      </span>
                                    )}
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs ${status.color}`}
                                    >
                                      {status.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {schedule.members?.length || 0} membro(s)
                                      {(schedule.songs?.length || 0) > 0 &&
                                        ` · ${schedule.songs!.length} música(s)`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>

                            <div className="flex flex-wrap justify-end gap-1 border-t bg-muted/20 px-2 py-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleViewSchedule(schedule)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleEditSchedule(schedule)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => setDeletingSchedule(schedule)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setEditingSchedule(null);
            setSelectedFixedTeamId(null);
          }
        }}
        teamId={worshipTeam.id}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        initialFixedTeamId={selectedFixedTeamId}
        schedule={editingSchedule}
        onSuccess={() => {
          refetch();
          setEditingSchedule(null);
        }}
      />

      <WorshipFixedTeamModal
        open={showFixedTeamModal}
        onOpenChange={(open) => {
          setShowFixedTeamModal(open);
          if (!open) setEditingFixedTeam(null);
        }}
        teamId={worshipTeam.id}
        members={worshipTeam.members || []}
        functions={teamFunctions}
        preset={editingFixedTeam}
        onSuccess={loadFixedTeamData}
      />

      <Dialog open={showWhatsAppExport} onOpenChange={setShowWhatsAppExport}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Exportar escala mensal para WhatsApp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              readOnly
              value={monthlyWhatsAppText}
              className="min-h-[420px] resize-none whitespace-pre-wrap font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Revise o texto, copie e cole no grupo do WhatsApp.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowWhatsAppExport(false)}
            >
              Fechar
            </Button>
            <Button className="gap-2" onClick={handleCopyWhatsAppExport}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedSchedule && (
        <ScheduleDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          schedule={selectedSchedule}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditSchedule(selectedSchedule);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            setDeletingSchedule(selectedSchedule);
          }}
        />
      )}

      <AlertDialog
        open={!!deletingSchedule}
        onOpenChange={(open) => !open && setDeletingSchedule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              A escala{" "}
              <strong>
                "
                {deletingSchedule?.title ||
                  (deletingSchedule
                    ? format(parseISO(deletingSchedule.date), "dd/MM/yyyy")
                    : "")}
                "
              </strong>{" "}
              será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() =>
                deletingSchedule && handleDeleteSchedule(deletingSchedule)
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingFixedTeam}
        onOpenChange={(open) => !open && setDeletingFixedTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              A equipe <strong>{deletingFixedTeam?.nome}</strong> será removida
              das opções rápidas de escala. As escalas já criadas não serão
              alteradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() =>
                deletingFixedTeam && handleDeleteFixedTeam(deletingFixedTeam)
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
