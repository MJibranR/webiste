-- Allow admins to manage member profiles and roles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- Creates the caller's profile + default role on first sign-in.
CREATE OR REPLACE FUNCTION public.ensure_profile(_full_name text DEFAULT '', _whatsapp text DEFAULT '', _username text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := coalesce(auth.jwt() ->> 'email', '');
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, whatsapp, username)
  VALUES (
    _uid,
    _email,
    nullif(_full_name, ''),
    nullif(_whatsapp, ''),
    coalesce(nullif(_username, ''), split_part(_email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        whatsapp = coalesce(public.profiles.whatsapp, excluded.whatsapp),
        username = coalesce(public.profiles.username, excluded.username);

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, CASE WHEN lower(_email) = 'admin@spiderhex.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile(text, text, text) TO authenticated;