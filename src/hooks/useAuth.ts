import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = { id: string; nome: string; apelido: string; whatsapp: string };

export const soDigitos = (s: string) => s.replace(/\D/g, "");
export const emailDoWhats = (w: string) => `${soDigitos(w)}@marcadapromessa.app`;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [dono, setDono] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async (u: User | null) => {
      setUser(u);
      if (!u) { setPerfil(null); setDono(false); setCarregando(false); return; }
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id,nome,apelido,whatsapp").eq("id", u.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "dono"),
      ]);
      setPerfil(p ?? null);
      setDono((r?.length ?? 0) > 0);
      setCarregando(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => carregar(s?.user ?? null), 0); });
    supabase.auth.getUser().then(({ data }) => carregar(data.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, perfil, dono, carregando };
}
