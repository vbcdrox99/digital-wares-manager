import React from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Store, PlusCircle, ListChecks, ShieldCheck, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { itemsService, type InsertItem, type Item } from '@/integrations/supabase/services/items';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useRarities } from '@/hooks/useRarities';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeroCombobox } from "@/components/HeroCombobox";


interface SaleItem {
  id: string;
  price: number;
  quantity: number;
  created_at?: string; // order_items might not have created_at, but we'll try to use order's
  item: Item;
  order: {
    id: string;
    customer_name: string;
    steam_id: string;
    status: 'pending' | 'sent' | 'cancelled';
    created_at: string;
    shipping_queue?: {
      deadline: string;
    }[];
  };
}

const SellerAreaPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rarities: availableRarities, loading: loadingRarities } = useRarities();

  const [sellerId, setSellerId] = React.useState<string | null>(null);
  const [sellerApproved, setSellerApproved] = React.useState<boolean>(false);
  const [parceirosChestId, setParceirosChestId] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [myItems, setMyItems] = React.useState<Item[]>([]);
  const [mySales, setMySales] = React.useState<SaleItem[]>([]);

  // Form state
  const [name, setName] = React.useState('');
  const [heroName, setHeroName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [price, setPrice] = React.useState<string>('');
  const [initialStock, setInitialStock] = React.useState<string>('');
  const [rarity, setRarity] = React.useState<string>('');

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

  const loadMySales = React.useCallback(async () => {
    if (!sellerId) return;
    try {
      // First get items belonging to seller
      const { data: sellerItems } = await supabase
        .from('items')
        .select('id')
        .eq('seller_id', sellerId);
      
      if (!sellerItems || sellerItems.length === 0) return;

      const itemIds = sellerItems.map(i => i.id);

      // Then get order items for these items
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          item:items(*),
          order:orders(*, shipping_queue(deadline))
        `)
        .in('item_id', itemIds)
        .order('id', { ascending: false }); // order_items doesn't have created_at usually, so sort by ID or fetch orders sorting

      if (error) throw error;

      // Filter out any where order is null (orphaned items) and sort by order created_at
      const validSales = (data || [])
        .filter((s: any) => s.order)
        .sort((a: any, b: any) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()) as SaleItem[];

      setMySales(validSales);
    } catch (e) {
      console.error('Erro ao carregar vendas:', e);
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
    loadMySales();
  }, [loadMyItems, loadMySales]);

  React.useEffect(() => {
    if (availableRarities.length > 0 && !rarity) {
      setRarity(availableRarities[0].name.toLowerCase());
    }
  }, [availableRarities, rarity]);

  const validateForm = (): string | null => {
    if (!sellerApproved) return 'Seu cadastro de vendedor não está aprovado.';
    if (!parceirosChestId) return 'Baú Parceiros indisponível.';
    if (!name.trim()) return 'Informe o nome do item.';
    if (!heroName.trim()) return 'Informe o nome do herói.';
    if (!imageUrl.trim()) return 'Informe a URL da imagem.';
    if (!rarity) return 'Selecione uma raridade.';
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

          <Tabs defaultValue="status" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/60 border border-white/10">
              <TabsTrigger value="status" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Status
              </TabsTrigger>
              <TabsTrigger value="publish" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <PlusCircle className="w-4 h-4 mr-2" />
                Publicar
              </TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <ListChecks className="w-4 h-4 mr-2" />
                Meus Itens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-semibold text-white">Status da Conta</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Situação Cadastral</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sellerApproved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                      {loadingStatus ? 'Verificando...' : sellerApproved ? 'Aprovado' : 'Em Análise'}
                    </div>
                  </div>
                  {sellerId && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ID do Vendedor</p>
                      <code className="bg-black/40 px-2 py-1 rounded text-xs text-gray-300">{sellerId}</code>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-gray-400 text-sm">
                      {sellerApproved 
                        ? 'Sua conta está aprovada para vender itens no catálogo.' 
                        : 'Aguarde a aprovação de um administrador para começar a vender.'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publish">
              <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <PlusCircle className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-semibold text-white">Publicar Novo Item</h2>
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
                    <HeroCombobox
                      value={heroName}
                      onChange={setHeroName}
                      className="w-full bg-black/40 border-white/10 text-white hover:bg-black/50 hover:text-white"
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
                        onChange={e => setRarity(e.target.value)}
                        disabled={loadingRarities}
                      >
                        {loadingRarities ? (
                          <option>Carregando...</option>
                        ) : (
                          availableRarities.map(r => (
                            <option key={r.id} value={r.name.toLowerCase()} className="bg-black">
                              {r.name}
                            </option>
                          ))
                        )}
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
                    className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-lg text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
                  >
                    {saving ? 'Publicando...' : 'Publicar item'}
                  </button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="items">
              <div className="space-y-8">
                <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ListChecks className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Meus Itens Cadastrados</h2>
                  </div>
                  {myItems.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhum item publicado ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {item.discount && item.discount > 0 ? (
                              <>
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(Number(item.price))}
                                </div>
                                <div className="text-sm text-emerald-300 font-semibold">
                                  {formatCurrency(Number(item.price) * (1 - item.discount / 100))}
                                </div>
                                <div className="text-[10px] text-red-400">-{item.discount}%</div>
                              </>
                            ) : (
                              <div className="text-sm text-emerald-300 font-semibold">
                                {formatCurrency(Number(item.price))}
                              </div>
                            )}
                            {item.approved === false && (
                              <div className="text-[10px] text-yellow-300">Aguardando aprovação</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-900/60 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Minhas Vendas</h2>
                  </div>
                  {mySales.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma venda realizada ainda.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-black/20">
                          <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Comprador</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {mySales.map(sale => (
                            <tr key={sale.id} className="hover:bg-white/5">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={sale.item.image_url || ''} 
                                    alt={sale.item.name || sale.item.hero_name} 
                                    className="w-8 h-8 rounded object-cover border border-white/10"
                                  />
                                  <div>
                                    <div className="text-white font-medium">{sale.item.name || sale.item.hero_name}</div>
                                    <div className="text-xs text-gray-500">{sale.item.hero_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-300">
                                <div>{sale.order.customer_name}</div>
                                <div className="text-xs text-gray-500">{sale.order.steam_id}</div>
                              </td>
                              <td className="px-4 py-3 text-emerald-400 font-medium">
                                {formatCurrency(sale.price * sale.quantity)}
                              </td>
                              <td className="px-4 py-3 text-gray-400">
                                {new Date(sale.order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider w-fit ${
                                    sale.order.status === 'sent' 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : sale.order.status === 'cancelled'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                    {sale.order.status === 'sent' ? 'Enviado' : sale.order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                  </span>
                                  
                                  {sale.order.status === 'pending' && sale.order.shipping_queue && sale.order.shipping_queue.length > 0 && (
                                    (() => {
                                      const deliveryDate = new Date(sale.order.shipping_queue![0].deadline);
                                      const today = new Date();
                                      const timeDiff = deliveryDate.getTime() - today.getTime();
                                      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                      const isOverdue = daysLeft < 0;
                                      
                                      return (
                                        <span className={`text-xs font-medium ${
                                          isOverdue ? 'text-red-400' : daysLeft <= 7 ? 'text-orange-400' : 'text-blue-400'
                                        }`}>
                                          {isOverdue ? `${Math.abs(daysLeft)} dias de atraso` : `${daysLeft} dias restantes`}
                                        </span>
                                      );
                                    })()
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerAreaPage;