import { describe, expect, it } from "vitest";
import {
  PROFILE_TO_TEAM_TYPE,
  TEAM_TYPE_ICONS,
  TEAM_TYPE_LABELS,
  TEAM_TYPE_ROUTES,
} from "@/lib/team-flow";

describe("team-flow para rede de crianças", () => {
  it("mapeia os perfis para o time de rede de crianças", () => {
    expect(PROFILE_TO_TEAM_TYPE.lider_rede_criancas).toBe("rede_criancas");
    expect(PROFILE_TO_TEAM_TYPE.membro_rede_criancas).toBe("rede_criancas");
  });

  it("expõe label, rota e ícone do novo perfil", () => {
    expect(TEAM_TYPE_LABELS.rede_criancas).toBe("Rede de Crianças");
    expect(TEAM_TYPE_ROUTES.rede_criancas).toBe("/rede-criancas");
    expect(TEAM_TYPE_ICONS.rede_criancas).toBeDefined();
  });
});
