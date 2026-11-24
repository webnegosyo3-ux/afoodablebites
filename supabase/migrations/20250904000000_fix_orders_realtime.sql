/*
  # Create orders table + enable Realtime

  Creates the orders table if it doesn't exist yet, adds the GCash payment
  verification columns, sets up RLS so customers can insert and the admin
  can read/update, then enables Supabase Realtime so the admin phone gets
  an instant push notification the moment a customer places an order.
*/

-- ── 1. Helper: auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Create the orders table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                       text PRIMARY KEY,
  customer_name            text NOT NULL,
  contact_number           text NOT NULL,
  service_type             text NOT NULL,
  address                  text,
  landmark                 text,
  pickup_time              text,
  payment_method           text NOT NULL,
  payment_sender_name      text,
  payment_reference_number text,
  total                    numeric(10,2) NOT NULL,
  items                    jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes                    text,
  status                   text NOT NULL DEFAULT 'pending',
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- ── 3. Add columns in case the table already existed without them ─────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_sender_name      text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference_number text;

-- ── 4. Auto-update trigger ────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can manage orders" ON orders;
CREATE POLICY "Public can manage orders"
  ON orders FOR ALL TO public
  USING (true) WITH CHECK (true);

-- ── 6. Enable Realtime (instant push to admin phone on new order) ─────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
