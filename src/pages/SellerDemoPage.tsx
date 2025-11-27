import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';

type Seller = {
  id: string;
  name: string | null;
  email: string | null;
  status: 'approved' | 'pending' | 'rejected' | string;
};

const SellerDemoPage: React.FC = () => {
  const { id } = useParams();
  const [seller, setSeller] = React.useState<Seller | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('sellers').select('id,name,email,status').eq('id', id).maybeSingle();
      setSeller(data as Seller | null);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navigation />
      <div className="container mx-auto px-6 pt-24 pb-12">
        {loading ? (
          <div className="text-center text-gray-300">Carregando...</div>
        ) : seller ? (
          seller.status !== 'approved' ? (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Página indisponível</h1>
              <p className="text-gray-400 mb-4">Este vendedor ainda não foi aprovado. Volte mais tarde.</p>
              <Link to="/" className="text-cyan-400 hover:text-cyan-300">Voltar ao início</Link>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-white mb-2">Página do Vendedor</h1>
              <p className="text-gray-400 mb-6">Bem-vindo, {seller.name}!</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h2 className="text-white font-semibold mb-2">Resumo</h2>
                  <p className="text-sm text-gray-400">Este é um exemplo inicial da sua página de vendas. Em breve você poderá cadastrar itens, acompanhar pedidos e falar com clientes.</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h2 className="text-white font-semibold mb-2">Contato</h2>
                  <p className="text-sm text-gray-400">Email: {seller.email}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h2 className="text-white font-semibold mb-2">Próximos Passos</h2>
                  <ul className="text-sm text-gray-400 list-disc list-inside">
                    <li>Cadastro de itens à venda</li>
                    <li>Gerenciamento de pedidos</li>
                    <li>Painel de métricas</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <Link to="/" className="text-cyan-400 hover:text-cyan-300">Voltar ao início</Link>
              </div>
            </div>
          )
        ) : (
          <div className="text-center text-red-400">Vendedor não encontrado</div>
        )}
      </div>
    </div>
  );
};

export default SellerDemoPage;