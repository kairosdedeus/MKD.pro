import { describe, it, expect } from "vitest";
import { format, parseISO, getDay, addDays } from "date-fns";

// Replicar a função groupSchedulesByWeekend para teste
function groupSchedulesByWeekend(
  schedules: Array<{ id: string; date: string }>,
) {
  const groups = new Map<string, typeof schedules>();
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

describe("groupSchedulesByWeekend", () => {
  it("agrupa sábado e domingo no mesmo grupo", () => {
    const schedules = [
      { id: "1", date: "2026-05-02" }, // sábado
      { id: "2", date: "2026-05-03" }, // domingo
    ];
    const groups = groupSchedulesByWeekend(schedules);
    expect(groups).toHaveLength(1);
    expect(groups[0].schedules).toHaveLength(2);
  });

  it("domingo sozinho fica no grupo do sábado anterior", () => {
    const schedules = [{ id: "1", date: "2026-05-03" }]; // domingo
    const groups = groupSchedulesByWeekend(schedules);
    expect(groups[0].key).toBe("2026-05-02"); // chave = sábado
  });

  it("sábado sozinho fica em grupo próprio", () => {
    const schedules = [{ id: "1", date: "2026-05-02" }]; // sábado
    const groups = groupSchedulesByWeekend(schedules);
    expect(groups[0].key).toBe("2026-05-02");
    expect(groups[0].schedules).toHaveLength(1);
  });

  it("dois fins de semana diferentes ficam em grupos separados", () => {
    const schedules = [
      { id: "1", date: "2026-05-02" }, // sábado semana 1
      { id: "2", date: "2026-05-09" }, // sábado semana 2
    ];
    const groups = groupSchedulesByWeekend(schedules);
    expect(groups).toHaveLength(2);
  });

  it("lista vazia retorna array vazio", () => {
    expect(groupSchedulesByWeekend([])).toHaveLength(0);
  });

  it("ordena grupos por data crescente", () => {
    const schedules = [
      { id: "2", date: "2026-05-09" },
      { id: "1", date: "2026-05-02" },
    ];
    const groups = groupSchedulesByWeekend(schedules);
    expect(groups[0].key).toBe("2026-05-02");
    expect(groups[1].key).toBe("2026-05-09");
  });
});
