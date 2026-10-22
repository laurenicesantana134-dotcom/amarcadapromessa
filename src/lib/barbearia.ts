export const WHATSAPP = "5571982201044";
export const waLink = (text = "Olá, quero atendimento") =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

export type Servico = { id: string; nome: string; preco: number; desc: string; min: number };

export const SERVICOS: Servico[] = [
  { id: "corte", nome: "Corte Masculino", preco: 40, desc: "Corte na tesoura ou máquina, finalizado com pomada.", min: 40 },
  { id: "barba", nome: "Barba Completa", preco: 30, desc: "Toalha quente, navalha e hidratação com óleo.", min: 30 },
  { id: "combo", nome: "Corte + Barba", preco: 65, desc: "O combo completo para sair renovado.", min: 60 },
  { id: "fade", nome: "Degradê / Fade", preco: 45, desc: "Degradê navalhado com acabamento preciso.", min: 45 },
  { id: "pezinho", nome: "Pezinho", preco: 15, desc: "Acabamento do contorno entre um corte e outro.", min: 15 },
  { id: "sobrancelha", nome: "Sobrancelha", preco: 15, desc: "Limpeza e alinhamento na navalha.", min: 15 },
  { id: "pigmentacao", nome: "Pigmentação", preco: 35, desc: "Pigmentação de barba ou cabelo para preencher falhas.", min: 30 },
  { id: "luzes", nome: "Luzes / Platinado", preco: 150, desc: "Descoloração completa com tonalização.", min: 120 },
];

// index = getDay(); null = fechado
export const HORARIOS: { dia: string; abre: string; fecha: string } [] | null[] = [];
export const FUNCIONAMENTO: ({ dia: string; abre: string; fecha: string } | { dia: string; abre: null; fecha: null })[] = [
  { dia: "Domingo", abre: null, fecha: null },
  { dia: "Segunda", abre: "09:00", fecha: "20:00" },
  { dia: "Terça", abre: "09:00", fecha: "20:00" },
  { dia: "Quarta", abre: "09:00", fecha: "20:00" },
  { dia: "Quinta", abre: "09:00", fecha: "20:00" },
  { dia: "Sexta", abre: "09:00", fecha: "20:00" },
  { dia: "Sábado", abre: "08:00", fecha: "18:00" },
];

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}` : `${m} min`);

export function slots(date: Date): string[] {
  const f = FUNCIONAMENTO[date.getDay()];
  if (!f.abre) return [];
  const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3);
  const out: string[] = [];
  const now = new Date();
  for (let m = toMin(f.abre); m < toMin(f.fecha!); m += 30) {
    const d = new Date(date); d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    if (d > now) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}
