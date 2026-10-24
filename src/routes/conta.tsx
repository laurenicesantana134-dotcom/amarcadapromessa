import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Crown, KeyRound, LogOut, UserPlus, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useAuth, soDigitos } from "@/hooks/useAuth";
import { brl } from "@/lib/barbearia";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/conta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha conta — A Marca da Promessa" },
      { name: "description", content: "Seus dados, agendamentos e área do dono da barbearia." },
      { property: "og:title", content: "Minha conta — A Marca da Promessa" },
      { property: "og:description", content: "Seus dados, agendamentos e área do dono." },
    ],
  }),
  component: Conta,
});

type Agendamento = Tables<"agendamentos">;
type Dono = { user_id: string; ativo: boolean; apelido: string; whatsapp: string };

const fmtQuando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Bahia", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const rotuloStatus: Record<string, string> = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };

function Conta() {
  const { user, perfil, dono, carregando } = useAuth();
  const navigate = useNavigate();
  const [whats, setWhats] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [donos, setDonos] = useState<Dono[]>([]);
  const [meus, setMeus] = useState<Agendamento[]>([]);
  const [agenda, setAgenda] = useState<Agendamento[]>([]);
  const [obs, setObs] = useState<Record<string, string>>({});

  const carregarDonos = async () => {
    const { data: r } = await supabase.from("user_roles").select("user_id,ativo").eq("role", "dono");
    const rows = r ?? [];
    if (!rows.length) return;
    const { data } = await supabase.from("profiles").select("id,apelido,whatsapp").in("id", rows.map((x) => x.user_id));
    setDonos(rows.map((x) => ({ user_id: x.user_id, ativo: x.ativo, apelido: data?.find((p) => p.id === x.user_id)?.apelido ?? "—", whatsapp: data?.find((p) => p.id === x.user_id)?.whatsapp ?? "" })));
  };

  const carregarAgendamentos = async () => {
    if (!user) return;
    const { data: m } = await supabase.from("agendamentos").select("*").eq("cliente_id", user.id).order("inicio", { ascending: false }).limit(20);
    setMeus(m ?? []);
    if (dono) {
      const { data: a } = await supabase.from("agendamentos").select("*").gte("inicio", new Date(Date.now() - 12 * 3600 * 1000).toISOString()).neq("status", "cancelado").order("inicio").limit(100);
      setAgenda(a ?? []);
    }
  };

  useEffect(() => { if (!carregando && !user) navigate({ to: "/entrar" }); }, [carregando, user, navigate]);
  useEffect(() => { if (dono) carregarDonos(); }, [dono]);
  useEffect(() => { if (user) carregarAgendamentos(); }, [user, dono]);

  const indicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (soDigitos(whats).length < 10) { setMsg({ ok: false, t: "Digite um WhatsApp com DDD." }); return; }
    const { data, error } = await supabase.rpc("indicar_dono", { _whatsapp: whats });
    if (error) { setMsg({ ok: false, t: error.message }); return; }
    setMsg({ ok: true, t: `${data} agora também é dono.` });
    setWhats("");
    carregarDonos();
  };

  const alternarDono = async (d: Dono) => {
    const { error } = await supabase.from("user_roles").update({ ativo: !d.ativo }).eq("user_id", d.user_id).eq("role", "dono");
    if (error) { setMsg({ ok: false, t: error.message }); return; }
    setMsg({ ok: true, t: d.ativo ? `Acesso de ${d.apelido} desativado.` : `Acesso de ${d.apelido} ativado.` });
    carregarDonos();
  };

  const mudarStatus = async (a: Agendamento, status: string) => {
    await supabase.from("agendamentos").update({ status }).eq("id", a.id);
    carregarAgendamentos();
  };

  const salvarObs = async (a: Agendamento) => {
    await supabase.from("agendamentos").update({ observacao: obs[a.id] ?? null }).eq("id", a.id);
    carregarAgendamentos();
  };

  if (carregando || !perfil) return <div className="min-h-screen"><Header /></div>;

  const cartaoAgendamento = (a: Agendamento, gerenciar: boolean) => (
    <li key={a.id} className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{a.servico_nome} <span className="text-primary">{brl(a.preco)}</span></p>
          <p className="text-sm text-muted-foreground">{gerenciar ? `${a.cliente_nome} · ${a.cliente_whatsapp} · ` : ""}{fmtQuando(a.inicio)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === "agendado" ? "bg-gold-soft text-primary" : "bg-card text-muted-foreground"}`}>{rotuloStatus[a.status] ?? a.status}</span>
      </div>
      {gerenciar && (
        <div className="mt-3 space-y-2">
          {a.status === "agendado" && (
            <div className="flex gap-2">
              <button onClick={() => mudarStatus(a, "concluido")} className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Concluído</button>
              <button onClick={() => mudarStatus(a, "cancelado")} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Cancelar</button>
            </div>
          )}
          <div className="flex gap-2">
            <input value={obs[a.id] ?? a.observacao ?? ""} onChange={(e) => setObs({ ...obs, [a.id]: e.target.value })} placeholder="Observação (ex.: cliente pediu para trocar)" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
            <button onClick={() => salvarObs(a)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Salvar</button>
          </div>
        </div>
      )}
    </li>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-xl px-5 py-14">
        <p className="text-xs font-semibold tracking-[0.3em] text-primary">{dono ? "DONO DA BARBEARIA" : "CLIENTE"}</p>
        <h1 className="mt-2 text-5xl">Olá, {perfil.apelido}</h1>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm">
          <p><span className="text-muted-foreground">Nome:</span> {perfil.nome}</p>
          <p className="mt-1"><span className="text-muted-foreground">WhatsApp:</span> {perfil.whatsapp}</p>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-3xl"><CalendarDays className="h-5 w-5 text-primary" /> Meus agendamentos</h2>
          {!meus.length && <p className="mt-3 text-sm text-muted-foreground">Você ainda não tem agendamentos.</p>}
          <ul className="mt-3 space-y-3">{meus.map((a) => cartaoAgendamento(a, false))}</ul>
        </section>

        {dono && (
          <section className="mt-8 rounded-2xl border border-primary/30 bg-card p-6">
            <h2 className="flex items-center gap-2 text-3xl"><CalendarDays className="h-5 w-5 text-primary" /> Agenda da barbearia</h2>
            {!agenda.length && <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento próximo.</p>}
            <ul className="mt-3 space-y-3">{agenda.map((a) => cartaoAgendamento(a, true))}</ul>
          </section>
        )}

        {dono && (
          <section className="mt-8 rounded-2xl border border-primary/30 bg-card p-6">
            <h2 className="flex items-center gap-2 text-3xl"><Crown className="h-5 w-5 text-primary" /> Donos</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {donos.map((d) => (
                <li key={d.user_id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3">
                  <span>{d.apelido} <span className="text-muted-foreground">· {d.whatsapp}</span>{d.user_id === user?.id && <span className="text-primary"> (você)</span>}</span>
                  {d.user_id === user?.id ? (
                    <span className="text-xs text-muted-foreground">sempre ativo</span>
                  ) : (
                    <button onClick={() => alternarDono(d)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${d.ativo ? "border border-border text-muted-foreground" : "bg-gradient-gold text-primary-foreground"}`}>
                      <KeyRound className="h-3.5 w-3.5" /> {d.ativo ? "Desativar" : "Ativar"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form onSubmit={indicar} className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">A pessoa precisa ter criado um cadastro. Digite o WhatsApp dela:</p>
              <input value={whats} onChange={(e) => setWhats(e.target.value)} inputMode="tel" placeholder="WhatsApp com DDD" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 font-semibold text-primary-foreground shadow-gold">
                <UserPlus className="h-4 w-4" /> Indicar como dono
              </button>
              {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.t}</p>}
            </form>
          </section>
        )}

        <div className="mt-8 flex gap-3">
          <Link to="/agendar" search={{}} className="rounded-full border border-primary/40 px-6 py-3 text-sm font-semibold">Agendar horário</Link>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-muted-foreground"><LogOut className="h-4 w-4" /> Sair</button>
        </div>
      </main>
    </div>
  );
}
