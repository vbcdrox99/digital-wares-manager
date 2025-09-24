import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loading } from "@/components/ui/loading";
import ErrorBoundary from "../components/ErrorBoundary";
import SupabaseStockControl from "@/components/SupabaseStockControl";
import Orders from "@/components/Orders";
import ShippingQueue from "@/components/ShippingQueue";
import Customers from "@/components/Customers";

const Index = () => {
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
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
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
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
