import React, { Suspense, useMemo, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, Shield, Home, Star, Plus, X, Search, Check, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loading } from "@/components/ui/loading";
import ErrorBoundary from "../components/ErrorBoundary";
import SupabaseStockControl from "@/components/SupabaseStockControl";
import Orders from "@/components/Orders";
import ShippingQueue from "@/components/ShippingQueue";
import Customers from "@/components/Customers";
import { useItems } from "@/hooks/useItems";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Item } from "@/types/inventory";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { items } = useItems();
  const [premiumItemIds, setPremiumItemIds] = useLocalStorage<string[]>("premiumRaffleItemIds", []);
  const premiumSelectedItems: Item[] = premiumItemIds
    .map(id => items.find(i => i.id === id))
    .filter((i): i is Item => Boolean(i));

  const [searchPremium, setSearchPremium] = useState("");
  const filteredPremiumItems = useMemo(() => {
    const term = searchPremium.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(term) ||
      i.hero_name.toLowerCase().includes(term)
    );
  }, [items, searchPremium]);

  // Itens separados por preço para o painel de Sorteios Premium
  const premiumExpensiveItems = useMemo(() => {
    return filteredPremiumItems.filter(i => {
      const currentPrice = i.discount && i.discount > 0 
        ? i.price * (1 - i.discount / 100) 
        : i.price;
      return parseFloat(currentPrice.toString()) > 31;
    });
  }, [filteredPremiumItems]);

  const premiumCheapItems = useMemo(() => {
    return filteredPremiumItems.filter(i => {
      const currentPrice = i.discount && i.discount > 0 
        ? i.price * (1 - i.discount / 100) 
        : i.price;
      return parseFloat(currentPrice.toString()) <= 30;
    });
  }, [filteredPremiumItems]);

  // Controla a exibição dos itens mais baratos (<= R$30)
  const [showMoreCheap, setShowMoreCheap] = useState(false);

  const syncPremiumSelection = useCallback(async (ids: string[]) => {
    try {
      await supabase.from('premium_featured').delete().gte('position', 1);
      if (ids.length > 0) {
        const rows = ids.slice(0, 2).map((id, idx) => ({ item_id: id, position: idx + 1 }));
        const { error } = await supabase.from('premium_featured').insert(rows);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao sincronizar seleção premium:', error);
    }
  }, []);

  // Sincronizar seleção atual do localStorage com Supabase ao montar
  React.useEffect(() => {
    if (premiumItemIds && premiumItemIds.length > 0) {
      syncPremiumSelection(premiumItemIds);
    } else {
      // Garantir limpeza no Supabase quando não houver seleção local
      syncPremiumSelection([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPremium = (itemId: string) => {
    setPremiumItemIds(prev => {
      if (prev.includes(itemId)) return prev;
      if (prev.length >= 2) return prev;
      const next = [...prev, itemId];
      syncPremiumSelection(next);
      return next;
    });
  };

  const removePremiumAt = (index: number) => {
    setPremiumItemIds(prev => {
      const next = prev.filter((_, i) => i !== index);
      syncPremiumSelection(next);
      return next;
    });
  };

  const clearPremium = () => {
    setPremiumItemIds([]);
    syncPremiumSelection([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold">Painel de Controle</span>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Admin Logado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Acesso Restrito</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao Site</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventário
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fila de Envios
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Sorteios Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando catálogo do Supabase..." /> }>
                <SupabaseStockControl />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="orders">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando pedidos..." /> }>
                <Orders />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="shipping">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando fila de envios..." /> }>
                <ShippingQueue />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="customers">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando clientes..." /> }>
                <Customers />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* Vendedores */}
          <TabsContent value="sellers">
            <Card className="bg-black/30 border border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    <CardTitle>Vendedores</CardTitle>
                  </div>
                  <CardDescription>Gerencie solicitações e aprovações de vendedores</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <SellersAdminSection />
              </CardContent>
            </Card>

            {/* Itens Pendentes de Aprovação */}
            <Card className="mt-6 bg-black/30 border border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle>Itens pendentes</CardTitle>
                  </div>
                  <CardDescription>Itens cadastrados por vendedores aguardando aprovação</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ItemsPendingAdminSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <Card className="bg-black/30 border border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <CardTitle>Itens Premium em Destaque</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selecione até 2 itens para destacar no sorteio
                  </div>
                </div>
                <CardDescription className="mt-2">
                  Os itens selecionados serão exibidos na página de Sorteio para todos os usuários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Selecionados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Selecionados ({premiumSelectedItems.length}/2)</h3>
                    <Button variant="ghost" onClick={clearPremium} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" /> Limpar seleção
                    </Button>
                  </div>
                  {premiumSelectedItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {premiumSelectedItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
                          <img src={item.image_url || ''} alt={item.name || ''} className="w-20 h-20 object-cover rounded-md border border-white/10" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.hero_name}</div>
                          </div>
                          <Button variant="secondary" size="sm" onClick={() => removePremiumAt(idx)}>
                            <X className="h-4 w-4" /> Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum item selecionado</div>
                  )}
                </div>

                {/* Busca e seleção */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por herói ou nome do item..."
                      value={searchPremium}
                      onChange={(e) => setSearchPremium(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Lista inicial: apenas itens acima de R$31 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {premiumExpensiveItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
                        <img src={item.image_url || ''} alt={item.name || ''} className="w-16 h-16 object-cover rounded-md border border-white/10" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.hero_name}</div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSelectPremium(item.id)}
                          disabled={premiumItemIds.length >= 2 || premiumItemIds.includes(item.id)}
                          className="bg-gradient-gaming"
                        >
                          <Plus className="h-4 w-4" /> Premium
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Botão 'Mais itens' para revelar itens de R$30 ou menos */}
                  {!showMoreCheap && premiumCheapItems.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={() => setShowMoreCheap(true)}>Mais itens</Button>
                    </div>
                  )}

                  {/* Lista extra: itens de R$30 ou menos exibidos após clicar em 'Mais itens' */}
                  {showMoreCheap && premiumCheapItems.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {premiumCheapItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
                          <img src={item.image_url || ''} alt={item.name || ''} className="w-16 h-16 object-cover rounded-md border border-white/10" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.hero_name}</div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSelectPremium(item.id)}
                            disabled={premiumItemIds.length >= 2 || premiumItemIds.includes(item.id)}
                            className="bg-gradient-gaming"
                          >
                            <Plus className="h-4 w-4" /> Premium
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

type Seller = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  steam_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  approved: boolean | null;
  approved_at: string | null;
};

const SellersAdminSection: React.FC = () => {
  const [pending, setPending] = React.useState<Seller[]>([]);
  const [approved, setApproved] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  const fetchSellers = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Seller[];
      setPending(rows.filter(r => r.status === 'pending'));
      setApproved(rows.filter(r => r.status === 'approved'));
    } catch (err: any) {
      console.error('Erro ao carregar vendedores', err);
      setError(err.message || 'Falha ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const approveSeller = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: 'approved', approved: true, approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      fetchSellers();
    } catch (err) {
      console.error('Erro ao aprovar vendedor', err);
    }
  };

  const rejectSeller = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: 'rejected', approved: false })
        .eq('id', id);
      if (error) throw error;
      fetchSellers();
    } catch (err) {
      console.error('Erro ao rejeitar vendedor', err);
    }
  };

  if (loading) {
    return <Loading text="Carregando vendedores..." />;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Aguardando Aprovação</h3>
        {pending.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma solicitação pendente</div>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 border border-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">Email: {s.email}</div>
                  <div className="text-xs text-muted-foreground">CPF: {s.cpf}</div>
                  <div className="text-xs text-muted-foreground">Steam: {s.steam_id}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" onClick={() => approveSeller(s.id)} className="bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button variant="secondary" onClick={() => rejectSeller(s.id)} className="bg-red-600 hover:bg-red-700 text-white">
                    <X className="h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Aprovados</h3>
        {approved.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum vendedor aprovado</div>
        ) : (
          <div className="space-y-3">
            {approved.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 border border-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">Email: {s.email}</div>
                  <div className="text-xs text-muted-foreground">CPF: {s.cpf}</div>
                  <div className="text-xs text-muted-foreground">Steam: {s.steam_id}</div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/seller/${s.id}`} className="text-sm text-cyan-400 hover:text-cyan-300">Abrir página pessoal</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

type PendingItem = Item & {
  seller_id?: string | null;
  is_partner?: boolean;
  approved?: boolean;
  seller?: { name: string | null; email?: string | null } | null;
};

const ItemsPendingAdminSection: React.FC = () => {
  const [items, setItems] = React.useState<PendingItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");

  const fetchPendingItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, seller:sellers(name, email)')
        .eq('is_partner', true)
        .eq('approved', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []) as PendingItem[]);
    } catch (err: any) {
      console.error('Erro ao carregar itens pendentes', err);
      setError(err.message || 'Falha ao carregar itens pendentes');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPendingItems();
  }, [fetchPendingItems]);

  const approveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ approved: true })
        .eq('id', id);
      if (error) throw error;
      fetchPendingItems();
    } catch (err) {
      console.error('Erro ao aprovar item', err);
    }
  };

  const rejectItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ approved: false })
        .eq('id', id);
      if (error) throw error;
      fetchPendingItems();
    } catch (err) {
      console.error('Erro ao reprovar item', err);
    }
  };

  if (loading) {
    return <Loading text="Carregando itens pendentes..." />;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhum item pendente</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
            <img
              src={item.image_url || ''}
              alt={item.name || item.hero_name}
              className="w-16 h-16 object-cover rounded-md border border-white/10"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{item.name || item.hero_name}</div>
              <div className="text-xs text-muted-foreground">
                Herói: {item.hero_name} • Raridade: {item.rarity} • Estoque: {item.current_stock}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Vendedor: {item.seller?.name || item.seller?.email || '—'}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={() => approveItem(item.id)} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4" /> Aprovar
              </Button>
              <Button variant="secondary" onClick={() => rejectItem(item.id)} className="bg-red-600 hover:bg-red-700 text-white">
                <X className="h-4 w-4" /> Reprovar
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
