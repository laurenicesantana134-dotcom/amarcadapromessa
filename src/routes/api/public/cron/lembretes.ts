import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Lembrete automático 2 horas antes do horário, para cliente e donos.
export const Route = createFileRoute("/api/public/cron/lembretes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const negado = await authenticateCronRequest(request);
        if (negado) return negado;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { enviarWhats, whatsDosDonos, fmtData } = await import("@/lib/whatsapp.server");

        const agora = Date.now();
        const de = new Date(agora + 2 * 3600 * 1000).toISOString();
        const ate = new Date(agora + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString();

        const { data: pendentes, error } = await supabaseAdmin
          .from("agendamentos")
          .select("*")
          .eq("status", "agendado")
          .eq("lembrete_enviado", false)
          .gte("inicio", de)
          .lt("inicio", ate);
        if (error) return Response.json({ ok: false, erro: error.message }, { status: 500 });

        let enviados = 0;
        for (const a of pendentes ?? []) {
          const quando = fmtData(a.inicio);
          await enviarWhats(supabaseAdmin, a.cliente_whatsapp, `Olá, ${a.cliente_nome}! Lembrete: seu horário na Barbearia A Marca da Promessa é daqui a 2 horas — ${a.servico_nome}, ${quando}. Se não puder comparecer, avise o profissional com antecedência.`, "lembrete_cliente", a.id);
          for (const w of await whatsDosDonos(supabaseAdmin)) {
            await enviarWhats(supabaseAdmin, w, `Lembrete: ${a.cliente_nome} (${a.cliente_whatsapp}) — ${a.servico_nome}, ${quando}, daqui a 2 horas.`, "lembrete_dono", a.id);
          }
          await supabaseAdmin.from("agendamentos").update({ lembrete_enviado: true }).eq("id", a.id);
          enviados++;
        }
        return Response.json({ ok: true, enviados });
      },
    },
  },
});
