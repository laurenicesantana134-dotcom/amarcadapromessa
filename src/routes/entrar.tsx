import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { emailDoWhats, soDigitos } from "@/hooks/useAuth";
import { notificarCadastro } from "@/lib/notificacoes.functions";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar cadastro — A Marca da Promessa" },
      { name: "description", content: "Crie seu cadastro com nome, apelido e WhatsApp ou entre na sua conta." },
      { property: "og:title", content: "Entrar — A Marca da Promessa" },
      { property: "og:description", content: "Crie seu cadastro ou entre na sua conta." },
    ],
  }),
  component: Entrar,
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  apelido: z.string().trim().min(1, "Informe um apelido").max(40),
  whatsapp: z.string().refine((v) => soDigitos(v).length >= 10 && soDigitos(v).length <= 13, "WhatsApp inválido (com DDD)"),
  senha: z.string().min(6, "A senha precisa de pelo menos 6 caracteres").max(72),
});

const input = "w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary";

function Entrar() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastro">("cadastro");
  const [f, setF] = useState({ nome: "", apelido: "", whatsapp: "", senha: "" });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      if (modo === "cadastro") {
        const r = cadastroSchema.safeParse(f);
        if (!r.success) { setErro(r.error.issues[0]?.message ?? "Dados inválidos"); return; }
        const w = soDigitos(r.data.whatsapp);
        const { error } = await supabase.auth.signUp({
          email: emailDoWhats(w),
          password: r.data.senha,
          options: { emailRedirectTo: window.location.origin, data: { nome: r.data.nome, apelido: r.data.apelido, whatsapp: w } },
        });
        if (error) { setErro(error.message.includes("registered") ? "Esse WhatsApp já tem cadastro. Use Entrar." : error.message); return; }
        notificarCadastro().catch(() => {});
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailDoWhats(f.whatsapp), password: f.senha });
        if (error) { setErro("WhatsApp ou senha incorretos."); return; }
      }
      navigate({ to: "/conta" });
    } finally { setEnviando(false); }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-5 py-14">
        <h1 className="text-5xl">{modo === "cadastro" ? "Criar cadastro" : "Entrar"}</h1>
        <div className="mt-6 grid grid-cols-2 rounded-full border border-border p-1 text-sm">
          {(["cadastro", "entrar"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setModo(m); setErro(""); }} className={`rounded-full py-2 font-semibold ${modo === m ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "cadastro" ? "Criar cadastro" : "Já tenho conta"}
            </button>
          ))}
        </div>
        <form onSubmit={enviar} className="mt-8 space-y-3">
          {modo === "cadastro" && (
            <>
              <input className={input} placeholder="Nome completo" value={f.nome} onChange={set("nome")} />
              <input className={input} placeholder="Apelido" value={f.apelido} onChange={set("apelido")} />
            </>
          )}
          <input className={input} placeholder="WhatsApp com DDD" inputMode="tel" value={f.whatsapp} onChange={set("whatsapp")} />
          <input className={input} placeholder="Senha" type="password" value={f.senha} onChange={set("senha")} />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <button disabled={enviando} className="w-full rounded-full bg-gradient-gold px-7 py-4 font-semibold text-primary-foreground shadow-gold disabled:opacity-50">
            {enviando ? "Aguarde..." : modo === "cadastro" ? "Criar cadastro" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
