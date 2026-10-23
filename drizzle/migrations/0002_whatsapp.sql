CREATE TABLE public.whatsapp_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  para text NOT NULL,
  tipo text NOT NULL,
  agendamento_id uuid,
  wa_id text UNIQUE,
  status text NOT NULL DEFAULT 'accepted',
  erro text,
  status_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_mensagens TO service_role;
GRANT SELECT ON public.whatsapp_mensagens TO authenticated;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dono le mensagens" ON public.whatsapp_mensagens FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'dono'));

CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  tentativas int NOT NULL DEFAULT 0
);
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
GRANT SELECT ON public.whatsapp_webhook_events TO authenticated;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dono le eventos" ON public.whatsapp_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'dono'));