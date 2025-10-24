import React, { Suspense, useMemo, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, Shield, Home, Star, Plus, X, Search } from "lucide-react";
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
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Sorteios Premium
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPremiumItems.map((item) => (
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-black/30 border border-white/10">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Preferências e ajustes do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm">Preferência 1</label>
                    <Input placeholder="Ex.: 100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Preferência 2</label>
                    <Input placeholder="Ex.: 50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
