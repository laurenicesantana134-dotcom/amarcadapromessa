import { describe, it, expect } from "vitest";
import { slots } from "@/lib/barbearia";

const passado = new Date(2000, 0, 1);

describe("horários de funcionamento", () => {
  it("segunda-feira não abre", () => {
    expect(slots(new Date(2026, 9, 26), 30, passado)).toEqual([]); // 26/10/2026 é segunda
  });
  it("não agenda no almoço (12:00 às 13:00)", () => {
    const h = slots(new Date(2026, 9, 27), 30, passado);
    expect(h).toContain("11:30");
    expect(h).not.toContain("12:00");
    expect(h).not.toContain("12:30");
    expect(h).toContain("13:00");
  });
  it("serviço de 1h não começa às 11:30, pois invadiria o almoço", () => {
    expect(slots(new Date(2026, 9, 27), 60, passado)).not.toContain("11:30");
  });
});
