import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";

export type AppNotificationType =
  | "schedule_created"
  | "schedule_updated"
  | "schedule_published"
  | "schedule_deleted"
  | "schedule_assigned"
  | "info";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  scheduleId?: string | null;
  teamId?: string | null;
  metadata?: Record<string, unknown>;
}

interface CreateNotificationInput {
  type: AppNotificationType;
  title: string;
  message: string;
  link?: string;
  scheduleId?: string | null;
  teamId?: string | null;
  actorUserId?: string | null;
  recipientUserIds: string[];
  metadata?: Record<string, unknown>;
}

interface ScheduleSnapshot {
  id: string;
  team_id: string;
  date: string;
  title: string | null;
  status: string;
  team?: {
    nome?: string | null;
    leader_id?: string | null;
    team_type?: { codigo?: string | null; nome?: string | null } | null;
  } | null;
  members?: Array<{
    team_member?: {
      user_id?: string | null;
      user?: { nome?: string | null } | null;
    } | null;
  }>;
}

function isMissingNotificationsTable(error: any) {
  const msg = String(error?.message || "");
  return (
    error?.code === "42P01" ||
    msg.includes("app_notifications") ||
    msg.includes("app_notification_recipients")
  );
}

function unique(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(Boolean) as string[]));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function teamRoute(code?: string | null) {
  if (code === "danca") return "/danca";
  if (code === "louvor") return "/louvor";
  if (code === "obreiros") return "/obreiros";
  if (code === "midia") return "/midia";
  if (code === "celula") return "/celulas";
  return "/louvor";
}

function scheduleLink(schedule?: Pick<ScheduleSnapshot, "team"> | null) {
  return teamRoute(schedule?.team?.team_type?.codigo);
}

function scheduleTargetLink(
  schedule: Pick<ScheduleSnapshot, "id" | "date" | "team">,
  options?: { includeScheduleId?: boolean },
) {
  const params = new URLSearchParams({ date: schedule.date });
  if (options?.includeScheduleId !== false) {
    params.set("schedule", schedule.id);
  }
  return `${scheduleLink(schedule)}?${params.toString()}`;
}

function notificationTargetLink(notification: {
  link?: string | null;
  schedule_id?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const link = notification.link || undefined;
  if (!link || link.includes("?")) return link;

  const date =
    typeof notification.metadata?.date === "string"
      ? notification.metadata.date
      : null;
  if (!date) return link;

  const params = new URLSearchParams({ date });
  if (notification.schedule_id) {
    params.set("schedule", notification.schedule_id);
  }

  const teamType =
    typeof notification.metadata?.teamType === "string"
      ? notification.metadata.teamType
      : null;

  return `${teamRoute(teamType)}?${params.toString()}`;
}

function formatScheduleDate(date: string) {
  try {
    return format(parseISO(date), "dd 'de' MMMM", { locale: ptBR });
  } catch {
    return date;
  }
}

async function getCurrentUserProfileId() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data } = await supabase
    .from("users_profile")
    .select("id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  return (data as any)?.id || null;
}

async function getManagementUserIds() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      `
      user_id,
      profile:profiles!inner (codigo)
    `,
    )
    .eq("profile.codigo", "gerencial");

  if (error) return [];
  return unique((data || []).map((row: any) => row.user_id));
}

