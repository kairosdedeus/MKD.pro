import { describe, it, expect } from "vitest";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Replicar funções para teste
function normalizeText(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getMembersByFunction(
  schedule: {
    members?: Array<{
      functions?: Array<{ nome: string }>;
      team_member?: { user?: { nome: string } };
    }>;
  },
  names: string[],
) {
  const wanted = names.map(normalizeText);
  return (schedule.members || [])
    .filter((m) =>
      (m.functions || []).some((f) => wanted.includes(normalizeText(f.nome))),
    )
    .map((m) => (m.team_member?.user?.nome || "").trim().split(/\s+/)[0])
    .filter(Boolean);
}

describe("getMembersByFunction", () => {
  const schedule = {
    members: [
      {
        functions: [{ nome: "Vocal" }],
        team_member: { user: { nome: "Isabel Cabrera" } },
      },
      {
        functions: [{ nome: "Guitarra" }],
        team_member: { user: { nome: "Vinicius Guitarra" } },
      },
      {
        functions: [{ nome: "Teclado" }],
        team_member: { user: { nome: "Michael Cabrera" } },
      },
    ],
  };

  it("retorna apenas o primeiro nome", () => {
    const result = getMembersByFunction(schedule, ["Vocal"]);
    expect(result).toEqual(["Isabel"]);
  });

  it("filtra por função corretamente", () => {
    const result = getMembersByFunction(schedule, ["Guitarra"]);
    expect(result).toEqual(["Vinicius"]);
  });

  it("retorna múltiplos membros da mesma função", () => {
    const multi = {
      members: [
        {
          functions: [{ nome: "Vocal" }],
          team_member: { user: { nome: "Isabel" } },
        },
        {
          functions: [{ nome: "Vocal" }],
          team_member: { user: { nome: "Ana" } },
        },
      ],
    };
    const result = getMembersByFunction(multi, ["Vocal"]);
    expect(result).toHaveLength(2);
  });

  it("ignora acentos na comparação", () => {
    const schedule2 = {
      members: [
        {
          functions: [{ nome: "Projeção" }],
          team_member: { user: { nome: "Carlos" } },
        },
      ],
    };
    const result = getMembersByFunction(schedule2, ["Projecao"]);
    expect(result).toEqual(["Carlos"]);
  });

  it("retorna array vazio se nenhum membro tem a função", () => {
    const result = getMembersByFunction(schedule, ["Bateria"]);
    expect(result).toEqual([]);
  });

  it("retorna array vazio para schedule sem membros", () => {
    const result = getMembersByFunction({}, ["Vocal"]);
    expect(result).toEqual([]);
  });
});

describe("normalizeText", () => {
  it("remove acentos", () => {
    expect(normalizeText("Projeção")).toBe("projecao");
    expect(normalizeText("Teclado")).toBe("teclado");
    expect(normalizeText("Ângela")).toBe("angela");
  });

  it("converte para minúsculas", () => {
    expect(normalizeText("VOCAL")).toBe("vocal");
    expect(normalizeText("BackVocal")).toBe("backvocal");
  });
});
