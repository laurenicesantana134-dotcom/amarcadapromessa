import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scissors, CalendarDays, MessageCircle, Clock } from "lucide-react";
import hero from "@/assets/hero.jpg";
import tools from "@/assets/tools.jpg";
import interior from "@/assets/interior.jpg";
import logo from "@/assets/logo.jpg";
import { Header, WhatsFab } from "@/components/Header";
import { InstalarApp } from "@/components/InstalarApp";
import { SERVICOS, FUNCIONAMENTO, brl, dur, waLink } from "@/lib/barbearia";

const OG = "https://amarcadapromessa.lovable.app/og-logo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Marca da Promessa — Barbearia clássica" },
      { name: "description", content: "Corte, barba e acabamento na navalha. Agende seu horário online em menos de um minuto." },
      { property: "og:title", content: "Barbearia A Marca da Promessa" },
      { property: "og:description", content: "Corte, barba, prótese capilar e acabamento na navalha. Agende online." },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
  }),
  component: Index,
});

const passos = [
  { n: "01", t: "Escolha o serviço", d: "Corte, barba, combo ou acabamento.", I: Scissors },
  { n: "02", t: "Dia e horário", d: "Veja na hora o que está livre.", I: CalendarDays },
  { n: "03", t: "Pronto", d: "Seu horário fica reservado na agenda.", I: MessageCircle },
];

function Index() {
  const hoje = new Date().getDay();
  return (
    <div className="min-h-screen">
      <Header />
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        <img src={hero} alt="Barbeiro fazendo a barba de um cliente com navalha" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-side" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20">
          <img src={logo} alt="Logo da Barbearia A Marca da Promessa" className="mb-6 h-40 w-40 rounded-full shadow-gold md:h-52 md:w-52" />
          <p className="text-xs font-semibold tracking-[0.3em] text-primary">BARBEARIA CLÁSSICA · AGENDAMENTO ONLINE</p>
          <h1 className="mt-5 text-6xl leading-[0.95] md:text-7xl">A Marca<br /><em className="text-gradient-gold">da Promessa</em></h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">Corte, barba e acabamento na navalha. Escolha seu horário em menos de um minuto — sem ligação, sem espera.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/agendar" className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-4 font-semibold text-primary-foreground shadow-gold">Agendar horário <ArrowRight className="h-4 w-4" /></Link>
            <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-7 py-4 font-semibold"><MessageCircle className="h-4 w-4 text-whatsapp" /> Falar no WhatsApp</a>
            <InstalarApp />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 md:grid-cols-3">
          {passos.map(({ n, t, d, I }) => (
            <div key={n} className="flex items-start gap-4">
              <span className="font-serif text-3xl italic text-primary">{n}</span>
              <div>
                <h3 className="flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-wide"><I className="h-4 w-4 text-primary" />{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">O CARDÁPIO</p>
        <h2 className="mt-2 text-5xl">Serviços da casa</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">Cada atendimento com tempo certo, toalha quente e acabamento impecável. Toque em um serviço para agendar.</p>
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <img src={tools} alt="Navalha, pente dourado, pincel e óleo de barba" className="h-full max-h-[560px] w-full rounded-2xl object-cover" />
          <ul className="divide-y divide-border">
            {SERVICOS.map((s) => (
              <li key={s.id}>
                <Link to="/agendar" search={{ servico: s.id }} className="group block py-4">
                  <div className="flex items-baseline gap-3">
                    <strong className="font-serif text-2xl font-semibold group-hover:text-primary">{s.nome}</strong>
                    <span className="flex-1 border-b border-dashed border-border" />
                    <span className="font-semibold text-primary">{brl(s.preco)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-muted-foreground"><span>{s.desc}</span><span className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3" />{dur(s.min)}</span></div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative h-[50vh] overflow-hidden">
        <img src={interior} alt="Interior da barbearia com cadeiras de couro e espelhos iluminados" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative mx-auto flex h-full max-w-6xl items-end px-5 pb-10">
          <p className="font-serif text-5xl">Tradição<br /><em className="text-gradient-gold">em cada detalhe</em></p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">HORÁRIO DE FUNCIONAMENTO</p>
        <h2 className="mt-2 text-5xl">Venha no seu tempo</h2>
        <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {FUNCIONAMENTO.map((f, i) => (
            <li key={f.dia} className={`flex justify-between px-6 py-4 ${i === hoje ? "bg-gold-soft text-primary" : ""}`}>
              <span>{f.dia}</span>{f.abre && <span className="hidden text-xs text-muted-foreground sm:inline">almoço 12:00–13:00</span>}<span className={f.abre ? "" : "text-muted-foreground"}>{f.abre ? `${f.abre} – ${f.fecha}` : "Fechado"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mb-20 max-w-4xl px-5">
        <div className="rounded-3xl border border-primary/30 bg-card p-10 text-center">
          <h2 className="text-5xl">Sua cadeira está esperando</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Cadastro rápido com seu WhatsApp. Você recebe tudo certinho e pode remarcar quando precisar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/agendar" className="rounded-full bg-gradient-gold px-7 py-4 font-semibold text-primary-foreground shadow-gold">Agendar agora</Link>
            <a href={waLink()} target="_blank" rel="noreferrer" className="rounded-full border border-primary/40 px-7 py-4 font-semibold">Falar no WhatsApp</a>
          </div>
        </div>
      </section>
      <WhatsFab />
    </div>
  );
}
