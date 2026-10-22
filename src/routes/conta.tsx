import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, LogOut, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useAuth, soDigitos } from "@/hooks/useAuth";

export const Route = createFileRoute("/conta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha conta — A Marca da Promessa" },
      { name: "description", content: "Seus dados e área do dono da barbearia." },
      { property: "og:title", content: "Minha conta — A Marca da Promessa" },
      { property: "og:description", content: "Seus dados e área do dono." },
    ],
  }),
  component: Conta,
});

function Conta() {
  const { user, perfil, dono, carregando } = useAuth();
  const navigate = useNavigate();
  const [whats, setWhats] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [donos, setDonos] = useState<{ apelido: string; whatsapp: string }[]>([]);

  const carregarDonos = async () => {
    const { data: r } = await supabase.from("user_roles").select("user_id").eq("role", "dono");
    const ids = (r ?? []).map((x) => x.user_id);
    if (!ids.length) return;
    const { data } = await supabase.from("profiles").select("apelido,whatsapp").in("id", ids);
    setDonos(data ?? []);
  };

  useEffect(() => { if (!carregando && !user) navigate({ to: "/entrar" }); }, [carregando, user, navigate]);
  useEffect(() => { if (dono) carregarDonos(); }, [dono]);

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

  if (carregando || !perfil) return <div className="min-h-screen"><Header /></div>;

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

        {dono && (
          <section className="mt-8 rounded-2xl border border-primary/30 bg-card p-6">
            <h2 className="flex items-center gap-2 text-3xl"><Crown className="h-5 w-5 text-primary" /> Donos</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {donos.map((d) => <li key={d.whatsapp}>{d.apelido} <span className="text-muted-foreground">· {d.whatsapp}</span></li>)}
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
