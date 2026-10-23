import { describe, it, expect } from "vitest";
import { grade } from "@/lib/barbearia";

describe("grade de horários", () => {
  const dia = new Date(2026, 9, 27); // terça
  it("horário passado aparece como indisponível", () => {
    const agora = new Date(2026, 9, 27, 15, 59);
    const g = grade(dia, 30, agora);
    expect(g.find((h) => h.hora === "09:00")?.livre).toBe(false);
    expect(g.find((h) => h.hora === "16:00")?.livre).toBe(true); // sem antecedência mínima
  });
  it("horário ocupado aparece como indisponível", () => {
    const ocup = [{ inicio: new Date(2026, 9, 27, 10, 0), fim: new Date(2026, 9, 27, 11, 0) }];
    const g = grade(dia, 30, new Date(2000, 0, 1), ocup);
    expect(g.find((h) => h.hora === "10:30")?.livre).toBe(false);
    expect(g.find((h) => h.hora === "11:00")?.livre).toBe(true);
  });
});
