CREATE TABLE public.redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  product_id text,
  product_name text NOT NULL DEFAULT '',
  download_link text NOT NULL DEFAULT '',
  access_key text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_by uuid,
  claimed_by uuid,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redeem_codes TO authenticated;
GRANT ALL ON public.redeem_codes TO service_role;

ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage redeem codes" ON public.redeem_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own claimed codes" ON public.redeem_codes
  FOR SELECT TO authenticated
  USING (claimed_by = auth.uid());

CREATE OR REPLACE FUNCTION public.redeem_code(_code text)
RETURNS public.redeem_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.redeem_codes;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO _row FROM public.redeem_codes
   WHERE upper(code) = upper(btrim(_code));

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'invalid code';
  END IF;

  IF _row.claimed_by IS NOT NULL AND _row.claimed_by <> _uid THEN
    RAISE EXCEPTION 'code already used';
  END IF;

  UPDATE public.redeem_codes
     SET claimed_by = _uid,
         claimed_at = coalesce(claimed_at, now())
   WHERE id = _row.id
   RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;
