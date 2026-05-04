import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  CalendarDays,
  Users,
  Music2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Home,
  Mic2,
  Guitar,
  Drum,
  Piano,
  Radio,
  MonitorPlay,
  Volume2,
  Circle,
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
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Schedule, TeamFunction, TeamMember } from "@/types";
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

function normalizeText(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFunctionPriority(name: string) {
  const n = normalizeText(name);
  if (n === "vocal") return 0;
  if (n === "backvocal" || n === "back vocal") return 1;
  return 2;
}

function getFunctionIcon(name: string) {
  const n = normalizeText(name);
  if (n === "vocal" || n === "backvocal" || n === "back vocal") return Mic2;
  if (n === "guitarra" || n === "baixo") return Guitar;
  if (n === "bateria") return Drum;
  if (n === "teclado") return Piano;
  if (n === "som") return Volume2;
  if (n === "projecao") return MonitorPlay;
  if (n === "transmissao") return Radio;
  return Circle;
}

function sortByPriority<
  T extends { priority: number; name?: string; memberName?: string },
>(arr: T[]) {
  return arr.sort((a, b) => {
    const d = a.priority - b.priority;
    if (d !== 0) return d;
    const na = a.name || a.memberName || "";
    const nb = b.name || b.memberName || "";
    return na.localeCompare(nb, "pt-BR", { sensitivity: "base" });
  });
}

function getScheduleMemberRows(schedule: Schedule) {
  return sortByPriority(
    (schedule.members || []).map((m) => {
      const fns = [...(m.functions || [])].sort(
        (a, b) => getFunctionPriority(a.nome) - getFunctionPriority(b.nome),
      );
      return {
        id: m.id,
        name: m.team_member?.user?.nome || "Membro removido",
        functions: fns,
        priority: fns[0] ? getFunctionPriority(fns[0].nome) : 99,
      };
    }),
  );
}

function getPresetMemberRows(
  preset: WorshipFixedTeam,
  members: TeamMember[] = [],
  fns: TeamFunction[] = [],
) {
  return sortByPriority(
    Array.from(new Set(preset.members.map((m) => m.team_member_id))).map(
      (id) => {
        const member = members.find((m) => m.id === id);
        const functions = preset.members
          .filter((m) => m.team_member_id === id)
          .map((m) => fns.find((f) => f.id === m.function_id))
          .filter(Boolean) as TeamFunction[];
        const sorted = functions.sort(
          (a, b) => getFunctionPriority(a.nome) - getFunctionPriority(b.nome),
        );
        return {
          memberId: id,
          memberName: member?.user?.nome || "Membro removido",
          functions: sorted,
          priority: sorted[0] ? getFunctionPriority(sorted[0].nome) : 99,
        };
      },
    ),
  );
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

function getMembersByFunction(schedule: Schedule, names: string[]) {
  const wanted = names.map(normalizeText);
  return (schedule.members || [])
    .filter((m) =>
      (m.functions || []).some((f) => wanted.includes(normalizeText(f.nome))),
    )
    .map((m) => (m.team_member?.user?.nome || "").trim().split(/\s+/)[0])
    .filter(Boolean);
}

function buildWhatsAppText(
  schedules: Schedule[],
  month: Date,
  teamName: string,
) {
  const mo = format(month, "MMMM", { locale: ptBR }).toUpperCase();
  const yr = format(month, "yyyy");
  const groups = groupSchedulesByWeekend(schedules).filter(
    (g) => g.schedules.length > 0,
  );
  const lines = [
    `🎶 ESCALA – ${mo} / ${yr}`,
    "",
    `📍 ${teamName.toUpperCase()}`,
    "",
  ];
  groups.forEach((g, i) => {
    const ss = g.schedules;
    const main = ss[0];
    const first = parseISO(ss[0].date);
    const last = parseISO(ss[ss.length - 1].date);
    if (ss.length === 1) {
      lines.push(
        `🗓 *${format(first, "EEEE", { locale: ptBR }).toUpperCase()}* - ${format(first, "dd")}`,
      );
    } else {
      lines.push(
        `🗓 *${format(first, "EEEE", { locale: ptBR }).toUpperCase()}* ${format(first, "dd")} e *${format(last, "EEEE", { locale: ptBR }).toUpperCase()}* ${format(last, "dd")}`,
      );
    }
    const fmt = (ns: string[]) => (ns.length ? ns.join(", ") : "-");
    lines.push(
      `🎙️ Ministros: ${fmt(getMembersByFunction(main, ["Vocal"]))}`,
      `🎙️ Backs: ${fmt(getMembersByFunction(main, ["BackVocal", "Back Vocal"]))}`,
      `🎹 Teclado: ${fmt(getMembersByFunction(main, ["Teclado"]))}`,
      `🎸 Guitarra: ${fmt(getMembersByFunction(main, ["Guitarra"]))}`,
      `🥁 Bateria: ${fmt(getMembersByFunction(main, ["Bateria"]))}`,
      `🎸 Baixo: ${fmt(getMembersByFunction(main, ["Baixo"]))}`,
    );
    if (i < groups.length - 1) lines.push("");
  });
  return lines.join("\n").trim();
}

// ── Componente: Seção colapsável ─────────────────────────────
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
      {/* Header dividido: botão de toggle + action separados para evitar button>button */}
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

// ── Componente: Card de escala compacto ──────────────────────
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
  const memberRows = getScheduleMemberRows(schedule);
  const songs = [...(schedule.songs || [])].sort(
    (a, b) => a.order_index - b.order_index,
  );

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

      {/* Membros */}
      {memberRows.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memberRows.map((row) => {
            const FnIcon = row.functions[0]
              ? getFunctionIcon(row.functions[0].nome)
              : Circle;
            return (
              <div
                key={row.id}
                className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5"
              >
                <FnIcon className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="text-xs font-medium">
                  {row.name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Músicas */}
      {songs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Music2 className="h-3 w-3" />
          <span>
            {songs
              .map((s) => s.song?.name)
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export function WorshipDashboard() {
  const { toast } = useToast();
  const { user, profiles } = useAuthStore();
  const [tab, setTab] = useState<"inicio" | "agenda">("inicio");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFixedTeamModal, setShowFixedTeamModal] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
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
  const [generating, setGenerating] = useState(false);

  const { teams, loading: loadingTeams } = useTeams();
  const worshipTeam = teams.find((t) => t.team_type?.codigo === "louvor");
  const {
    schedules,
    loading: loadingSchedules,
    refetch,
  } = useSchedules(worshipTeam?.id || "", currentMonth);
  const deleteSchedule = useDeleteSchedule();

  const canManage =
    !!user &&
    (isGerencial(profiles || []) || isLeader(profiles || [], "louvor"));

  const loadFixedTeams = async () => {
    if (!worshipTeam) return;
    try {
      setLoadingFixedTeams(true);
      const [presets, fns] = await Promise.all([
        worshipFixedTeamService.getByTeamId(worshipTeam.id),
        worshipTeam.team_type_id
          ? teamService.getTeamFunctions(worshipTeam.team_type_id)
          : Promise.resolve([]),
      ]);
      setFixedTeams(presets);
      setTeamFunctions(fns);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao carregar equipes padrão",
      });
    } finally {
      setLoadingFixedTeams(false);
    }
  };

  useEffect(() => {
    loadFixedTeams();
  }, [worshipTeam?.id]);

  // Calendário
  const monthStart = startOfMonth(currentMonth);
  const calDays = Array.from({ length: 42 }, (_, i) =>
    addDays(monthStart, i - getDay(monthStart)),
  );
  const getDaySchedules = (day: Date) =>
    schedules.filter((s) => s.date === format(day, "yyyy-MM-dd"));
  const selectedDaySchedules = getDaySchedules(selectedDate);
  const whatsAppText = buildWhatsAppText(
    schedules,
    currentMonth,
    worshipTeam?.nome || "Louvor",
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

  const handleDeleteFixedTeam = async (preset: WorshipFixedTeam) => {
    try {
      await worshipFixedTeamService.delete(preset.id);
      toast({ title: "Equipe padrão excluída!" });
      setDeletingFixedTeam(null);
      loadFixedTeams();
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir equipe padrão" });
    }
  };

  const handleGenerateMonthly = async () => {
    if (!worshipTeam) return;
    try {
      setGenerating(true);
      const result = await worshipAutoScheduleService.generateMonthly(
        worshipTeam.id,
        currentMonth,
      );
      toast({
        title: "Escala mensal gerada!",
        description: `${result.created} criada(s), ${result.skipped} preservada(s).`,
      });
      refetch();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar escala mensal",
        description: e.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loadingTeams)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  if (!worshipTeam)
    return (
      <EmptyState
        icon={Users}
        title="Equipe de Louvor não encontrada"
        description="Crie uma equipe do tipo Louvor em Gerencial → Equipes."
      />
    );

  return (
    <div className="pb-20 space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🎵 Louvor</h1>
          <p className="text-xs text-muted-foreground">{worshipTeam.nome}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setShowWhatsApp(true)}
              disabled={schedules.length === 0}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleGenerateMonthly}
              disabled={generating}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {generating ? "Gerando..." : "Gerar Escala Mensal"}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Calendário ── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Navegação do mês */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
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

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  if (!inMonth) setCurrentMonth(day);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center h-10 rounded-xl text-sm font-semibold transition-all",
                  isSelected && "bg-primary text-primary-foreground shadow-md",
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
                {hasSchedule && (
                  <span
                    className={cn(
                      "absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold",
                      isSelected
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {daySchedules.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conteúdo por aba ── */}
      {tab === "inicio" && (
        <div className="space-y-3">
          {/* Escala do dia selecionado */}
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
                    setSelectedFixedTeamId(null);
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

          {/* Equipes padrão */}
          {canManage && (
            <CollapsibleSection
              icon={Music2}
              title="Equipes padrão"
              badge={fixedTeams.length > 0 ? fixedTeams.length : undefined}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 mr-1"
                  onClick={() => {
                    setEditingFixedTeam(null);
                    setShowFixedTeamModal(true);
                  }}
                >
                  <Plus className="h-3 w-3" /> Nova
                </Button>
              }
            >
              {loadingFixedTeams ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : fixedTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Nenhuma equipe padrão cadastrada
                </p>
              ) : (
                <div className="space-y-2">
                  {fixedTeams.map((preset) => {
                    const rows = getPresetMemberRows(
                      preset,
                      worshipTeam.members || [],
                      teamFunctions,
                    );
                    return (
                      <div
                        key={preset.id}
                        className="rounded-xl border border-border bg-background p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{preset.nome}</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingFixedTeam(preset);
                                setShowFixedTeamModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingFixedTeam(preset)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rows.map((row) => {
                            const FnIcon = row.functions[0]
                              ? getFunctionIcon(row.functions[0].nome)
                              : Circle;
                            return (
                              <div
                                key={row.memberId}
                                className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5"
                              >
                                <FnIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <span className="text-xs font-medium">
                                  {row.memberName.split(" ")[0]}
                                </span>
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

          {/* Membros da equipe */}
          <CollapsibleSection
            icon={Users}
            title="Membros da Equipe"
            badge={worshipTeam.members?.length || 0}
          >
            {!worshipTeam.members || worshipTeam.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                Nenhum membro na equipe
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {worshipTeam.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-muted/50"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {m.user?.nome?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {m.user?.nome?.split(" ")[0]}
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
          </CollapsibleSection>
        </div>
      )}

      {/* ── Aba Agenda ── */}
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
            <div className="space-y-2">
              {schedules.map((s) => {
                const status = STATUS_LABELS[s.status] || STATUS_LABELS.draft;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSchedule(s);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="text-center min-w-[40px]">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {format(parseISO(s.date), "EEE", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-bold text-primary leading-none">
                        {format(parseISO(s.date), "dd")}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {s.title || "Escala sem título"}
                      </p>
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
                          {s.members?.length || 0} membros
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
          )}
        </CollapsibleSection>
      )}

      {/* ── Bottom Navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-sm md:left-56">
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
            <span>AGENDA</span>
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
        teamId={worshipTeam.id}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        schedule={editingSchedule}
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

      <WorshipFixedTeamModal
        open={showFixedTeamModal}
        onOpenChange={(o) => {
          setShowFixedTeamModal(o);
          if (!o) setEditingFixedTeam(null);
        }}
        teamId={worshipTeam.id}
        members={worshipTeam.members || []}
        functions={teamFunctions}
        preset={editingFixedTeam}
        onSuccess={() => {
          setShowFixedTeamModal(false);
          loadFixedTeams();
        }}
      />

      {/* AlertDialog: excluir escala */}
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

      {/* AlertDialog: excluir equipe padrão */}
      <AlertDialog
        open={!!deletingFixedTeam}
        onOpenChange={(o) => !o && setDeletingFixedTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              A equipe <strong>"{deletingFixedTeam?.nome}"</strong> será
              removida permanentemente.
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

      {/* Dialog: exportar WhatsApp */}
      <Dialog open={showWhatsApp} onOpenChange={setShowWhatsApp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📱 Exportar para WhatsApp</DialogTitle>
          </DialogHeader>
          <Textarea
            value={whatsAppText}
            readOnly
            rows={12}
            className="font-mono text-xs resize-none"
          />
          <DialogFooter>
            <button
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
              className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Copiar texto
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
