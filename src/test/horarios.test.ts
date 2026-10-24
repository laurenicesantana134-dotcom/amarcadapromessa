import { describe, it, expect } from "vitest";
import { slots } from "@/lib/barbearia";

const passado = new Date(2000, 0, 1);

describe("horários de funcionamento", () => {
  it("segunda-feira não abre", () => {
    expect(slots(new Date(2026, 9, 26), 30, passado)).toEqual([]); // 26/10/2026 é segunda
  });
  it("expediente das 07:00 às 18:00, de hora em hora", () => {
    const h = slots(new Date(2026, 9, 27), 60, passado);
    expect(h[0]).toBe("07:00");
    expect(h[h.length - 1]).toBe("17:00"); // último serviço termina às 18:00
    expect(h).toContain("08:00");
    expect(h).not.toContain("07:30");
    expect(h).not.toContain("18:00");
  });
  it("não agenda no almoço (12:00 às 13:00)", () => {
    const h = slots(new Date(2026, 9, 27), 60, passado);
    expect(h).toContain("11:00");
    expect(h).not.toContain("12:00");
    expect(h).toContain("13:00");
  });
  it("serviço de 2h não começa às 11:00, pois invadiria o almoço", () => {
    expect(slots(new Date(2026, 9, 27), 120, passado)).not.toContain("11:00");
  });
});
