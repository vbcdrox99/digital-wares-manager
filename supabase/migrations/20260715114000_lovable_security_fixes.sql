-- Migration: Lovable 17 security issues fixes
-- Date: 2026-07-15

-- ==========================================
-- 1. PROTEGER CHAVES DE API (dotapix_settings)
-- ==========================================

-- Renomear a tabela para tabela privada
ALTER TABLE IF EXISTS public.dotapix_settings RENAME TO dotapix_settings_private;

-- Criar a view dotapix_settings que filtra/mascara as chaves
CREATE OR REPLACE VIEW public.dotapix_settings AS
SELECT 
  id,
  created_at,
  updated_at,
  min_donation,
  fish_voices,
  min_donation_custom_voice,
  min_donation_audio,
  goal_target,
  goal_initial_value,
  goal_start_date,
  goal_enabled,
  youtube_integration_enabled,
  goal_end_date,
  alert_volume,
  tts_enabled,
  tts_voice,
  alert_sound_url,
  goal_title,
  fish_voice_id_1,
  fish_voice_id_2,
  fish_voice_name_1,
  fish_voice_name_2,
  goal_command,
  youtube_channel_id,
  profile_image_url,
  channel_name,
  -- Ocultar chaves de API retornando NULL para não-admins
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
    ) THEN fish_audio_key 
    ELSE NULL 
  END AS fish_audio_key,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
    ) THEN gemini_api_key 
    ELSE NULL 
  END AS gemini_api_key,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
    ) THEN youtube_api_key 
    ELSE NULL 
  END AS youtube_api_key,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
    ) THEN opendota_api_key 
    ELSE NULL 
  END AS opendota_api_key
FROM public.dotapix_settings_private;

-- Criar trigger para tratar as atualizações através da view
CREATE OR REPLACE FUNCTION public.update_dotapix_settings_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dotapix_settings_private
  SET 
    min_donation = NEW.min_donation,
    fish_voices = NEW.fish_voices,
    min_donation_custom_voice = NEW.min_donation_custom_voice,
    min_donation_audio = NEW.min_donation_audio,
    goal_target = NEW.goal_target,
    goal_initial_value = NEW.goal_initial_value,
    goal_start_date = NEW.goal_start_date,
    goal_enabled = NEW.goal_enabled,
    youtube_integration_enabled = NEW.youtube_integration_enabled,
    goal_end_date = NEW.goal_end_date,
    alert_volume = NEW.alert_volume,
    tts_enabled = NEW.tts_enabled,
    tts_voice = NEW.tts_voice,
    alert_sound_url = NEW.alert_sound_url,
    goal_title = NEW.goal_title,
    fish_voice_id_1 = NEW.fish_voice_id_1,
    fish_voice_id_2 = NEW.fish_voice_id_2,
    fish_voice_name_1 = NEW.fish_voice_name_1,
    fish_voice_name_2 = NEW.fish_voice_name_2,
    goal_command = NEW.goal_command,
    youtube_channel_id = NEW.youtube_channel_id,
    profile_image_url = NEW.profile_image_url,
    channel_name = NEW.channel_name,
    -- Preservar chaves originais caso o valor enviado seja nulo
    fish_audio_key = COALESCE(NEW.fish_audio_key, fish_audio_key),
    gemini_api_key = COALESCE(NEW.gemini_api_key, gemini_api_key),
    youtube_api_key = COALESCE(NEW.youtube_api_key, youtube_api_key),
    opendota_api_key = COALESCE(NEW.opendota_api_key, opendota_api_key)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_dotapix_settings ON public.dotapix_settings;
CREATE TRIGGER tr_update_dotapix_settings
INSTEAD OF UPDATE ON public.dotapix_settings
FOR EACH ROW EXECUTE FUNCTION public.update_dotapix_settings_view();

-- Revogar permissão pública da tabela privada e garantir privilégios na View
REVOKE ALL ON public.dotapix_settings_private FROM anon, authenticated, public;
GRANT SELECT, UPDATE ON public.dotapix_settings TO anon, authenticated;


-- ==========================================
-- 2. PROTEGER DOACÕES (dotapix_donations)
-- ==========================================

DROP POLICY IF EXISTS "Allow read own donation" ON public.dotapix_donations;

CREATE POLICY "Permitir select de doações para admins ou públicas pagas" 
ON public.dotapix_donations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
  )
  OR is_paid = true
);

-- Revogar select em colunas sensíveis de pagamentos para usuários públicos
REVOKE SELECT (payment_id, external_id) ON public.dotapix_donations FROM anon, authenticated;


