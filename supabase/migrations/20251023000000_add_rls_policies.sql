-- Migration: add explicit RLS policies for orders-related tables
-- Note: These policies were applied in production; this migration tracks them in code.

-- Orders
DO $$ BEGIN
  CREATE POLICY "anon_select_orders" ON orders FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_insert_orders" ON orders FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_update_orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_delete_orders" ON orders FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Order items
DO $$ BEGIN
  CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shipping queue
DO $$ BEGIN
  CREATE POLICY "anon_insert_shipping_queue" ON shipping_queue FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_update_shipping_queue" ON shipping_queue FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "anon_delete_shipping_queue" ON shipping_queue FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;