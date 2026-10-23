CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  cliente_nome text NOT NULL,
  cliente_whatsapp text NOT NULL,
  servico_id text NOT NULL,
  servico_nome text NOT NULL,
  preco numeric NOT NULL,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendado',
  observacao text,
  lembrete_enviado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cliente ve os seus" ON public.agendamentos FOR SELECT TO authenticated USING (cliente_id = auth.uid() OR public.has_role(auth.uid(),'dono'));
CREATE POLICY "cliente cria o seu" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "dono gerencia" ON public.agendamentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'dono') OR cliente_id = auth.uid());

CREATE OR REPLACE FUNCTION public.checar_conflito() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'agendado' AND EXISTS (
    SELECT 1 FROM public.agendamentos a WHERE a.id <> NEW.id AND a.status = 'agendado'
      AND a.inicio < NEW.fim AND a.fim > NEW.inicio) THEN
    RAISE EXCEPTION 'Este horário acabou de ficar indisponível. Escolha outro.';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.inicio <= now() THEN
    RAISE EXCEPTION 'Este horário já passou.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER agendamentos_conflito BEFORE INSERT OR UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.checar_conflito();

CREATE OR REPLACE FUNCTION public.horarios_ocupados(_de timestamptz, _ate timestamptz)
RETURNS TABLE(inicio timestamptz, fim timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT inicio, fim FROM public.agendamentos WHERE status = 'agendado' AND inicio < _ate AND fim > _de
$$;
GRANT EXECUTE ON FUNCTION public.horarios_ocupados(timestamptz, timestamptz) TO anon, authenticated;