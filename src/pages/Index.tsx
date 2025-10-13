import React, { Suspense, useMemo, useState } from 'react';
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

  const handleSelectPremium = (itemId: string) => {
    setPremiumItemIds(prev => {
      if (prev.includes(itemId)) return prev;
      if (prev.length >= 2) return prev;
      return [...prev, itemId];
    });
  };

  const removePremiumAt = (index: number) => {
    setPremiumItemIds(prev => prev.filter((_, i) => i !== index));
  };

  const clearPremium = () => setPremiumItemIds([]);

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Admin Logado</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Ver Site
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Controle</h2>
          <p className="text-muted-foreground">
            Gerencie seu estoque, pedidos, clientes e todas as operações da plataforma.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                +5% em relação a ontem
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">456</div>
              <p className="text-xs text-muted-foreground">
                +8% em relação à semana passada
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.2k</div>
              <p className="text-xs text-muted-foreground">
                +15% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="stock" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Package className="h-4 w-4" />
              Controle de Estoque
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-background">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2 data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4" />
              Fila de Envio
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Star className="h-4 w-4" />
              Sorteio Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando controle de estoque..." />}>
                <SupabaseStockControl />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando pedidos..." />}>
                <Orders />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando fila de envio..." />}>
                <ShippingQueue />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <ErrorBoundary>
              <Suspense fallback={<Loading text="Carregando clientes..." />}>
                <Customers />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* Comando: Sorteio Premium (Admin) */}
          <TabsContent value="premium" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Comando: Sorteio Premium
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearPremium}>
                      Limpar seleção
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Selecione até dois itens de qualquer baú para o sorteio premium.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slots selecionados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slot 1 */}
                  <div className="relative rounded-lg border border-white/20 bg-white/5 p-4 min-h-32 flex items-center justify-center">
                    {premiumSelectedItems[0] ? (
                      <div className="w-full flex items-center gap-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                          {premiumSelectedItems[0].image_url ? (
                            <img src={premiumSelectedItems[0].image_url || ''} alt={premiumSelectedItems[0].name || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold line-clamp-1">{premiumSelectedItems[0].name}</div>
                          <div className="text-xs text-muted-foreground">{premiumSelectedItems[0].hero_name} • {premiumSelectedItems[0].rarity}</div>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => removePremiumAt(0)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                        <span>Selecione o primeiro item premium</span>
                      </div>
                    )}
                  </div>

                  {/* Slot 2 */}
                  <div className="relative rounded-lg border border-white/20 bg-white/5 p-4 min-h-32 flex items-center justify-center">
                    {premiumSelectedItems[1] ? (
                      <div className="w-full flex items-center gap-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                          {premiumSelectedItems[1].image_url ? (
                            <img src={premiumSelectedItems[1].image_url || ''} alt={premiumSelectedItems[1].name || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold line-clamp-1">{premiumSelectedItems[1].name}</div>
                          <div className="text-xs text-muted-foreground">{premiumSelectedItems[1].hero_name} • {premiumSelectedItems[1].rarity}</div>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => removePremiumAt(1)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                        <span>{premiumSelectedItems.length > 0 ? 'Selecione o segundo item premium' : 'Segundo item aparecerá após o primeiro'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Busca e lista de itens */}
                <div className="space-y-3">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou herói..."
                      value={searchPremium}
                      onChange={(e) => setSearchPremium(e.target.value)}
                      className="pl-10 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duração-300 focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPremiumItems.map(item => (
                      <div key={item.id} className="rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                            {item.image_url ? (
                              <img src={item.image_url || ''} alt={item.name || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold line-clamp-1">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.hero_name} • {item.rarity}</div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectPremium(item.id)}
                            disabled={premiumItemIds.includes(item.id) || premiumItemIds.length >= 2}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Premium
                          </Button>
                        </div>
                      </div>
                    ))}
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
