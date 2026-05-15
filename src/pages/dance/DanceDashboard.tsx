import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  CalendarDays,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Home,
  PersonStanding,
  Music2,
} from "lucide-react";
import { CreateScheduleModal } from "@/components/features/schedules/CreateScheduleModal";
import { ScheduleDetailModal } from "@/components/features/schedules/ScheduleDetailModal";
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
import { scheduleService } from "@/services/scheduleService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { DanceIcon } from "@/components/shared/MinistryIcons";
import {
  format,
  parseISO,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  startOfMonth,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Schedule, ScheduleMember } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { isGerencial, isLeader } from "@/lib/permissions";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

// ── Utilitários ──────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  published: {
    label: "Publicada",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  completed: { label: "Concluída", color: "bg-primary/15 text-primary" },
};

function getScheduleMemberUserId(member: ScheduleMember) {
  return member.team_member?.user_id || member.team_member?.user?.id;
}

function getScheduleMemberName(member: ScheduleMember) {
  return member.team_member?.user?.nome || "Membro removido";
}

function isScheduleMemberUser(member: ScheduleMember, userId?: string) {
  return !!userId && getScheduleMemberUserId(member) === userId;
}

function groupSchedulesByWeekend(schedules: Schedule[]) {
  const groups = new Map<string, Schedule[]>();
  schedules.forEach((s) => {
    const date = parseISO(s.date);
    const wd = getDay(date);
    const key = format(wd === 0 ? addDays(date, -1) : date, "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) || []), s]);
  });
  return Array.from(groups.entries())
    .map(([key, ss]) => ({
      key,
      schedules: ss.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function getMembersByFunction(schedule: Schedule) {
  const groups = new Map<string, string[]>();

  (schedule.members || []).forEach((member) => {
    const name = getScheduleMemberName(member).split(" ")[0];
    const functions = member.functions?.length
      ? member.functions.map((fn) => fn.nome)
      : ["Sem funcao"];

    functions.forEach((functionName) => {
      groups.set(functionName, [...(groups.get(functionName) || []), name]);
    });
  });

  return Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
  );
}

function getDanceSongRows(schedule: Schedule) {
  return [...(schedule.songs || [])]
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      name: item.song?.name || "Musica sem nome",
      key: item.execution_key || item.song?.original_key || "",
    }));
}

function getWorshipSongRows(
  worshipSchedules: Awaited<
    ReturnType<typeof scheduleService.getSchedulesByTeamType>
  >,
  date: string,
) {
  return worshipSchedules
    .filter((schedule) => schedule.date === date)
    .flatMap((schedule) => schedule.songs || [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      name: item.song?.name || "Musica sem nome",
      key: item.execution_key || item.song?.original_key || "",
    }));
}

function appendSongBlock(
  lines: string[],
  title: string,
  songs: Array<{ name: string; key: string }>,
) {
  if (songs.length === 0) return;

  lines.push(title);
  songs.forEach((song, index) => {
    lines.push(
      String(index + 1) + ". " + song.name + (song.key ? " - " + song.key : ""),
    );
  });
}

function buildWhatsAppText(
  schedules: Schedule[],
  month: Date,
  teamName: string,
  worshipSchedules: Awaited<
    ReturnType<typeof scheduleService.getSchedulesByTeamType>
  >,
) {
  const mo = format(month, "MMMM", { locale: ptBR }).toUpperCase();
  const yr = format(month, "yyyy");
  const groups = groupSchedulesByWeekend(schedules).filter(
    (g) => g.schedules.length > 0,
  );

  const lines = [
    "ESCALA DANCA - " + mo + " / " + yr,
    "",
    teamName.toUpperCase(),
    "",
  ];

  groups.forEach((g, i) => {
    const ss = g.schedules;
    const first = parseISO(ss[0].date);
    const last = parseISO(ss[ss.length - 1].date);

    if (ss.length === 1) {
      lines.push(
        format(first, "EEEE", { locale: ptBR }).toUpperCase() +
          " - " +
          format(first, "dd"),
      );
    } else {
      lines.push(
        format(first, "EEEE", { locale: ptBR }).toUpperCase() +
          " " +
          format(first, "dd") +
          " e " +
          format(last, "EEEE", { locale: ptBR }).toUpperCase() +
          " " +
          format(last, "dd"),
      );
    }

    ss.forEach((schedule) => {
      if (ss.length > 1) {
        lines.push(
          format(parseISO(schedule.date), "EEEE dd/MM", { locale: ptBR }),
        );
      }

      appendSongBlock(
        lines,
        "Musicas do Louvor:",
        getWorshipSongRows(worshipSchedules, schedule.date),
      );
      appendSongBlock(lines, "Musicas da Danca:", getDanceSongRows(schedule));

      const rows = getMembersByFunction(schedule);
      if (rows.length > 0) {
        lines.push("Funcoes:");
        rows.forEach(([functionName, names]) => {
          lines.push(functionName + ": " + names.join(", "));
        });
      }
    });

    if (i < groups.length - 1) lines.push("");
  });

  return lines.join("\n").trim();
}

