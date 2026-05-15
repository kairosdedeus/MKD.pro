import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  addDays,
  addMonths,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Home,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { CreateScheduleModal } from "@/components/features/schedules/CreateScheduleModal";
import { ScheduleDetailModal } from "@/components/features/schedules/ScheduleDetailModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UshersIcon } from "@/components/shared/MinistryIcons";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSchedules, useDeleteSchedule } from "@/hooks/useSchedules";
import { useTeams } from "@/hooks/useTeams";
import { isGerencial, isLeader } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Schedule, ScheduleMember } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  published: {
    label: "Publicada",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  completed: { label: "Concluida", color: "bg-primary/15 text-primary" },
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
  schedules.forEach((schedule) => {
    const date = parseISO(schedule.date);
    const weekday = getDay(date);
    const key = format(weekday === 0 ? addDays(date, -1) : date, "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) || []), schedule]);
  });

  return Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      schedules: items.sort((a, b) => a.date.localeCompare(b.date)),
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

function buildWhatsAppText(
  schedules: Schedule[],
  month: Date,
  teamName: string,
) {
  const monthName = format(month, "MMMM", { locale: ptBR }).toUpperCase();
  const year = format(month, "yyyy");
  const groups = groupSchedulesByWeekend(schedules);
  const lines = [`ESCALA OBREIROS - ${monthName} / ${year}`, "", teamName];

  groups.forEach((group, index) => {
    const first = parseISO(group.schedules[0].date);
    const last = parseISO(group.schedules[group.schedules.length - 1].date);

    lines.push("");
    if (group.schedules.length === 1) {
      lines.push(
        `${format(first, "EEEE", { locale: ptBR }).toUpperCase()} - ${format(first, "dd")}`,
      );
    } else {
      lines.push(
        `${format(first, "EEEE", { locale: ptBR }).toUpperCase()} ${format(first, "dd")} e ${format(last, "EEEE", { locale: ptBR }).toUpperCase()} ${format(last, "dd")}`,
      );
    }

    group.schedules.forEach((schedule) => {
      const rows = getMembersByFunction(schedule);
      if (rows.length === 0) {
        lines.push("Sem obreiros");
        return;
      }

      rows.forEach(([functionName, names]) => {
        lines.push(`${functionName}: ${names.join(", ")}`);
      });
    });

    if (index < groups.length - 1) lines.push("____________________________");
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex w-full items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
          <span className="flex-1 truncate font-semibold text-foreground">
            {title}
          </span>
          {badge !== undefined && (
            <span className="mr-1 text-xs text-muted-foreground">{badge}</span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
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
    <div className="space-y-2 rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {schedule.title ||
              format(parseISO(schedule.date), "EEEE", { locale: ptBR })}
          </p>
          <span
            className={cn(
              "mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs",
              status.color,
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          <button
            onClick={onView}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {canManage && (
            <>
              <button
                onClick={onEdit}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"
            >
              <Users className="h-3 w-3 flex-shrink-0 text-primary" />
              <span className="text-xs font-medium">
                {getScheduleMemberName(member).split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UshersDashboard() {
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
  const ushersTeam = teams.find(
    (team) => team.team_type?.codigo === "obreiros",
  );
  const {
    schedules,
    loading: loadingSchedules,
    refetch,
  } = useSchedules(ushersTeam?.id || "", currentMonth);
  const deleteSchedule = useDeleteSchedule();

  const dateParam = searchParams.get("date");
  const scheduleParam = searchParams.get("schedule");
  const canManage =
    !!user &&
    (isGerencial(profiles || []) || isLeader(profiles || [], "obreiros"));

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

  const monthStart = startOfMonth(currentMonth);
  const calendarDays = Array.from({ length: 42 }, (_, index) =>
    addDays(monthStart, index - getDay(monthStart)),
  );
  const getDaySchedules = (day: Date): Schedule[] =>
    schedules.filter(
      (schedule: Schedule) => schedule.date === format(day, "yyyy-MM-dd"),
    );
  const selectedDaySchedules = getDaySchedules(selectedDate);
  const whatsAppText = buildWhatsAppText(
    schedules,
    currentMonth,
    ushersTeam?.nome || "Obreiros",
  );

  const handleDelete = async (schedule: Schedule) => {
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast({ title: "Escala excluida!" });
      setDeletingSchedule(null);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir escala" });
    }
  };

  if (loadingTeams) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!ushersTeam) {
    return (
      <EmptyState
        icon={Users}
        title="Equipe de Obreiros nao encontrada"
        description="Crie uma equipe do tipo Obreiros em Gerencial -> Equipes."
      />
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <UshersIcon className="h-9 w-9" />
            Obreiros
          </h1>
          <p className="text-xs text-muted-foreground">{ushersTeam.nome}</p>
        </div>
        {canManage && (
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
        )}
      </div>

      <div className="space-y-3 lg:grid lg:grid-cols-[1fr_240px] lg:items-start lg:gap-4 lg:space-y-0">
        <div className="space-y-3">
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
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7">
              {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-bold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const daySchedules = getDaySchedules(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentMonth);
                const hasSchedule = daySchedules.length > 0;
                const isUserScheduled =
                  !!user &&
                  daySchedules.some((schedule) =>
                    (schedule.members || []).some((member) =>
                      isScheduleMemberUser(member, user.id),
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
                        setSelectedSchedule(daySchedules[0]);
                        setShowDetailModal(true);
                      } else if (canManage) {
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
                    {(hasSchedule || isUserScheduled) && (
                      <div className="absolute bottom-1 flex items-center gap-0.5">
                        {hasSchedule && (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected
                                ? "bg-primary-foreground"
                                : "bg-primary",
                            )}
                          />
                        )}
                        {isUserScheduled && (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected ? "bg-emerald-200" : "bg-emerald-500",
                            )}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">
                  Tem escala
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  Voce escalado(a)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-primary/30" />
                <span className="text-xs text-muted-foreground">Hoje</span>
              </div>
            </div>
          </div>

          {tab === "inicio" && (
            <CollapsibleSection
              icon={Calendar}
              title={`Escala de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`}
              badge={
                selectedDaySchedules.length > 0
                  ? selectedDaySchedules.length
                  : undefined
              }
              defaultOpen
              action={
                canManage ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-1 h-7 gap-1 text-xs"
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
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma escala neste dia
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDaySchedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      canManage={canManage}
                      onView={() => {
                        setSelectedSchedule(schedule);
                        setShowDetailModal(true);
                      }}
                      onEdit={() => {
                        setEditingSchedule(schedule);
                        setShowCreateModal(true);
                      }}
                      onDelete={() => setDeletingSchedule(schedule)}
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}

          {tab === "agenda" && (
            <CollapsibleSection
              icon={CalendarDays}
              title={`Todas as Escalas - ${format(currentMonth, "MMMM yyyy", { locale: ptBR })}`}
              badge={schedules.length}
              defaultOpen
            >
              {loadingSchedules ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : schedules.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma escala este mes
                </p>
              ) : (
                <div className="space-y-3">
                  {groupSchedulesByWeekend(schedules).map((group) => {
                    const isUserInGroup =
                      !!user &&
                      group.schedules.some((schedule) =>
                        (schedule.members || []).some((member) =>
                          isScheduleMemberUser(member, user.id),
                        ),
                      );
                    const firstDate = parseISO(group.schedules[0].date);
                    const lastDate = parseISO(
                      group.schedules[group.schedules.length - 1].date,
                    );
                    const rangeLabel =
                      group.schedules.length === 1
                        ? format(firstDate, "dd 'de' MMMM", { locale: ptBR })
                        : `${format(firstDate, "dd")} - ${format(lastDate, "dd 'de' MMMM", { locale: ptBR })}`;

                    return (
                      <div
                        key={group.key}
                        className={cn(
                          "overflow-hidden rounded-xl border",
                          isUserInGroup
                            ? "border-emerald-500/40"
                            : "border-border",
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2",
                            isUserInGroup ? "bg-emerald-500/10" : "bg-muted/50",
                          )}
                        >
                          <span className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
                            {rangeLabel}
                          </span>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">
                            {group.schedules.length} escala
                            {group.schedules.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="divide-y divide-border">
                          {group.schedules.map((schedule) => {
                            const status =
                              STATUS_LABELS[schedule.status] ||
                              STATUS_LABELS.draft;
                            const isUserInSchedule =
                              !!user &&
                              (schedule.members || []).some((member) =>
                                isScheduleMemberUser(member, user.id),
                              );

                            return (
                              <div
                                key={schedule.id}
                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent"
                                onClick={() => {
                                  setSelectedSchedule(schedule);
                                  setShowDetailModal(true);
                                }}
                              >
                                <div className="min-w-[36px] text-center">
                                  <p className="text-[10px] uppercase leading-none text-muted-foreground">
                                    {format(parseISO(schedule.date), "EEE", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                  <p className="text-base font-bold leading-tight text-primary">
                                    {format(parseISO(schedule.date), "dd")}
                                  </p>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-medium">
                                      {schedule.title ||
                                        format(
                                          parseISO(schedule.date),
                                          "EEEE",
                                          {
                                            locale: ptBR,
                                          },
                                        )}
                                    </p>
                                    {isUserInSchedule && (
                                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "rounded-full px-1.5 py-0.5 text-xs",
                                        status.color,
                                      )}
                                    >
                                      {status.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {schedule.members?.length || 0} obreiros
                                    </span>
                                  </div>
                                </div>
                                {canManage && (
                                  <div
                                    className="flex gap-1"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setEditingSchedule(schedule);
                                        setShowCreateModal(true);
                                      }}
                                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeletingSchedule(schedule)
                                      }
                                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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

        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Users className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="flex-1 text-sm font-semibold text-foreground">
              Obreiros
            </span>
            <span className="text-xs text-muted-foreground">
              {ushersTeam.members?.length || 0}
            </span>
          </div>
          <div className="p-3">
            {!ushersTeam.members || ushersTeam.members.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Nenhum membro
              </p>
            ) : (
              <div className="space-y-1">
                {ushersTeam.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {member.user?.nome?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium leading-tight">
                        {member.user?.nome?.split(" ").slice(0, 2).join(" ")}
                      </p>
                      {member.functions && member.functions.length > 0 && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {member.functions.map((item) => item.nome).join(", ")}
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
          <span>INICIO</span>
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
              "flex items-center gap-2 rounded-full px-5 py-2 transition-all",
              tab === "inicio" && "bg-foreground text-background",
            )}
          >
            <Home className="h-4 w-4" />
            <span>INICIO</span>
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
              "flex items-center gap-2 rounded-full px-5 py-2 transition-all",
              tab === "agenda" && "bg-foreground text-background",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            <span>ESCALA GERAL</span>
          </div>
        </button>
      </div>

      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setEditingSchedule(null);
        }}
        teamId={ushersTeam.id}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        schedule={editingSchedule}
        showSongs={false}
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

      <AlertDialog
        open={!!deletingSchedule}
        onOpenChange={(open) => !open && setDeletingSchedule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita.
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

      <Dialog open={showWhatsApp} onOpenChange={setShowWhatsApp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-green-500" />
              Exportar Mes para WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div data-dialog-body="" className="space-y-3 px-4 py-4">
            <Textarea
              value={whatsAppText}
              readOnly
              rows={12}
              className="resize-none border-border bg-muted/50 font-mono text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
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
                  toast({ title: "Copiado para a area de transferencia!" });
                } catch {
                  toast({
                    variant: "destructive",
                    title: "Nao foi possivel copiar",
                  });
                }
              }}
              className="h-9 gap-2 px-4 text-sm font-medium"
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
