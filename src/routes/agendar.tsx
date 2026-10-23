import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Header, WhatsFab } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notificarAgendamento } from "@/lib/notificacoes.functions";
import { SERVICOS, brl, dur, grade, FUNCIONAMENTO } from "@/lib/barbearia";

export const Route = createFileRoute("/agendar")({
  validateSearch: (s: Record<string, unknown>): { servico?: string | undefined } => ({ servico: typeof s["servico"] === "string" ? (s["servico"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Agendar horário — A Marca da Promessa" },
      { name: "description", content: "Escolha serviço, dia e horário e reserve sua cadeira." },
      { property: "og:title", content: "Agendar horário — A Marca da Promessa" },
      { property: "og:description", content: "Escolha serviço, dia e horário e reserve sua cadeira." },
    ],
  }),
  component: Agendar,
});

function Agendar() {
  const { servico } = Route.useSearch();
  const { user, perfil, carregando } = useAuth();
  const [sel, setSel] = useState<string | undefined>(servico);
  const [dias, setDias] = useState<Date[]>([]);
  const [dia, setDia] = useState<number>(0);
  const [hora, setHora] = useState<string>();
  const [ocupados, setOcupados] = useState<{ inicio: Date; fim: Date }[]>([]);
  const [agora, setAgora] = useState(() => new Date());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState<string>();

  useEffect(() => {
    const out: Date[] = [];
    for (let i = 0; i < 14; i++) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); out.push(d); }
    setDias(out);
    const first = out.findIndex((d) => FUNCIONAMENTO[d.getDay()]?.abre);
    setDia(first < 0 ? 0 : first);
    const t = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const d = dias[dia];
  const carregarOcupados = async () => {
    if (!d) return;
    const fim = new Date(d); fim.setDate(fim.getDate() + 1);
    const { data } = await supabase.rpc("horarios_ocupados", { _de: d.toISOString(), _ate: fim.toISOString() });
    setOcupados((data ?? []).map((o) => ({ inicio: new Date(o.inicio), fim: new Date(o.fim) })));
  };
  useEffect(() => { carregarOcupados(); }, [d]);

  const s = SERVICOS.find((x) => x.id === sel);
  const horarios = useMemo(() => (d ? grade(d, s?.min ?? 30, agora, ocupados) : []), [d, s, agora, ocupados]);
  const escolhido = horarios.find((h) => h.hora === hora && h.livre);

  const confirmar = async () => {
    if (!s || !escolhido || !user || !perfil) return;
    setEnviando(true); setErro("");
    const { data, error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id, cliente_nome: perfil.nome, cliente_whatsapp: perfil.whatsapp,
      servico_id: s.id, servico_nome: s.nome, preco: s.preco,
      inicio: escolhido.inicio.toISOString(), fim: escolhido.fim.toISOString(),
    }).select("id").single();
    setEnviando(false);
    if (error) { setErro(error.message); carregarOcupados(); return; }
    notificarAgendamento({ data: { id: data.id } }).catch(() => {});
    setFeito(`${s.nome} em ${escolhido.inicio.toLocaleDateString("pt-BR")} às ${escolhido.hora}`);
  };

  const chip = (on: boolean) => `rounded-xl border px-4 py-3 text-sm transition ${on ? "border-primary bg-gold-soft text-primary" : "border-border bg-card hover:border-primary/50"}`;

  if (feito) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-5xl">Horário reservado!</h1>
        <p className="mt-3 text-muted-foreground">{feito}. Se não puder comparecer, avise o profissional com antecedência.</p>
        <Link to="/conta" className="mt-8 inline-block rounded-full bg-gradient-gold px-7 py-4 font-semibold text-primary-foreground shadow-gold">Ver meus agendamentos</Link>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">AGENDAMENTO</p>
        <h1 className="mt-2 text-5xl">Reserve sua cadeira</h1>

        <h2 className="mt-10 text-2xl">1. Serviço</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SERVICOS.map((x) => (
            <button key={x.id} onClick={() => { setSel(x.id); setHora(undefined); }} className={`${chip(sel === x.id)} text-left`}>
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
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {horarios.length === 0 && <p className="col-span-full text-muted-foreground">Fechado neste dia.</p>}
          {horarios.map((h) => (
            <button key={h.hora} disabled={!h.livre} onClick={() => setHora(h.hora)} className={`${chip(hora === h.hora)} disabled:cursor-not-allowed disabled:opacity-40`}>
              <div className="font-semibold">{h.hora}</div>
              {!h.livre && <div className="text-[10px] uppercase tracking-wide">indisponível</div>}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {!carregando && !user ? (
            <Link to="/entrar" className="block rounded-full bg-gradient-gold px-7 py-4 text-center font-semibold text-primary-foreground shadow-gold">Crie seu cadastro ou entre para confirmar</Link>
          ) : (
            <button onClick={confirmar} disabled={!s || !escolhido || enviando} className="block w-full rounded-full bg-gradient-gold px-7 py-4 text-center font-semibold text-primary-foreground shadow-gold disabled:opacity-40">
              {enviando ? "Reservando..." : "Confirmar agendamento"}
            </button>
          )}
          {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
        </div>
      </main>
      <WhatsFab />
    </div>
  );
}
