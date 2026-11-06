ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nascimento date;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE nasc date;
BEGIN
  PERFORM pg_advisory_xact_lock(424242);
  BEGIN nasc := NULLIF(NEW.raw_user_meta_data->>'nascimento', '')::date;
  EXCEPTION WHEN others THEN nasc := NULL; END;
  INSERT INTO public.profiles (id, nome, apelido, whatsapp, nascimento)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'apelido', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.id::text),
    nasc);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'dono') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dono');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;