-- Product detail fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_monthly numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_weekly numeric;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Orders / licenses
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text,
  product_name text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'LIFETIME',
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  download_link text NOT NULL DEFAULT '',
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  credentials text NOT NULL DEFAULT '',
  is_redeem boolean NOT NULL DEFAULT false,
  purchase_date timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own purchases" ON public.purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own purchases" ON public.purchases
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update purchases" ON public.purchases
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete purchases" ON public.purchases
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notifications ('*' = broadcast to everyone)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  read_by text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = '*' OR user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members mark notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = '*' OR user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);
CREATE POLICY "Admins delete notifications" ON public.notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'user',
  actor text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT INSERT ON public.activity_log TO anon;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read activity" ON public.activity_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can log activity" ON public.activity_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins clear activity" ON public.activity_log
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site settings: lock down with RLS (public read, admin write)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

CREATE POLICY "Settings readable by everyone" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));