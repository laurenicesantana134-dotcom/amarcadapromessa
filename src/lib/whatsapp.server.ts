// Envio de mensagens pelo número da barbearia (conector WhatsApp via gateway). Somente servidor.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function enviarWhats(admin: Admin, para: string, texto: string, tipo: string, agendamentoId?: string) {
  const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
  const WHATSAPP_API_KEY = process.env["WHATSAPP_API_KEY"];
  const to = para.replace(/\D/g, "");
  const numero = to.length <= 11 ? `55${to}` : to;
  if (!LOVABLE_API_KEY || !WHATSAPP_API_KEY) {
    await admin.from("whatsapp_mensagens").insert({ para: numero, tipo, agendamento_id: agendamentoId ?? null, status: "failed", erro: "WhatsApp não conectado" });
    return;
  }
  const res = await fetch(`${GATEWAY_URL}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": WHATSAPP_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: numero, type: "text", text: { body: texto } }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`WhatsApp falhou [${res.status}]: ${body}`);
    await admin.from("whatsapp_mensagens").insert({ para: numero, tipo, agendamento_id: agendamentoId ?? null, status: "failed", erro: `${res.status}: ${body}`.slice(0, 1000) });
    return;
  }
  const waId = (JSON.parse(body) as { messages?: { id: string }[] }).messages?.[0]?.id ?? null;
  await admin.from("whatsapp_mensagens").insert({ para: numero, tipo, agendamento_id: agendamentoId ?? null, wa_id: waId, status: "accepted" });
  if (waId) await reconciliarStatus(admin, waId);
}

const ORDEM: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

// Aplica callbacks de status que já chegaram para este id.
export async function reconciliarStatus(admin: Admin, waId: string) {
  const { data: evs } = await admin.from("whatsapp_webhook_events").select("payload").eq("event", "whatsapp.status").filter("payload::text", "ilike", `%${waId}%`);
  for (const e of evs ?? []) await aplicarStatus(admin, e.payload);
}

export async function aplicarStatus(admin: Admin, payload: unknown): Promise<boolean> {
  const sts = ((payload as any)?.entry?.[0]?.changes?.[0]?.value?.statuses ?? []) as { id: string; status: string; timestamp?: string; errors?: unknown[] }[];
  let todosAchados = true;
  for (const s of sts) {
    const { data: m } = await admin.from("whatsapp_mensagens").select("id,status").eq("wa_id", s.id).maybeSingle();
    if (!m) { todosAchados = false; continue; }
    if ((ORDEM[s.status] ?? 0) <= (ORDEM[m.status] ?? 0)) continue;
    const { error } = await admin.from("whatsapp_mensagens").update({
      status: s.status,
      status_em: s.timestamp ? new Date(+s.timestamp * 1000).toISOString() : null,
      erro: s.errors?.length ? JSON.stringify(s.errors).slice(0, 1000) : null,
    }).eq("id", m.id);
    if (error) throw error;
  }
  return todosAchados;
}

export async function whatsDosDonos(admin: Admin): Promise<string[]> {
  const { data: r } = await admin.from("user_roles").select("user_id").eq("role", "dono");
  const ids = (r ?? []).map((x) => x.user_id);
  if (!ids.length) return [];
  const { data } = await admin.from("profiles").select("whatsapp").in("id", ids);
  return (data ?? []).map((p) => p.whatsapp);
}

export const fmtData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Bahia", weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
