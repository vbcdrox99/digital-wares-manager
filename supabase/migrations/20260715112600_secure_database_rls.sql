-- Migration: secure database tables with production RLS policies
-- Date: 2026-07-15

-- ==========================================
-- 1. LIMPAR POLÍTICAS ANTIGAS DE DESENVOLVIMENTO
-- ==========================================

-- chests
DROP POLICY IF EXISTS "Acesso anônimo a baús" ON public.chests;

-- items
DROP POLICY IF EXISTS "Acesso anônimo a itens" ON public.items;

-- orders
DROP POLICY IF EXISTS "Acesso anônimo a pedidos" ON public.orders;
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_update_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON public.orders;

-- order_items
DROP POLICY IF EXISTS "Acesso anônimo a itens de pedidos" ON public.order_items;
DROP POLICY IF EXISTS "anon_insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "anon_update_order_items" ON public.order_items;
DROP POLICY IF EXISTS "anon_delete_order_items" ON public.order_items;

-- shipping_queue
DROP POLICY IF EXISTS "Acesso anônimo a fila de envios" ON public.shipping_queue;
DROP POLICY IF EXISTS "anon_insert_shipping_queue" ON public.shipping_queue;
DROP POLICY IF EXISTS "anon_update_shipping_queue" ON public.shipping_queue;
DROP POLICY IF EXISTS "anon_delete_shipping_queue" ON public.shipping_queue;

-- expenses
DROP POLICY IF EXISTS "Allow all on expenses" ON public.expenses;

-- dota_matches_settings
DROP POLICY IF EXISTS "Public Write Access Settings" ON public.dota_matches_settings;


-- ==========================================
-- 2. GARANTIR QUE RLS ESTÁ ATIVADO
-- ==========================================
ALTER TABLE public.chests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dota_matches_settings ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 3. APLICAR NOVAS POLÍTICAS DE PRODUÇÃO
-- ==========================================

-- --- CHESTS (Baús) ---
CREATE POLICY "Permitir leitura pública de baús" 
ON public.chests FOR SELECT 
USING (true);

CREATE POLICY "Permitir alteração de baús apenas para admins" 
ON public.chests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);


-- --- ITEMS (Produtos) ---
CREATE POLICY "Permitir leitura pública de itens" 
ON public.items FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de itens para admins ou vendedores aprovados" 
ON public.items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.sellers s 
    WHERE s.email = auth.jwt() ->> 'email' AND s.approved = true AND s.id = seller_id
  )
);

CREATE POLICY "Permitir atualização de itens para admins ou vendedores donos" 
ON public.items FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.sellers s 
    WHERE s.email = auth.jwt() ->> 'email' AND s.approved = true AND s.id = seller_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.sellers s 
    WHERE s.email = auth.jwt() ->> 'email' AND s.approved = true AND s.id = seller_id
  )
);

CREATE POLICY "Permitir exclusão de itens para admins ou vendedores donos" 
ON public.items FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.sellers s 
    WHERE s.email = auth.jwt() ->> 'email' AND s.approved = true AND s.id = seller_id
  )
);


-- --- ORDERS (Pedidos) ---
CREATE POLICY "Permitir select de pedidos para admins, vendedores ou donos" 
ON public.orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  customer_name = auth.jwt() ->> 'email' 
  OR 
  customer_name = auth.jwt() ->> 'name' 
  OR 
  EXISTS (
    SELECT 1 FROM public.order_items oi 
    JOIN public.items i ON oi.item_id = i.id 
    JOIN public.sellers s ON i.seller_id = s.id 
    WHERE oi.order_id = orders.id AND s.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Permitir inserção de pedidos para usuários autenticados" 
ON public.orders FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de pedidos para admins" 
ON public.orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);

CREATE POLICY "Permitir exclusão de pedidos para admins" 
ON public.orders FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);


-- --- ORDER ITEMS (Itens do Pedido) ---
CREATE POLICY "Permitir leitura de itens de pedidos para pessoas autorizadas" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND (o.customer_name = auth.jwt() ->> 'email' OR o.customer_name = auth.jwt() ->> 'name')
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM public.items i 
    JOIN public.sellers s ON i.seller_id = s.id 
    WHERE i.id = item_id AND s.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Permitir inserção de itens de pedidos para usuários autenticados" 
ON public.order_items FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir alteração de itens de pedidos para admins" 
ON public.order_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);


-- --- SHIPPING QUEUE (Fila de Envios) ---
CREATE POLICY "Permitir controle da fila de envios apenas para admins" 
ON public.shipping_queue FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);


-- --- EXPENSES (Despesas) ---
CREATE POLICY "Permitir gerenciamento de despesas apenas para admins" 
ON public.expenses FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);


-- --- DOTA MATCHES SETTINGS (Configurações do Widget) ---
CREATE POLICY "Permitir alteração de configurações apenas para admins" 
ON public.dota_matches_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
);
