import { Profile, ProfileCode, TeamTypeCode, PermissionCheck } from "@/types";

export const PROFILE_CODES = {
  GERENCIAL: "gerencial" as ProfileCode,
  LIDER_LOUVOR: "lider_louvor" as ProfileCode,
  LIDER_DANCA: "lider_danca" as ProfileCode,
  LIDER_OBREIROS: "lider_obreiros" as ProfileCode,
  LIDER_MIDIA: "lider_midia" as ProfileCode,
  LIDER_CELULA: "lider_celula" as ProfileCode,
  AUXILIAR_CELULA: "auxiliar_celula" as ProfileCode,
  MEMBRO_LOUVOR: "membro_louvor" as ProfileCode,
  MEMBRO_DANCA: "membro_danca" as ProfileCode,
  MEMBRO_OBREIRO: "membro_obreiro" as ProfileCode,
  MEMBRO_MIDIA: "membro_midia" as ProfileCode,
  MEMBRO_CELULA: "membro_celula" as ProfileCode,
};

export const TEAM_TYPE_CODES = {
  LOUVOR: "louvor" as TeamTypeCode,
  DANCA: "danca" as TeamTypeCode,
  OBREIROS: "obreiros" as TeamTypeCode,
  MIDIA: "midia" as TeamTypeCode,
  CELULA: "celula" as TeamTypeCode,
};

export const isGerencial = (profiles: Profile[]): boolean => {
  return profiles.some((p) => p.codigo === PROFILE_CODES.GERENCIAL);
};

export const isLeader = (
  profiles: Profile[],
  teamType?: TeamTypeCode,
): boolean => {
  if (isGerencial(profiles)) return true;

  const leaderProfiles = [
    PROFILE_CODES.LIDER_LOUVOR,
    PROFILE_CODES.LIDER_DANCA,
    PROFILE_CODES.LIDER_OBREIROS,
    PROFILE_CODES.LIDER_MIDIA,
    PROFILE_CODES.LIDER_CELULA,
  ];

  if (!teamType) {
    return profiles.some((p) => leaderProfiles.includes(p.codigo));
  }

  const teamLeaderMap: Record<TeamTypeCode, ProfileCode> = {
    louvor: PROFILE_CODES.LIDER_LOUVOR,
    danca: PROFILE_CODES.LIDER_DANCA,
    obreiros: PROFILE_CODES.LIDER_OBREIROS,
    midia: PROFILE_CODES.LIDER_MIDIA,
    celula: PROFILE_CODES.LIDER_CELULA,
  };

  return profiles.some((p) => p.codigo === teamLeaderMap[teamType]);
};

export const isMember = (
  profiles: Profile[],
  teamType: TeamTypeCode,
): boolean => {
  const memberMap: Record<TeamTypeCode, ProfileCode[]> = {
    louvor: [PROFILE_CODES.MEMBRO_LOUVOR, PROFILE_CODES.LIDER_LOUVOR],
    danca: [PROFILE_CODES.MEMBRO_DANCA, PROFILE_CODES.LIDER_DANCA],
    obreiros: [PROFILE_CODES.MEMBRO_OBREIRO, PROFILE_CODES.LIDER_OBREIROS],
    midia: [PROFILE_CODES.MEMBRO_MIDIA, PROFILE_CODES.LIDER_MIDIA],
    celula: [
      PROFILE_CODES.MEMBRO_CELULA,
      PROFILE_CODES.AUXILIAR_CELULA,
      PROFILE_CODES.LIDER_CELULA,
    ],
  };

  return profiles.some((p) => memberMap[teamType].includes(p.codigo));
};

export const canEditSchedule = (
  profiles: Profile[],
  teamType: TeamTypeCode,
  isTeamLeader: boolean,
  isTeamMember: boolean,
): boolean => {
  if (isGerencial(profiles)) return true;
  if (isTeamLeader) return true;

  // Louvor: membros podem editar
  if (teamType === TEAM_TYPE_CODES.LOUVOR && isTeamMember) return true;

  return false;
};

export const getTeamPermissions = (
  profiles: Profile[],
  teamType?: TeamTypeCode,
  isTeamLeader = false,
  isTeamMember = false,
): PermissionCheck => {
  const gerencial = isGerencial(profiles);
  const leader = teamType
    ? isLeader(profiles, teamType) || isTeamLeader
    : false;

  return {
    canView: gerencial || leader || isTeamMember,
    canCreate: gerencial || leader,
    canEdit: gerencial || leader,
    canDelete: gerencial,
  };
};

export const getSchedulePermissions = (
  profiles: Profile[],
  teamType: TeamTypeCode,
  isTeamLeader = false,
  isTeamMember = false,
): PermissionCheck => {
  const gerencial = isGerencial(profiles);
  const canEdit = canEditSchedule(
    profiles,
    teamType,
    isTeamLeader,
    isTeamMember,
  );

  return {
    canView: gerencial || isTeamLeader || isTeamMember,
    canCreate: gerencial || isTeamLeader,
    canEdit: canEdit,
    canDelete: gerencial,
  };
};

export const getUserPermissions = (profiles: Profile[]): PermissionCheck => {
  const gerencial = isGerencial(profiles);
  const leader = isLeader(profiles); // qualquer líder

  return {
    canView: gerencial || leader,
    canCreate: gerencial || leader,
    canEdit: gerencial || leader,
    canDelete: gerencial, // só gerencial pode desativar/excluir
  };
};

export const getMinistryColor = (teamType: TeamTypeCode): string => {
  const colorMap: Record<TeamTypeCode, string> = {
    louvor: "bg-worship text-worship-foreground",
    danca: "bg-dance text-dance-foreground",
    midia: "bg-media text-media-foreground",
    obreiros: "bg-ushers text-ushers-foreground",
    celula: "bg-cells text-cells-foreground",
  };

  return colorMap[teamType] || "bg-primary text-primary-foreground";
};

export const getMinistryColorHex = (teamType: TeamTypeCode): string => {
  const colorMap: Record<TeamTypeCode, string> = {
    louvor: "#8b5cf6",
    danca: "#ec4899",
    midia: "#3b82f6",
    obreiros: "#10b981",
    celula: "#f97316",
  };

  return colorMap[teamType] || "#000000";
};
