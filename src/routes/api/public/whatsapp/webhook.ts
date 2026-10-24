import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";

// Recebe os eventos do WhatsApp (mensagens e status de entrega) e guarda tudo no banco.
export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WHATSAPP_API_KEY"];
        if (!secret) return new Response("WhatsApp não configurado", { status: 500 });

        const verificacao = await verifyWebhookRequest(request, secret, { maxBodyBytes: 4 * 1024 * 1024 });
        if (!verificacao.ok) return new Response("Assinatura inválida", { status: 401 });

        const deliveryId = request.headers.get("x-lovable-delivery");
        const event = request.headers.get("x-lovable-event");
        if (!deliveryId || !event) return new Response("Cabeçalhos ausentes", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { aplicarStatus } = await import("@/lib/whatsapp.server");
        const payload = verificacao.body as unknown;

        const { data: existente } = await supabaseAdmin
          .from("whatsapp_webhook_events")
          .select("id,processed_at")
          .eq("delivery_id", deliveryId)
          .maybeSingle();

        let eventoId = existente?.id as string | undefined;
        if (!eventoId) {
          const { data: novo, error } = await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({ delivery_id: deliveryId, event, payload: payload as never })
            .select("id")
            .single();
          if (error) return Response.json({ ok: false, erro: error.message }, { status: 500 });
          eventoId = novo.id;
        } else if (existente?.processed_at) {
          return Response.json({ ok: true, duplicado: true });
        }

        try {
          let pendente = false;
          if (event === "whatsapp.status") pendente = !(await aplicarStatus(supabaseAdmin, payload));
          await supabaseAdmin
            .from("whatsapp_webhook_events")
            .update(pendente
              ? { tentativas: (existente?.tentativas ?? 0) + 1, processing_error: "status ainda sem mensagem correspondente" }
              : { processed_at: new Date().toISOString(), processing_error: null })
            .eq("id", eventoId);
          return Response.json({ ok: true, pendente });
        } catch (e) {
          await supabaseAdmin
            .from("whatsapp_webhook_events")
            .update({ tentativas: (existente?.tentativas ?? 0) + 1, processing_error: String(e).slice(0, 1000) })
            .eq("id", eventoId);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
