import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CampoNascimento, nascParaISO, type Nasc } from "./CampoNascimento";

type P = { id: string; nome: string; apelido: string; nascimento: string | null };

const hojeChave = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

export function ehAniversario(nascimento: string, hoje = new Date()) {
  const [, m, d] = nascimento.split("-").map(Number);
  return m === hoje.getMonth() + 1 && d === hoje.getDate();
}

/** Pede a data para quem ainda não informou e mostra o parabéns no dia do aniversário. */
export function Aniversario() {
  const [p, setP] = useState<P | null>(null);
  const [parabens, setParabens] = useState(false);
  const [nasc, setNasc] = useState<Nasc>({ dia: "", mes: "", ano: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const avaliar = (perfil: P | null) => {
    setP(perfil);
    if (perfil?.nascimento && ehAniversario(perfil.nascimento)) {
      const k = `aniv-${perfil.id}-${hojeChave()}`;
      if (!localStorage.getItem(k)) setParabens(true);
    } else setParabens(false);
  };

  useEffect(() => {
    const carregar = async (uid: string | null) => {
      if (!uid) return avaliar(null);
      const { data } = await supabase.from("profiles").select("id,nome,apelido,nascimento").eq("id", uid).maybeSingle();
      avaliar(data ?? null);
    };
    supabase.auth.getUser().then(({ data }) => carregar(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") setTimeout(() => carregar(s?.user?.id ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const salvar = async () => {
    const iso = nascParaISO(nasc);
    if (!iso || !p) { setErro("Escolha uma data válida."); return; }
    setSalvando(true);
    const { error } = await supabase.from("profiles").update({ nascimento: iso }).eq("id", p.id);
    setSalvando(false);
    if (error) { setErro("Não foi possível salvar. Tente de novo."); return; }
    avaliar({ ...p, nascimento: iso });
  };

  const fechar = () => { if (p) localStorage.setItem(`aniv-${p.id}-${hojeChave()}`, "1"); setParabens(false); };

  if (!p) return null;
  const nomeCurto = p.apelido || p.nome.split(" ")[0];

  if (!p.nascimento) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-primary/40 bg-card p-6 shadow-gold">
          <h2 className="text-3xl">Olá, {nomeCurto}!</h2>
          <p className="mt-2 text-sm text-muted-foreground">Seu cadastro continua o mesmo. Só falta informar sua data de aniversário para comemorarmos com você. Isso é pedido uma única vez.</p>
          <div className="mt-5"><CampoNascimento valor={nasc} onChange={setNasc} /></div>
          {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
          <button onClick={salvar} disabled={salvando} className="mt-5 w-full rounded-full bg-gradient-gold px-7 py-3 font-semibold text-primary-foreground disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar e continuar"}
          </button>
        </div>
      </div>
    );
  }

  if (!parabens) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-primary/60 bg-card p-8 text-center shadow-gold animate-in fade-in zoom-in-95">
        <button aria-label="Fechar" onClick={fechar} className="absolute right-4 top-3 text-2xl text-muted-foreground hover:text-foreground">×</button>
        <div className="text-5xl">🎉</div>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-primary">Feliz aniversário</p>
        <h2 className="mt-2 text-4xl">Parabéns, {nomeCurto}!</h2>
        <p className="mt-4 text-muted-foreground">
          Toda a equipe da Barbearia A Marca da Promessa deseja a você um dia abençoado, cheio de alegria, saúde e conquistas. Obrigado por fazer parte da nossa história!
        </p>
        <button onClick={fechar} className="mt-6 w-full rounded-full bg-gradient-gold px-7 py-3 font-semibold text-primary-foreground">Obrigado!</button>
      </div>
    </div>
  );
}
