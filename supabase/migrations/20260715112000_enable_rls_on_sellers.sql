-- Migration: enable RLS on sellers and add select, insert, and update policies
-- Date: 2026-07-15

-- 1. Ativar a segurança de linha na tabela de vendedores
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que qualquer pessoa visualize os vendedores
DO $$ BEGIN
  CREATE POLICY "Permitir leitura pública de vendedores" 
  ON public.sellers 
  FOR SELECT 
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Permitir que novos vendedores se cadastrem (inserção)
DO $$ BEGIN
  CREATE POLICY "Permitir cadastro de novos vendedores" 
  ON public.sellers 
  FOR INSERT 
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Permitir que apenas o próprio vendedor (por e-mail) ou um administrador atualize o cadastro
DO $$ BEGIN
  CREATE POLICY "Permitir atualização apenas pelo dono ou admin" 
  ON public.sellers 
  FOR UPDATE 
  USING (
    (auth.jwt() ->> 'email' = email) 
    OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
