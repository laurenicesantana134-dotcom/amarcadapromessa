import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header, WhatsFab } from "@/components/Header";
import { SERVICOS, brl, dur, slots, waLink, FUNCIONAMENTO } from "@/lib/barbearia";

export const Route = createFileRoute("/agendar")({
  validateSearch: (s: Record<string, unknown>): { servico?: string } => ({ servico: typeof s["servico"] === "string" ? (s["servico"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Agendar horário — A Marca da Promessa" },
      { name: "description", content: "Escolha serviço, dia e horário e confirme pelo WhatsApp." },
      { property: "og:title", content: "Agendar horário — A Marca da Promessa" },
      { property: "og:description", content: "Escolha serviço, dia e horário e confirme pelo WhatsApp." },
    ],
  }),
  component: Agendar,
});

function Agendar() {
  const { servico } = Route.useSearch();
  const [sel, setSel] = useState<string | undefined>(servico);
  const [dias, setDias] = useState<Date[]>([]);
  const [dia, setDia] = useState<number>(0);
  const [hora, setHora] = useState<string>();
  const [nome, setNome] = useState("");

  useEffect(() => {
    const out: Date[] = [];
    for (let i = 0; i < 14; i++) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); out.push(d); }
    setDias(out);
  }, []);

  const s = SERVICOS.find((x) => x.id === sel);
  const horarios = useMemo(() => (dias[dia] ? slots(dias[dia]) : []), [dias, dia]);
  const d = dias[dia];
  const msg = s && d && hora
    ? `Olá! Sou ${nome || "cliente"} e quero agendar: ${s.nome} (${brl(s.preco)}) em ${d.toLocaleDateString("pt-BR")} às ${hora}.`
    : "";

  const chip = (on: boolean) => `rounded-xl border px-4 py-3 text-sm transition ${on ? "border-primary bg-gold-soft text-primary" : "border-border bg-card hover:border-primary/50"}`;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">AGENDAMENTO</p>
        <h1 className="mt-2 text-5xl">Reserve sua cadeira</h1>

        <h2 className="mt-10 text-2xl">1. Serviço</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SERVICOS.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`${chip(sel === x.id)} text-left`}>
              <div className="flex justify-between font-semibold"><span>{x.nome}</span><span className="text-primary">{brl(x.preco)}</span></div>
              <div className="text-xs text-muted-foreground">{dur(x.min)}</div>
            </button>
          ))}
        </div>

        <h2 className="mt-10 text-2xl">2. Dia</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {dias.map((x, i) => {
            const fechado = !FUNCIONAMENTO[x.getDay()]?.abre;
            return (
              <button key={i} disabled={fechado} onClick={() => { setDia(i); setHora(undefined); }} className={`${chip(dia === i)} min-w-16 text-center disabled:opacity-30`}>
                <div className="text-xs uppercase">{x.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                <div className="text-lg font-semibold">{x.getDate()}</div>
              </button>
            );
          })}
        </div>

        <h2 className="mt-10 text-2xl">3. Horário</h2>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {horarios.length === 0 && <p className="col-span-full text-muted-foreground">Sem horários livres neste dia.</p>}
          {horarios.map((h) => <button key={h} onClick={() => setHora(h)} className={chip(hora === h)}>{h}</button>)}
        </div>

        <h2 className="mt-10 text-2xl">4. Seu nome</h2>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" className="mt-4 w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" />

        <a
          href={msg ? waLink(msg) : undefined}
          target="_blank" rel="noreferrer"
          aria-disabled={!msg}
          className={`mt-10 block rounded-full bg-gradient-gold px-7 py-4 text-center font-semibold text-primary-foreground shadow-gold ${msg ? "" : "pointer-events-none opacity-40"}`}
        >
          Confirmar no WhatsApp
        </a>
      </main>
      <WhatsFab />
    </div>
  );
}
