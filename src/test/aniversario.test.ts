import { describe, it, expect } from "vitest";
import { ehAniversario } from "@/components/Aniversario";
import { nascParaISO } from "@/components/CampoNascimento";
describe("aniversário", () => {
  it("é aniversário no mesmo dia e mês", () => expect(ehAniversario("1990-11-06", new Date(2026, 10, 6))).toBe(true));
  it("não é em outro dia", () => expect(ehAniversario("1990-11-07", new Date(2026, 10, 6))).toBe(false));
  it("rejeita data inválida", () => expect(nascParaISO({ dia: "31", mes: "2", ano: "1990" })).toBeNull());
  it("aceita data válida", () => expect(nascParaISO({ dia: "6", mes: "11", ano: "1990" })).toBe("1990-11-06"));
});

import { naJanelaAniversario, diasParaAniversario } from "@/components/Aniversario";
describe("janela de aniversário (7 dias antes até 7 depois)", () => {
  const nasc = "1990-11-13";
  it("7 dias antes mostra", () => expect(naJanelaAniversario(nasc, new Date(2026, 10, 6))).toBe(true));
  it("8 dias antes não mostra", () => expect(naJanelaAniversario(nasc, new Date(2026, 10, 5))).toBe(false));
  it("7 dias depois mostra", () => expect(naJanelaAniversario(nasc, new Date(2026, 10, 20))).toBe(true));
  it("8 dias depois não mostra", () => expect(naJanelaAniversario(nasc, new Date(2026, 10, 21))).toBe(false));
  it("virada de ano: 3/jan conta para 30/dez", () => expect(diasParaAniversario("1990-12-30", new Date(2027, 0, 3))).toBe(-4));
});
