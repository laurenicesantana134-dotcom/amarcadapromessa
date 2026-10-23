import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const notificarCadastro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: p } = await context.supabase.from("profiles").select("nome,apelido,whatsapp").eq("id", context.userId).maybeSingle();
    if (!p) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { enviarWhats, whatsDosDonos } = await import("./whatsapp.server");
    await enviarWhats(supabaseAdmin, p.whatsapp, `Olá, ${p.apelido}! Seu cadastro na Barbearia A Marca da Promessa foi criado. Agora é só agendar seu horário pelo site.`, "cadastro_cliente");
    for (const w of await whatsDosDonos(supabaseAdmin)) {
      if (w === p.whatsapp) continue;
      await enviarWhats(supabaseAdmin, w, `Novo cadastro na barbearia: ${p.nome} (${p.apelido}) — WhatsApp ${p.whatsapp}.`, "cadastro_dono");
    }
    return { ok: true };
  });

export const notificarAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => {
    if (typeof i?.id !== "string") throw new Error("id inválido");
    return i;
  })
  .handler(async ({ data, context }) => {
    // RLS garante que o cliente só lê o próprio agendamento
    const { data: a } = await context.supabase.from("agendamentos").select("*").eq("id", data.id).maybeSingle();
    if (!a) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { enviarWhats, whatsDosDonos, fmtData } = await import("./whatsapp.server");
    const quando = fmtData(a.inicio);
    await enviarWhats(supabaseAdmin, a.cliente_whatsapp, `Olá, ${a.cliente_nome}! Seu horário na Barbearia A Marca da Promessa está confirmado: ${a.servico_nome}, ${quando}. Se não puder comparecer, avise o profissional com antecedência.`, "agendamento_cliente", a.id);
    for (const w of await whatsDosDonos(supabaseAdmin)) {
      await enviarWhats(supabaseAdmin, w, `Novo agendamento: ${a.cliente_nome} (${a.cliente_whatsapp}) — ${a.servico_nome}, ${quando}.`, "agendamento_dono", a.id);
    }
    return { ok: true };
  });