-- ==========================================
-- 3. RESTRINGIR BUCKETS DE STORAGE
-- ==========================================

-- Sellers-photo: Impedir sobrescrever ou deletar arquivos de outros usuários
DROP POLICY IF EXISTS "Sellers-photo Allow upload" ON storage.objects;
CREATE POLICY "Sellers-photo Allow upload" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'sellers-photo' AND (
    EXISTS (
      SELECT 1 FROM public.sellers s 
      WHERE s.id::text = split_part(name, '/', 1) 
      AND s.email = auth.jwt() ->> 'email'
    )
    OR (
      split_part(name, '/', 1) = 'admin' AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
      )
    )
  )
);

DROP POLICY IF EXISTS "Sellers-photo Allow update" ON storage.objects;
CREATE POLICY "Sellers-photo Allow update" ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'sellers-photo' AND (
    EXISTS (
      SELECT 1 FROM public.sellers s 
      WHERE s.id::text = split_part(name, '/', 1) 
      AND s.email = auth.jwt() ->> 'email'
    )
    OR (
      split_part(name, '/', 1) = 'admin' AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
      )
    )
  )
);

DROP POLICY IF EXISTS "Sellers-photo Allow delete" ON storage.objects;
CREATE POLICY "Sellers-photo Allow delete" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'sellers-photo' AND (
    EXISTS (
      SELECT 1 FROM public.sellers s 
      WHERE s.id::text = split_part(name, '/', 1) 
      AND s.email = auth.jwt() ->> 'email'
    )
    OR (
      split_part(name, '/', 1) = 'admin' AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role
      )
    )
  )
);

-- Dotapix-audios: Limitar escrita pública apenas à pasta donations/
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
CREATE POLICY "Allow public upload to donations folder only" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'dotapix-audios' 
  AND split_part(name, '/', 1) = 'donations'
);


-- ==========================================
-- 4. PROTEGER DADOS DE CLIENTES E VENDEDORES
-- ==========================================

-- Customers
DROP POLICY IF EXISTS "Allow public read access on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON public.customers;

CREATE POLICY "Permitir select de clientes apenas para admins" ON public.customers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));

CREATE POLICY "Permitir insert de clientes apenas para admins" ON public.customers FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));

CREATE POLICY "Permitir update de clientes apenas para admins" ON public.customers FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));

CREATE POLICY "Permitir delete de clientes apenas para admins" ON public.customers FOR DELETE
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));

-- Sellers
DROP POLICY IF EXISTS "Permitir leitura pública de vendedores" ON public.sellers;
CREATE POLICY "Permitir select de vendedores" ON public.sellers FOR SELECT
USING (
  approved = true 
  OR email = auth.jwt() ->> 'email' 
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role)
);

-- Ocultar Telefone de vendedores para acesso anônimo
REVOKE SELECT (phone) ON public.sellers FROM anon;


-- ==========================================
-- 5. CONFIGURAÇÕES DE DESTAQUE E RARIDADES
-- ==========================================

-- Rarities
DROP POLICY IF EXISTS "Allow public access" ON public.rarities;

CREATE POLICY "Permitir leitura pública de raridades" ON public.rarities FOR SELECT
USING (true);

CREATE POLICY "Permitir gerenciamento de raridades apenas para admins" ON public.rarities FOR ALL
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));

-- Premium featured
DROP POLICY IF EXISTS "select anon premium_featured" ON public.premium_featured;
DROP POLICY IF EXISTS "insert auth premium_featured" ON public.premium_featured;
DROP POLICY IF EXISTS "update auth premium_featured" ON public.premium_featured;
DROP POLICY IF EXISTS "delete auth premium_featured" ON public.premium_featured;
DROP POLICY IF EXISTS "Public read premium featured" ON public.premium_featured;
DROP POLICY IF EXISTS "Authenticated insert premium featured" ON public.premium_featured;
DROP POLICY IF EXISTS "Authenticated update premium featured" ON public.premium_featured;
DROP POLICY IF EXISTS "Authenticated delete premium featured" ON public.premium_featured;

CREATE POLICY "Permitir leitura pública de premium featured" ON public.premium_featured FOR SELECT
USING (true);

CREATE POLICY "Permitir alteração de premium featured apenas para admins" ON public.premium_featured FOR ALL
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'::public.user_role));


-- ==========================================
-- 6. SEGURANÇA DE FUNÇÕES (SECURITY DEFINER)
-- ==========================================

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- mark_donation_played
ALTER FUNCTION public.mark_donation_played(donation_id uuid) SECURITY DEFINER SET search_path = pg_catalog, public;