async function getScheduleSnapshot(scheduleId: string) {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
      id,
      team_id,
      date,
      title,
      status,
      team:teams (
        nome,
        leader_id,
        team_type:team_types (codigo, nome)
      ),
      members:schedule_members (
        team_member:team_members (
          user_id,
          user:users_profile (nome)
        )
      )
    `,
    )
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) throw error;
  return data as ScheduleSnapshot | null;
}

async function getScheduleRecipients(schedule: ScheduleSnapshot) {
  const managementIds = await getManagementUserIds();
  const memberIds = (schedule.members || []).map(
    (member) => member.team_member?.user_id,
  );

  return unique([...memberIds, schedule.team?.leader_id, ...managementIds]);
}

async function createNotification(input: CreateNotificationInput) {
  const recipientUserIds = unique(input.recipientUserIds);
  if (recipientUserIds.length === 0) return null;

  const notificationId = createId();
  const { error: notificationError } = await (supabase as any)
    .from("app_notifications")
    .insert({
      id: notificationId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      schedule_id: input.scheduleId || null,
      team_id: input.teamId || null,
      actor_user_id: input.actorUserId || null,
      metadata: input.metadata || {},
    });

  if (notificationError) {
    if (isMissingNotificationsTable(notificationError)) return null;
    throw notificationError;
  }

  const recipients = recipientUserIds.map((userId) => ({
    notification_id: notificationId,
    user_id: userId,
  }));

  const { error: recipientsError } = await (supabase as any)
    .from("app_notification_recipients")
    .insert(recipients);

  if (recipientsError) {
    if (isMissingNotificationsTable(recipientsError)) return null;
    throw recipientsError;
  }

  return notificationId;
}

async function notifyScheduleEvent(
  scheduleId: string,
  event: "created" | "updated",
  previousStatus?: string | null,
) {
  const schedule = await getScheduleSnapshot(scheduleId);
  if (!schedule) return;

  const actorUserId = await getCurrentUserProfileId();
  const recipients = await getScheduleRecipients(schedule);
  const date = formatScheduleDate(schedule.date);
  const teamName = schedule.team?.nome || "Equipe";
  const titleBase = schedule.title || `Escala de ${date}`;
  const isPublishedNow =
    schedule.status === "published" && previousStatus !== "published";
  const type: AppNotificationType = isPublishedNow
    ? "schedule_published"
    : event === "created"
      ? "schedule_created"
      : "schedule_updated";

  const title =
    type === "schedule_published"
      ? "Escala publicada"
      : type === "schedule_created"
        ? "Nova escala criada"
        : "Escala atualizada";

  const message =
    type === "schedule_published"
      ? `${teamName}: ${titleBase} foi publicada.`
      : type === "schedule_created"
        ? `${teamName}: ${titleBase} em ${date}.`
        : `${teamName}: ${titleBase} foi atualizada.`;

  await createNotification({
    type,
    title,
    message,
    link: scheduleTargetLink(schedule),
    scheduleId: schedule.id,
    teamId: schedule.team_id,
    actorUserId,
    recipientUserIds: recipients,
    metadata: {
      date: schedule.date,
      teamName,
      status: schedule.status,
      teamType: schedule.team?.team_type?.codigo,
    },
  });
}

export const notificationService = {
  async listForCurrentUser(limit = 50): Promise<AppNotification[]> {
    const userId = await getCurrentUserProfileId();
    if (!userId) return [];

    const { data, error } = await (supabase as any)
      .from("app_notification_recipients")
      .select(
        `
        id,
        read_at,
        dismissed_at,
        notification:app_notifications (
          id,
          type,
          title,
          message,
          link,
          schedule_id,
          team_id,
          metadata,
          created_at
        )
      `,
      )
      .eq("user_id", userId)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingNotificationsTable(error)) return [];
      throw error;
    }

    return (data || [])
      .map((row: any) => {
        const notification = row.notification;
        if (!notification) return null;
        return {
          id: notification.id,
          recipientId: row.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: !!row.read_at,
          createdAt: new Date(notification.created_at),
          link: notificationTargetLink(notification),
          scheduleId: notification.schedule_id,
          teamId: notification.team_id,
          metadata: notification.metadata || {},
        } as AppNotification;
      })
      .filter(Boolean) as AppNotification[];
  },

  async markAsRead(recipientId: string) {
    const { error } = await (supabase as any)
      .from("app_notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("id", recipientId);

    if (error && !isMissingNotificationsTable(error)) throw error;
  },

  async markAllAsRead() {
    const userId = await getCurrentUserProfileId();
    if (!userId) return;

    const { error } = await (supabase as any)
      .from("app_notification_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null)
      .is("dismissed_at", null);

    if (error && !isMissingNotificationsTable(error)) throw error;
  },

  async dismissAll() {
    const userId = await getCurrentUserProfileId();
    if (!userId) return;

    const { error } = await (supabase as any)
      .from("app_notification_recipients")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("dismissed_at", null);

    if (error && !isMissingNotificationsTable(error)) throw error;
  },

  async notifyScheduleCreated(scheduleId: string) {
    await notifyScheduleEvent(scheduleId, "created");
  },

  async notifyScheduleUpdated(
    scheduleId: string,
    previousStatus?: string | null,
  ) {
    await notifyScheduleEvent(scheduleId, "updated", previousStatus);
  },

  async notifyScheduleDeleted(schedule: ScheduleSnapshot) {
    const actorUserId = await getCurrentUserProfileId();
    const recipients = await getScheduleRecipients(schedule);
    const date = formatScheduleDate(schedule.date);
    const teamName = schedule.team?.nome || "Equipe";
    const titleBase = schedule.title || `Escala de ${date}`;

    await createNotification({
      type: "schedule_deleted",
      title: "Escala removida",
      message: `${teamName}: ${titleBase} foi removida.`,
      link: scheduleTargetLink(schedule, { includeScheduleId: false }),
      scheduleId: null,
      teamId: schedule.team_id,
      actorUserId,
      recipientUserIds: recipients,
      metadata: {
        scheduleId: schedule.id,
        date: schedule.date,
        teamName,
        status: schedule.status,
        teamType: schedule.team?.team_type?.codigo,
      },
    });
  },

  async getScheduleSnapshot(scheduleId: string) {
    return getScheduleSnapshot(scheduleId);
  },
};
