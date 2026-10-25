import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Header, WhatsFab } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notificarAgendamento } from "@/lib/notificacoes.functions";
import { SERVICOS, brl, dur, grade, FUNCIONAMENTO, waLink } from "@/lib/barbearia";

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
  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [dataSelecionada, setDataSelecionada] = useState<Date>(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
  });
  const [hora, setHora] = useState<string>();
  const [ocupados, setOcupados] = useState<{ inicio: Date; fim: Date }[]>([]);
  const [agora, setAgora] = useState(() => new Date());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState<string>();
  const diaRef = useRef<HTMLHeadingElement>(null);
  const horarioRef = useRef<HTMLHeadingElement>(null);
  const confirmarRef = useRef<HTMLDivElement>(null);
  const [alvoScroll, setAlvoScroll] = useState<"horario" | "confirmar" | null>(null);
  const [versaoScroll, setVersaoScroll] = useState(0);

  const primeiroMesDisponivel = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }, []);

  // Permite agendamentos pelos próximos 12 meses, contados a partir de hoje.
  const ultimoDiaDisponivel = useMemo(() => {
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setFullYear(limite.getFullYear() + 1);
    return limite;
  }, []);

  const ultimoMesDisponivel = useMemo(
    () => new Date(ultimoDiaDisponivel.getFullYear(), ultimoDiaDisponivel.getMonth(), 1),
    [ultimoDiaDisponivel],
  );

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!servico) return;
    setSel(servico);
    diaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [servico]);

  useEffect(() => {
    if (!alvoScroll || versaoScroll === 0) return;
    const quadro = window.requestAnimationFrame(() => {
      const destino = alvoScroll === "horario" ? horarioRef.current : confirmarRef.current;
      destino?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [alvoScroll, versaoScroll]);

  const d = dataSelecionada;

  const diasMes = useMemo(() => {
    const inicio = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const offset = inicio.getDay();
    const inicioGrade = new Date(inicio);
    inicioGrade.setDate(inicio.getDate() - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const data = new Date(inicioGrade);
      data.setDate(inicioGrade.getDate() + i);
      return data;
    });
  }, [mesAtual]);

  const carregarOcupados = async () => {
    if (!d) return;
    const fim = new Date(d);
    fim.setDate(fim.getDate() + 1);
    const { data } = await supabase.rpc("horarios_ocupados", { _de: d.toISOString(), _ate: fim.toISOString() });
    setOcupados((data ?? []).map((o) => ({ inicio: new Date(o.inicio), fim: new Date(o.fim) })));
  };

  useEffect(() => {
    carregarOcupados();
  }, [d]);

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

  const selecionarDia = (dia: Date) => {
    const proximo = new Date(dia);
    proximo.setHours(0, 0, 0, 0);
    setDataSelecionada(proximo);
    setHora(undefined);
    setMesAtual(new Date(proximo.getFullYear(), proximo.getMonth(), 1));
    setAlvoScroll("horario");
    setVersaoScroll((versao) => versao + 1);
  };

  const avancarMes = () => {
    if (mesAtual.getTime() >= ultimoMesDisponivel.getTime()) return;
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  };

  const recuarMes = () => {
    if (mesAtual.getTime() <= primeiroMesDisponivel.getTime()) return;
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  };

  if (feito) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-5xl">Horário reservado!</h1>
        <p className="mt-3 text-muted-foreground">{feito}. Se não puder comparecer, avise o profissional com antecedência.</p>
        <a
          href={waLink(`Olá! Acabei de agendar pelo site.\n\nNome: ${perfil?.nome ?? ""}${perfil?.apelido ? ` (${perfil.apelido})` : ""}\nWhatsApp: ${perfil?.whatsapp ?? ""}\nAgendamento: ${feito}\n\nConfirmo minha presença.`)}
          target="_blank" rel="noreferrer"
          className="mt-8 flex items-center justify-center gap-2 rounded-full bg-whatsapp px-7 py-4 font-semibold text-whatsapp-foreground shadow-lg"
        >
          <MessageCircle className="h-5 w-5" /> Enviar confirmação no WhatsApp do profissional
        </a>
        <Link to="/conta" className="mt-4 inline-block rounded-full border border-primary/40 px-7 py-3 font-semibold">Ver meus agendamentos</Link>
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
            <button key={x.id} onClick={() => { setSel(x.id); setHora(undefined); diaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`${chip(sel === x.id)} text-left`}>
              <div className="flex justify-between font-semibold"><span>{x.nome}</span><span className="text-primary">{brl(x.preco)}</span></div>
              <div className="text-xs text-muted-foreground">{dur(x.min)}</div>
            </button>
          ))}
        </div>

        <h2 ref={diaRef} id="passo-dia" className="mt-10 scroll-mt-24 text-2xl">2. Dia</h2>
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={recuarMes} disabled={mesAtual.getTime() <= primeiroMesDisponivel.getTime()} className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30" aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-lg font-semibold text-foreground">{mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
            <button type="button" onClick={avancarMes} disabled={mesAtual.getTime() >= ultimoMesDisponivel.getTime()} className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30" aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia}>{dia}</div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {diasMes.map((x) => {
              const ehMesAtual = x.getMonth() === mesAtual.getMonth();
              const fechado = !FUNCIONAMENTO[x.getDay()]?.abre;
              const selecionado = x.toDateString() === dataSelecionada.toDateString();
              const dentroDoPrazo = x >= primeiroMesDisponivel && x <= ultimoDiaDisponivel;
              const habilitado = ehMesAtual && !fechado && dentroDoPrazo;

              return (
                <button
                  key={x.toISOString()}
                  type="button"
                  onClick={() => habilitado && selecionarDia(x)}
                  disabled={!habilitado}
                  className={[
                    "rounded-xl border p-2 text-sm transition min-h-14",
                    selecionado ? "border-primary bg-gold-soft text-primary" : "border-border bg-card",
                    ehMesAtual ? "text-foreground" : "text-muted-foreground/60",
                    fechado ? "opacity-30" : "hover:border-primary/50",
                    !habilitado ? "cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="font-semibold">{x.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>

        <h2 ref={horarioRef} id="passo-horario" className="mt-10 scroll-mt-24 text-2xl">3. Horário</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {horarios.length === 0 && <p className="col-span-full text-muted-foreground">Fechado neste dia.</p>}
          {horarios.map((h) => (
            <button key={h.hora} disabled={!h.livre} onClick={() => { setHora(h.hora); setAlvoScroll("confirmar"); setVersaoScroll((versao) => versao + 1); }} className={`${chip(hora === h.hora)} disabled:cursor-not-allowed disabled:opacity-40`}>
              <div className="font-semibold">{h.hora}</div>
              {!h.livre && <div className="text-[10px] uppercase tracking-wide">indisponível</div>}
            </button>
          ))}
        </div>

        <div ref={confirmarRef} id="passo-confirmar" className="mt-10 scroll-mt-24">
          {!carregando && !user ? (
            <Link to="/entrar" className="block rounded-full bg-gradient-gold px-7 py-4 text-center font-semibold text-primary-foreground shadow-gold">Crie seu cadastro ou entre para confirmar</Link>
          ) : (
            <button onClick={confirmar} disabled={!s || !escolhido || enviando} className="block w-full rounded-full bg-gradient-gold px-7 py-4 text-center font-semibold text-primary-foreground shadow-gold disabled:cursor-not-allowed disabled:opacity-60">
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
