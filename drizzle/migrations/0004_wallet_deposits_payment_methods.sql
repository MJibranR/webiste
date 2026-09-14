-- Wallet / manual deposit system for PROXIUM CORPORATION

-- 1. Payment methods (admin managed)
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_label text NOT NULL DEFAULT 'Number',
  account_value text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  logo_emoji text NOT NULL DEFAULT '💳',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment methods readable by everyone" ON public.payment_methods
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage payment methods" ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.payment_methods (name, account_label, account_value, instructions, logo_emoji, sort_order) VALUES
  ('bKash', 'Number', '01711225265', 'Send Money to this bKash number, then submit the transaction ID below.', '📱', 1),
  ('Nagad', 'Number', '01759070941', 'Send Money to this Nagad number, then submit the transaction ID below.', '📲', 2),
  ('Binance', 'Binance ID', '992506560', 'Send USDT to this Binance ID, then submit the transfer ID below.', '🪙', 3);

-- 2. Payment settings (exchange rate + tutorial)
CREATE TABLE public.payment_settings (
  id text PRIMARY KEY DEFAULT 'main',
  usd_to_bdt numeric NOT NULL DEFAULT 125,
  tutorial_video_url text NOT NULL DEFAULT 'https://www.youtube.com/embed/O2Xrrlw_xQo',
  tutorial_heading text NOT NULL DEFAULT 'HOW TO RECHARGE WALLET // STEP-BY-STEP',
  tutorial_text text NOT NULL DEFAULT 'Pick a method, send the exact BDT amount, then submit your transaction ID. Your wallet is credited after admin approval.',
  min_deposit_usd numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment settings readable by everyone" ON public.payment_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update payment settings" ON public.payment_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert payment settings" ON public.payment_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.payment_settings (id) VALUES ('main');

-- 3. Deposits
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL DEFAULT '',
  amount_usd numeric NOT NULL,
  amount_bdt numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 125,
  method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  method_name text NOT NULL DEFAULT '',
  sender_info text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX deposits_user_idx ON public.deposits(user_id);
CREATE INDEX deposits_status_idx ON public.deposits(status);
GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own deposits" ON public.deposits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- 4. Wallet transactions (ledger, idempotent per source)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'credit',
  amount numeric NOT NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  source_type text NOT NULL DEFAULT 'manual',
  source_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wallet_tx_source_unique ON public.wallet_transactions(source_type, source_id)
  WHERE source_id IS NOT NULL;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Profile totals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_deposited numeric NOT NULL DEFAULT 0;

-- 6. Product durations
CREATE TABLE public.product_durations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  days integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_durations_product_idx ON public.product_durations(product_id);
GRANT SELECT ON public.product_durations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_durations TO authenticated;
GRANT ALL ON public.product_durations TO service_role;
ALTER TABLE public.product_durations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Durations readable by everyone" ON public.product_durations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage durations" ON public.product_durations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Purchase extra columns
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS duration_id uuid;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 8. Atomic, admin-only deposit approval
CREATE OR REPLACE FUNCTION public.approve_deposit(_deposit_id uuid, _admin_note text DEFAULT '')
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dep public.deposits;
  _new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT * INTO _dep FROM public.deposits WHERE id = _deposit_id FOR UPDATE;
  IF _dep.id IS NULL THEN
    RAISE EXCEPTION 'deposit not found';
  END IF;
  IF _dep.status <> 'pending' THEN
    RAISE EXCEPTION 'deposit already %', _dep.status;
  END IF;

  UPDATE public.profiles
     SET balance = balance + _dep.amount_usd,
         total_deposited = total_deposited + _dep.amount_usd
   WHERE id = _dep.user_id
   RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RAISE EXCEPTION 'user profile missing';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, kind, amount, balance_after, source_type, source_id, note)
  VALUES (_dep.user_id, 'credit', _dep.amount_usd, _new_balance, 'deposit', _deposit_id::text,
          'Deposit approved via ' || _dep.method_name);

  UPDATE public.deposits
     SET status = 'approved',
         admin_note = coalesce(_admin_note, ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _deposit_id
   RETURNING * INTO _dep;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (_dep.user_id::text, 'DEPOSIT APPROVED',
          'Your deposit of $' || _dep.amount_usd || ' has been approved and added to your wallet.');

  RETURN _dep;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_deposit(_deposit_id uuid, _admin_note text DEFAULT '')
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dep public.deposits;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT * INTO _dep FROM public.deposits WHERE id = _deposit_id FOR UPDATE;
  IF _dep.id IS NULL THEN
    RAISE EXCEPTION 'deposit not found';
  END IF;
  IF _dep.status <> 'pending' THEN
    RAISE EXCEPTION 'deposit already %', _dep.status;
  END IF;

  UPDATE public.deposits
     SET status = 'rejected',
         admin_note = coalesce(_admin_note, ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _deposit_id
   RETURNING * INTO _dep;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (_dep.user_id::text, 'DEPOSIT REJECTED',
          'Your deposit of $' || _dep.amount_usd || ' was rejected. ' || coalesce(_admin_note, ''));

  RETURN _dep;
END;
$$;

-- 9. Server-side wallet purchase (price never trusted from browser)
CREATE OR REPLACE FUNCTION public.purchase_with_wallet(_product_id text, _duration_id uuid DEFAULT NULL)
RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _product public.products;
  _dur public.product_durations;
  _price numeric;
  _plan text;
  _expires timestamptz;
  _balance numeric;
  _purchase public.purchases;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO _product FROM public.products WHERE id = _product_id;
  IF _product.id IS NULL THEN
    RAISE EXCEPTION 'product not found';
  END IF;
  IF _product.in_stock IS NOT TRUE THEN
    RAISE EXCEPTION 'product out of stock';
  END IF;

  IF _duration_id IS NOT NULL THEN
    SELECT * INTO _dur FROM public.product_durations WHERE id = _duration_id AND product_id = _product_id;
    IF _dur.id IS NULL THEN
      RAISE EXCEPTION 'plan not found';
    END IF;
    _price := _dur.price;
    _plan := _dur.label;
    IF _dur.days > 0 THEN
      _expires := now() + (_dur.days || ' days')::interval;
    END IF;
  ELSE
    _price := coalesce(_product.price, 0);
    _plan := 'LIFETIME';
  END IF;

  UPDATE public.profiles
     SET balance = balance - _price,
         total_spent = total_spent + _price
   WHERE id = _uid AND balance >= _price
   RETURNING balance INTO _balance;

  IF _balance IS NULL THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  INSERT INTO public.purchases (user_id, product_id, product_name, plan, price, status, download_link, duration_id, expires_at)
  VALUES (_uid, _product_id, _product.name, _plan, _price, 'pending', coalesce(_product.download_link, ''), _duration_id, _expires)
  RETURNING * INTO _purchase;

  INSERT INTO public.wallet_transactions (user_id, kind, amount, balance_after, source_type, source_id, note)
  VALUES (_uid, 'debit', _price, _balance, 'purchase', _purchase.id::text, 'Purchase: ' || _product.name || ' (' || _plan || ')');

  INSERT INTO public.activity_log (type, actor, message)
  VALUES ('purchase', _uid::text, 'Wallet purchase: ' || _product.name || ' (' || _plan || ') $' || _price);

  RETURN _purchase;
END;
$$;