interface CollapsibleSectionProps {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  icon: Icon,
  title,
  badge,
  action,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex w-full items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
        >
          <Icon className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="flex-1 font-semibold text-foreground truncate">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-xs text-muted-foreground mr-1">{badge}</span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
}

// ── Componente: Card de escala ───────────────────────────────
function ScheduleCard({
  schedule,
  onView,
  onEdit,
  onDelete,
  canManage,
}: {
  schedule: Schedule;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}) {
  const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft;
  const members = schedule.members || [];

  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {schedule.title ||
              format(parseISO(schedule.date), "EEEE", { locale: ptBR })}
          </p>
          <span
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full mt-0.5",
              status.color,
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onView}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {canManage && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dançarinos */}
      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5"
            >
              <PersonStanding className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-xs font-medium">
                {getScheduleMemberName(m).split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export function DanceDashboard() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const handledScheduleParamRef = useRef<string | null>(null);
  const { user, profiles } = useAuthStore();
  const [tab, setTab] = useState<"inicio" | "agenda">("inicio");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null,
  );

  const { teams, loading: loadingTeams } = useTeams();
  const danceTeam = teams.find((t) => t.team_type?.codigo === "danca");
  const {
    schedules,
    loading: loadingSchedules,
    refetch,
  } = useSchedules(danceTeam?.id || "", currentMonth);
  const deleteSchedule = useDeleteSchedule();

  const dateParam = searchParams.get("date");
  const scheduleParam = searchParams.get("schedule");

  // Escalas do Louvor para mostrar músicas no calendário da Dança
  const [worshipSchedules, setWorshipSchedules] = useState<
    Awaited<ReturnType<typeof scheduleService.getSchedulesByTeamType>>
  >([]);

  useEffect(() => {
    scheduleService
      .getSchedulesByTeamType("louvor", currentMonth)
      .then(setWorshipSchedules)
      .catch(() => setWorshipSchedules([]));
  }, [currentMonth]);

  const canManage =
    !!user &&
    (isGerencial(profiles || []) || isLeader(profiles || [], "danca"));

  useEffect(() => {
    if (!dateParam) return;
    const targetDate = parseISO(dateParam);
    if (Number.isNaN(targetDate.getTime())) return;

    setTab("inicio");
    setSelectedDate(targetDate);
    setCurrentMonth(targetDate);
  }, [dateParam]);

  useEffect(() => {
    if (!scheduleParam || loadingSchedules) return;
    if (handledScheduleParamRef.current === scheduleParam) return;

    const schedule = schedules.find((item) => item.id === scheduleParam);
    if (!schedule) return;

    handledScheduleParamRef.current = scheduleParam;
    setSelectedSchedule(schedule);
    setSelectedDate(parseISO(schedule.date));
    setCurrentMonth(parseISO(schedule.date));
    setTab("inicio");
    setShowDetailModal(true);
  }, [loadingSchedules, scheduleParam, schedules]);

  // Calendário
  const monthStart = startOfMonth(currentMonth);
  const calDays = Array.from({ length: 42 }, (_, i) =>
    addDays(monthStart, i - getDay(monthStart)),
  );
  const getDaySchedules = (day: Date) =>
    schedules.filter((s) => s.date === format(day, "yyyy-MM-dd"));
  const selectedDaySchedules = getDaySchedules(selectedDate);

  // Músicas do Louvor para o dia selecionado
  const getWorshipSongsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const ws = worshipSchedules.filter((s) => s.date === dateStr);
    const allSongs = ws.flatMap((s) =>
      [...(s.songs || [])].sort((a, b) => a.order_index - b.order_index),
    );
    return { schedules: ws, songs: allSongs };
  };
  const selectedDayWorship = getWorshipSongsForDay(selectedDate);

  const whatsAppText = buildWhatsAppText(
    schedules,
    currentMonth,
    danceTeam?.nome || "Dança",
    worshipSchedules,
  );

  const handleDelete = async (schedule: Schedule) => {
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast({ title: "Escala excluída!" });
      setDeletingSchedule(null);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir escala" });
    }
  };

  if (loadingTeams)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );

  if (!danceTeam)
    return (
      <EmptyState
        icon={Users}
        title="Equipe de Dança não encontrada"
        description="Crie uma equipe do tipo Dança em Gerencial → Equipes."
      />
    );

  return (
    <div className="pb-20 space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <DanceIcon className="h-9 w-9" />
            Dança
          </h1>
          <p className="text-xs text-muted-foreground">{danceTeam.nome}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-2.5 text-xs sm:rounded-md sm:px-3"
              onClick={() => setShowWhatsApp(true)}
              disabled={schedules.length === 0}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar WhatsApp</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Layout principal: grid 2 colunas no desktop ── */}
      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-4 lg:items-start space-y-3 lg:space-y-0">
        {/* ── Coluna esquerda ── */}
        <div className="space-y-3">
          {/* Calendário */}
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold capitalize sm:text-lg">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  Selecione a data desejada
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((day) => {
                const daySchedules = getDaySchedules(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentMonth);
                const hasSchedule = daySchedules.length > 0;
                const hasWorshipSongs = worshipSchedules.some(
                  (s) =>
                    s.date === format(day, "yyyy-MM-dd") &&
                    (s.songs || []).length > 0,
                );
                const isUserScheduled =
                  !!user &&
                  daySchedules.some((s) =>
                    (s.members || []).some((m: ScheduleMember) =>
                      isScheduleMemberUser(m, user.id),
                    ),
                  );

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!inMonth) setCurrentMonth(day);
                    }}
                    onDoubleClick={() => {
                      setSelectedDate(day);
                      if (!inMonth) setCurrentMonth(day);
                      if (daySchedules.length > 0) {
                        // Tem escala → abre visualização
                        setSelectedSchedule(daySchedules[0]);
                        setShowDetailModal(true);
                      } else if (canManage) {
                        // Sem escala e pode gerenciar → abre criação
                        setEditingSchedule(null);
                        setShowCreateModal(true);
                      }
                    }}
                    className={cn(
                      "relative flex h-9 flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all sm:h-10",
                      isSelected &&
                        "bg-primary text-primary-foreground shadow-md",
                      !isSelected &&
                        hasSchedule &&
                        "border border-primary/60 text-foreground hover:bg-primary/10",
                      !isSelected &&
                        !hasSchedule &&
                        inMonth &&
                        "text-foreground hover:bg-accent",
                      !isSelected && !inMonth && "text-muted-foreground/30",
                      isToday && !isSelected && "ring-2 ring-primary/30",
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {(hasSchedule || isUserScheduled || hasWorshipSongs) && (
                      <div className="absolute bottom-1 flex items-center gap-0.5">
                        {hasSchedule && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected
                                ? "bg-primary-foreground"
                                : "bg-primary",
                            )}
                          />
                        )}
                        {isUserScheduled && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-emerald-200" : "bg-emerald-500",
                            )}
                          />
                        )}
                        {hasWorshipSongs && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-amber-200" : "bg-amber-500",
                            )}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Tem escala
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Você escalado(a)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Músicas do Louvor
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full ring-2 ring-primary/30 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Hoje</span>
              </div>
            </div>
          </div>

          {/* ── Aba Início ── */}
          {tab === "inicio" && (
            <div className="space-y-3">
              <CollapsibleSection
                icon={Calendar}
                title={`Escala de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`}
                badge={
                  selectedDaySchedules.length > 0
                    ? `${selectedDaySchedules.length}`
                    : undefined
                }
                defaultOpen
                action={
                  canManage ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 mr-1"
                      onClick={() => {
                        setEditingSchedule(null);
                        setShowCreateModal(true);
                      }}
                    >
                      <Plus className="h-3 w-3" /> Nova
                    </Button>
                  ) : undefined
                }
              >
                {loadingSchedules ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : selectedDaySchedules.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Nenhuma escala neste dia
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDaySchedules.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        canManage={canManage}
                        onView={() => {
                          setSelectedSchedule(s);
                          setShowDetailModal(true);
                        }}
                        onEdit={() => {
                          setEditingSchedule(s);
                          setShowCreateModal(true);
                        }}
                        onDelete={() => setDeletingSchedule(s)}
                      />
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Musicas do Louvor no dia selecionado */}
              {selectedDayWorship.schedules.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Music2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Musicas do Louvor
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {selectedDayWorship.songs.length} musica
                      {selectedDayWorship.songs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {selectedDayWorship.songs.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedDayWorship.songs.map((ss, index) => {
                        const song = ss.song;
                        const songKey = ss.execution_key || song.original_key;

                        return (
                          <div
                            key={`${song.id}-${index}`}
                            className="flex items-center gap-2 rounded-lg border border-amber-500/10 bg-card/80 px-2.5 py-2"
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {song.name}
                              </p>
                              {song.artist && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {song.artist}
                                </p>
                              )}
                            </div>
                            {songKey && (
                              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                {songKey}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      O Louvor tem escala neste dia mas ainda nao adicionou
                      musicas.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Aba Escala Geral ── */}
          {tab === "agenda" && (
            <CollapsibleSection
              icon={CalendarDays}
              title={`Todas as Escalas — ${format(currentMonth, "MMMM yyyy", { locale: ptBR })}`}
              badge={schedules.length}
              defaultOpen
            >
              {loadingSchedules ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma escala este mês
                </p>
              ) : (
                <div className="space-y-3">
                  {groupSchedulesByWeekend(schedules).map((group) => {
                    const ss = group.schedules;
                    const isUserInGroup =
                      !!user &&
                      ss.some((s) =>
                        (s.members || []).some((m) =>
                          isScheduleMemberUser(m, user.id),
                        ),
                      );

                    if (ss.length === 1) {
                      const s = ss[0];
                      const status =
                        STATUS_LABELS[s.status] || STATUS_LABELS.draft;
                      return (
                        <div
                          key={group.key}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                            isUserInGroup
                              ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                              : "border-border hover:bg-accent",
                          )}
                          onClick={() => {
                            setSelectedSchedule(s);
                            setShowDetailModal(true);
                          }}
                        >
                          <div className="text-center min-w-[40px]">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              {format(parseISO(s.date), "EEE", {
                                locale: ptBR,
                              })}
                            </p>
                            <p className="text-lg font-bold text-primary leading-none">
                              {format(parseISO(s.date), "dd")}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">
                                {s.title || "Escala sem título"}
                              </p>
                              {isUserInGroup && (
                                <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-full",
                                  status.color,
                                )}
                              >
                                {status.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {s.members?.length || 0} dançarinos
                              </span>
                            </div>
                          </div>
                          {canManage && (
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEditingSchedule(s);
                                  setShowCreateModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingSchedule(s)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Grupo de fim de semana
                    const firstDate = parseISO(ss[0].date);
                    const lastDate = parseISO(ss[ss.length - 1].date);
                    const rangeLabel = `${format(firstDate, "dd")} – ${format(lastDate, "dd 'de' MMMM", { locale: ptBR })}`;

                    return (
                      <div
                        key={group.key}
                        className={cn(
                          "rounded-xl border overflow-hidden",
                          isUserInGroup
                            ? "border-emerald-500/40"
                            : "border-border",
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-between px-3 py-2",
                            isUserInGroup ? "bg-emerald-500/10" : "bg-muted/50",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wide truncate">
                              Fim de semana · {rangeLabel}
                            </span>
                            {isUserInGroup && (
                              <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                ✓ Você
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {ss.length} escalas
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {ss.map((s) => {
                            const status =
                              STATUS_LABELS[s.status] || STATUS_LABELS.draft;
                            const isUserInSchedule =
                              !!user &&
                              (s.members || []).some((m) =>
                                isScheduleMemberUser(m, user.id),
                              );
                            return (
                              <div
                                key={s.id}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedSchedule(s);
                                  setShowDetailModal(true);
                                }}
                              >
                                <div className="text-center min-w-[36px]">
                                  <p className="text-[10px] text-muted-foreground uppercase leading-none">
                                    {format(parseISO(s.date), "EEE", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                  <p className="text-base font-bold text-primary leading-tight">
                                    {format(parseISO(s.date), "dd")}
                                  </p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium truncate">
                                      {s.title ||
                                        format(parseISO(s.date), "EEEE", {
                                          locale: ptBR,
                                        })}
                                    </p>
                                    {isUserInSchedule && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span
                                      className={cn(
                                        "text-xs px-1.5 py-0.5 rounded-full",
                                        status.color,
                                      )}
                                    >
                                      {status.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {s.members?.length || 0} dançarinos
                                    </span>
                                  </div>
                                </div>
                                {canManage && (
                                  <div
                                    className="flex gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setEditingSchedule(s);
                                        setShowCreateModal(true);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingSchedule(s)}
                                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>
          )}
        </div>

        {/* ── Coluna direita: Membros (sticky) ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden lg:sticky lg:top-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <PersonStanding className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-sm text-foreground flex-1">
              Dançarinos
            </span>
            <span className="text-xs text-muted-foreground">
              {danceTeam.members?.length || 0}
            </span>
          </div>
          <div className="p-3">
            {!danceTeam.members || danceTeam.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                Nenhum membro
              </p>
            ) : (
              <div className="space-y-1">
                {danceTeam.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {m.user?.nome?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-tight">
                        {m.user?.nome?.split(" ").slice(0, 2).join(" ")}
                      </p>
                      {m.functions && m.functions.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {m.functions.map((f) => f.nome).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 rounded-full border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm md:hidden">
        <button
          onClick={() => setTab("inicio")}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all",
            tab === "inicio"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home className="h-4 w-4" />
          <span>INÍCIO</span>
        </button>
        <button
          onClick={() => setTab("agenda")}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all",
            tab === "agenda"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4" />
          <span>ESCALA</span>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 hidden border-t border-border bg-background/95 backdrop-blur-sm md:left-56 md:flex">
        <button
          onClick={() => setTab("inicio")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all",
            tab === "inicio"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full transition-all",
              tab === "inicio" && "bg-foreground text-background",
            )}
          >
            <Home className="h-4 w-4" />
            <span>INÍCIO</span>
          </div>
        </button>
        <button
          onClick={() => setTab("agenda")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all",
            tab === "agenda"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full transition-all",
              tab === "agenda" && "bg-foreground text-background",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            <span>ESCALA GERAL</span>
          </div>
        </button>
      </div>

      {/* ── Modais ── */}
      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={(o) => {
          setShowCreateModal(o);
          if (!o) setEditingSchedule(null);
        }}
        teamId={danceTeam.id}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        schedule={editingSchedule}
        worshipSongs={(() => {
          const dateStr =
            editingSchedule?.date || format(selectedDate, "yyyy-MM-dd");
          const ws = worshipSchedules.filter((s) => s.date === dateStr);
          if (ws.length === 0) return undefined;
          return ws.flatMap((s) =>
            [...(s.songs || [])].sort((a, b) => a.order_index - b.order_index),
          );
        })()}
        onSuccess={() => {
          refetch();
          setEditingSchedule(null);
        }}
      />

      {selectedSchedule && (
        <ScheduleDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          schedule={selectedSchedule}
          worshipSongs={(() => {
            const dateStr = selectedSchedule.date;
            const ws = worshipSchedules.filter((s) => s.date === dateStr);
            if (ws.length === 0) return undefined; // sem escala do Louvor = não mostra nada
            return ws.flatMap((s) =>
              [...(s.songs || [])].sort(
                (a, b) => a.order_index - b.order_index,
              ),
            );
          })()}
          onEdit={() => {
            setShowDetailModal(false);
            setEditingSchedule(selectedSchedule);
            setShowCreateModal(true);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            setDeletingSchedule(selectedSchedule);
          }}
        />
      )}

      <AlertDialog
        open={!!deletingSchedule}
        onOpenChange={(o) => !o && setDeletingSchedule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingSchedule && handleDelete(deletingSchedule)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: exportar WhatsApp */}
      <Dialog open={showWhatsApp} onOpenChange={setShowWhatsApp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-green-500" />
              Exportar Mês para WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div data-dialog-body="" className="px-4 py-4 space-y-3">
            <Textarea
              value={whatsAppText}
              readOnly
              rows={12}
              className="font-mono text-xs resize-none bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Clique em Copiar para enviar no WhatsApp.
            </p>
          </div>
          <DialogFooter className="flex-row items-center gap-2 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWhatsApp(false)}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Fechar
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(whatsAppText);
                  toast({ title: "Copiado para a área de transferência!" });
                } catch {
                  toast({
                    variant: "destructive",
                    title: "Não foi possível copiar",
                  });
                }
              }}
              className="h-9 px-4 text-sm gap-2 font-medium"
            >
              <FileText className="h-3.5 w-3.5" />
              Copiar texto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
