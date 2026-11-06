import { describe, it, expect } from "vitest";
import { ehAniversario } from "@/components/Aniversario";
import { nascParaISO } from "@/components/CampoNascimento";
describe("aniversário", () => {
  it("é aniversário no mesmo dia e mês", () => expect(ehAniversario("1990-11-06", new Date(2026, 10, 6))).toBe(true));
  it("não é em outro dia", () => expect(ehAniversario("1990-11-07", new Date(2026, 10, 6))).toBe(false));
  it("rejeita data inválida", () => expect(nascParaISO({ dia: "31", mes: "2", ano: "1990" })).toBeNull());
  it("aceita data válida", () => expect(nascParaISO({ dia: "6", mes: "11", ano: "1990" })).toBe("1990-11-06"));
});
