import { useAuthStore } from "@/stores/authStore";

/**
 * Hook de permissões baseado nos perfis do usuário logado.
 */
export function usePermissions() {
  const { profiles } = useAuthStore();

  const codes = profiles.map((p) => p.codigo);

  const isGerencial = codes.includes("gerencial");
  const isLiderLouvor = codes.includes("lider_louvor");
  const isMembroLouvor = codes.includes("membro_louvor");

  /** Pode gerenciar escalas (criar, editar, excluir, exportar) */
  const canManageSchedules = isGerencial || isLiderLouvor;

  /** Pode ver escalas */
  const canViewSchedules = isGerencial || isLiderLouvor || isMembroLouvor;

  /** Pode gerenciar usuários e equipes */
  const canManageUsers =
    isGerencial ||
    codes.some((c) =>
      [
        "lider_louvor",
        "lider_danca",
        "lider_obreiros",
        "lider_midia",
        "lider_celula",
      ].includes(c),
    );

  return {
    isGerencial,
    isLiderLouvor,
    isMembroLouvor,
    canManageSchedules,
    canViewSchedules,
    canManageUsers,
    codes,
  };
}
