CREATE TYPE public.app_role AS ENUM ('dono');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  apelido text NOT NULL,
  whatsapp text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "ver proprio perfil ou dono ve todos" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'dono'));
CREATE POLICY "editar proprio perfil" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "ver proprios papeis ou dono ve todos" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'dono'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);
  INSERT INTO public.profiles (id, nome, apelido, whatsapp)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'apelido', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.id::text));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'dono') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dono');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.indicar_dono(_whatsapp text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE alvo uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'dono') THEN RAISE EXCEPTION 'Apenas donos podem indicar outro dono'; END IF;
  SELECT id INTO alvo FROM public.profiles WHERE whatsapp = regexp_replace(_whatsapp, '\D', '', 'g');
  IF alvo IS NULL THEN RAISE EXCEPTION 'Nenhum cadastro encontrado com esse WhatsApp'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (alvo, 'dono') ON CONFLICT DO NOTHING;
  RETURN (SELECT apelido FROM public.profiles WHERE id = alvo);
END $$;

REVOKE EXECUTE ON FUNCTION public.indicar_dono(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.indicar_dono(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;