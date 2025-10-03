import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client'

// Preconnect/DNS-prefetch para reduzir latência do primeiro acesso
(() => {
  try {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    if (url) {
      const origin = new URL(url).origin;
      const linkPreconnect = document.createElement('link');
      linkPreconnect.rel = 'preconnect';
      linkPreconnect.href = origin;
      linkPreconnect.crossOrigin = '';
      document.head.appendChild(linkPreconnect);

      const linkDnsPrefetch = document.createElement('link');
      linkDnsPrefetch.rel = 'dns-prefetch';
      linkDnsPrefetch.href = origin;
      document.head.appendChild(linkDnsPrefetch);
    }
  } catch (e) {
    // Silencioso: não bloquear render em caso de falha
  }
})();

// Warm-up de conexão: pequena consulta paralela para estabelecer TLS/HTTP2
(async () => {
  try {
    await supabase.from('items').select('id').limit(1);
  } catch (_) {
    // Ignorar erros; objetivo é apenas aquecer a conexão
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
