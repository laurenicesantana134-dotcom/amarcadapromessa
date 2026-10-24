ALTER TABLE public.user_roles ADD COLUMN ativo boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND ativo
  )
$$;

CREATE POLICY "dono ativa e desativa papeis"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'dono'))
WITH CHECK (public.has_role(auth.uid(), 'dono'));