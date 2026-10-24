export const WHATSAPP = "5571982201044";
export const waLink = (text = "Olá, quero atendimento") =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

export type Servico = { id: string; nome: string; preco: number; desc: string; min: number };

export const SERVICOS: Servico[] = [
  { id: "navalhado-barba", nome: "Corte Navalhado + Barba", preco: 35, desc: "Corte navalhado com barba completa.", min: 60 },
  { id: "social-barba", nome: "Corte Social + Barba", preco: 35, desc: "Corte social com barba completa.", min: 60 },
  { id: "corte-barba-pigmentacao", nome: "Corte, Barba + Pigmentação", preco: 50, desc: "Combo completo com pigmentação.", min: 90 },
  { id: "pe-barba", nome: "Pé + Barba", preco: 15, desc: "Acabamento do contorno e barba.", min: 30 },
  { id: "nevou", nome: "Nevou", preco: 130, desc: "Descoloração total no estilo nevou.", min: 120 },
  { id: "barba", nome: "Barba", preco: 10, desc: "Barba na navalha.", min: 30 },
  { id: "pezinho", nome: "Pezinho", preco: 10, desc: "Acabamento do contorno.", min: 30 },
  { id: "navalhado", nome: "Corte Navalhado", preco: 30, desc: "Corte com acabamento na navalha.", min: 30 },
  { id: "social", nome: "Corte Social", preco: 30, desc: "Corte social clássico.", min: 30 },
  { id: "corte-luzes", nome: "Corte + Luzes", preco: 75, desc: "Corte com luzes.", min: 90 },
  { id: "manutencao-protese", nome: "Manutenção Prótese Capilar", preco: 150, desc: "Manutenção da prótese capilar.", min: 90 },
  { id: "aplicacao-protese", nome: "Aplicação Prótese Capilar", preco: 2000, desc: "Aplicação completa de prótese capilar.", min: 180 },
  { id: "protese-fio-a-fio", nome: "Prótese capilar fio a fio", preco: 500, desc: "Prótese capilar fio a fio.", min: 120 },
];

// índice = dia da semana (0 = domingo)
export const FUNCIONAMENTO: ({ dia: string; abre: string; fecha: string } | { dia: string; abre: null; fecha: null })[] = [
  { dia: "Domingo", abre: "07:00", fecha: "18:00" },
  { dia: "Segunda", abre: null, fecha: null },
  { dia: "Terça", abre: "07:00", fecha: "18:00" },
  { dia: "Quarta", abre: "07:00", fecha: "18:00" },
  { dia: "Quinta", abre: "07:00", fecha: "18:00" },
  { dia: "Sexta", abre: "07:00", fecha: "18:00" },
  { dia: "Sábado", abre: "07:00", fecha: "18:00" },
];

export const ALMOCO = { inicio: "12:00", fim: "13:00" };

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}` : `${m} min`);

export type Horario = { hora: string; inicio: Date; fim: Date; livre: boolean };

// Todos os horários do expediente; passados ou ocupados vêm com livre = false.
export function grade(date: Date, duracao = 30, agora = new Date(), ocupados: { inicio: Date; fim: Date }[] = []): Horario[] {
  const f = FUNCIONAMENTO[date.getDay()]!;
  if (!f.abre) return [];
  const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3);
  const out: Horario[] = [];
  const almIni = toMin(ALMOCO.inicio), almFim = toMin(ALMOCO.fim);
  // Intervalo de 1h a cada serviço: horários de hora em hora.
  for (let m = toMin(f.abre); m + duracao <= toMin(f.fecha!); m += 60) {
    if (m < almFim && m + duracao > almIni) continue;
    const ini = new Date(date); ini.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const fim = new Date(ini.getTime() + duracao * 60000);
    const livre = ini > agora && !ocupados.some((o) => o.inicio < fim && o.fim > ini);
    out.push({ hora: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, inicio: ini, fim, livre });
  }
  return out;
}

export function slots(date: Date, duracao = 30, agora = new Date()): string[] {
  return grade(date, duracao, agora).filter((h) => h.livre).map((h) => h.hora);
}
