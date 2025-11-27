import React from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Store, PlusCircle, ListChecks, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { itemsService, type InsertItem, type Item } from '@/integrations/supabase/services/items';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const SellerAreaPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sellerId, setSellerId] = React.useState<string | null>(null);
  const [sellerApproved, setSellerApproved] = React.useState<boolean>(false);
  const [parceirosChestId, setParceirosChestId] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [myItems, setMyItems] = React.useState<Item[]>([]);

  // Form state
  const [name, setName] = React.useState('');
  const [heroName, setHeroName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [price, setPrice] = React.useState<string>('');
  const [initialStock, setInitialStock] = React.useState<string>('');
  const [rarity, setRarity] = React.useState<'comum' | 'persona' | 'arcana' | 'immortal'>('comum');

  const rarities = [
    { value: 'comum', label: 'Comum' },
    { value: 'persona', label: 'Persona' },
    { value: 'arcana', label: 'Arcana' },
    { value: 'immortal', label: 'Immortal' },
  ] as const;

  const loadSellerInfo = React.useCallback(async () => {
    if (!user?.email) {
      setLoadingStatus(false);
      return;
    }

    try {
      const { data: seller, error } = await supabase
        .from('sellers')
        .select('id, approved, status')
        .eq('email', user.email)
        .single();

      if (error) throw error;

      setSellerId(seller?.id || null);
      setSellerApproved(!!seller?.approved || seller?.status === 'approved');
    } catch (e) {
      console.error('Erro ao buscar vendedor:', e);
      toast({ title: 'Erro ao buscar vendedor', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  }, [user?.email, toast]);

  const loadParceirosChest = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chests')
        .select('id')
        .eq('name', 'Parceiros')
        .single();
      if (error) throw error;
      setParceirosChestId(data?.id || null);
    } catch (e) {
      console.error('Erro ao buscar baú Parceiros:', e);
      toast({ title: 'Baú Parceiros não encontrado', description: 'Contate o administrador.', variant: 'destructive' });
    }
  }, [toast]);

  const loadMyItems = React.useCallback(async () => {
    if (!sellerId) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMyItems((data || []) as Item[]);
    } catch (e) {
      console.error('Erro ao carregar itens do vendedor:', e);
    }
  }, [sellerId]);

  React.useEffect(() => {
    (async () => {
      setLoadingStatus(true);
      await loadSellerInfo();
      await loadParceirosChest();
      setLoadingStatus(false);
    })();
  }, [loadSellerInfo, loadParceirosChest]);

  React.useEffect(() => {
    loadMyItems();
  }, [loadMyItems]);

  const validateForm = (): string | null => {
    if (!sellerApproved) return 'Seu cadastro de vendedor não está aprovado.';
    if (!parceirosChestId) return 'Baú Parceiros indisponível.';
    if (!name.trim()) return 'Informe o nome do item.';
    if (!heroName.trim()) return 'Informe o nome do herói.';
    if (!imageUrl.trim()) return 'Informe a URL da imagem.';
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return 'Preço deve ser um número maior que 0.';
    const stockNum = Number(initialStock);
    if (!Number.isInteger(stockNum) || stockNum <= 0) return 'Estoque deve ser um inteiro maior que 0.';
    return null;
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      toast({ title: 'Dados inválidos', description: errorMsg, variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const priceNum = Number(price);
      const stockNum = Number(initialStock);

      const newItem: InsertItem = {
        chest_id: parceirosChestId!,
        current_stock: stockNum,
        hero_name: heroName.trim(),
        highlighted: false,
        image_url: imageUrl.trim(),
        initial_stock: stockNum,
        name: name.trim(),
        price: priceNum,
        rarity,
        is_partner: true,
        seller_id: sellerId,
        approved: false,
      };

      const created = await itemsService.create(newItem);
      toast({
        title: 'Item enviado para aprovação',
        description: `${name} foi enviado para aprovação como Parceiro.`,
      });
      setMyItems(prev => [created as Item, ...prev]);

      // Reset form
      setName('');
      setHeroName('');
      setImageUrl('');
      setPrice('');
      setInitialStock('');
      setRarity('comum');
    } catch (err: any) {
      console.error('Erro ao publicar item:', err);
      toast({ title: 'Erro ao publicar item', description: err.message || 'Falha ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navigation />

      <div className="container mx-auto px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Área do Vendedor</h1>
          </div>
          <p className="text-gray-400 mb-8">
            Bem-vindo{user?.email ? `, ${user.email}` : ''}! Cadastre itens para venda no catálogo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Status</h2>
              </div>
              <p className="text-gray-400 text-sm">
                {loadingStatus ? 'Carregando...' : sellerApproved ? 'Aprovado' : 'Pendente'}
              </p>
            </div>

            <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">Publicar Item</h2>
              </div>
              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Nome do item</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex.: Lâmina do Herói"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Nome do herói</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                    value={heroName}
                    onChange={e => setHeroName(e.target.value)}
                    placeholder="Ex.: Juggernaut"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Imagem (URL)</label>
                  <input
                    type="url"
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Ex.: 29.90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Estoque</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                      value={initialStock}
                      onChange={e => setInitialStock(e.target.value)}
                      placeholder="Ex.: 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Raridade</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"
                      value={rarity}
                      onChange={e => setRarity(e.target.value as typeof rarity)}
                    >
                      {rarities.map(r => (
                        <option key={r.value} value={r.value} className="bg-black">
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Observações:
                  <ul className="list-disc ml-4 mt-1">
                    <li>Itens publicados por vendedores recebem a tag "Parceiro" automaticamente.</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={saving || !sellerApproved || !parceirosChestId}
                  className="mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-lg text-sm disabled:opacity-60"
                >
                  {saving ? 'Publicando...' : 'Publicar item'}
                </button>
              </form>
            </div>

            <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ListChecks className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Meus Itens</h2>
              </div>
              {myItems.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum item publicado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {myItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-black/30 border border-white/10 rounded-md px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded overflow-hidden border border-white/10 bg-muted/20 flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name || item.hero_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400">Sem imagem</span>
                          )}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {item.name || item.hero_name}
                            <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Parceiro</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Herói: {item.hero_name} • Raridade: {item.rarity} • Estoque: {item.current_stock}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-emerald-300 font-semibold">
                          {formatCurrency(Number(item.price))}
                        </div>
                        {item.approved === false && (
                          <div className="text-[10px] text-yellow-300">Aguardando aprovação</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerAreaPage;