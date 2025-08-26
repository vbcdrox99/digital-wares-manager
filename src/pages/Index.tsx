import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Truck, Users } from 'lucide-react';
import SupabaseStockControl from '@/components/SupabaseStockControl';
import Orders from '@/components/Orders';
import Customers from '@/components/Customers';
import ShippingQueue from '@/components/ShippingQueue';

const Index: React.FC = () => {

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
              Controle de Vendas: Dota Play Brasil
            </h1>
            <p className="text-muted-foreground text-lg">
              Sistema completo para gerenciamento de estoque digital e pedidos
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Controle de Estoque
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Fila
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <SupabaseStockControl />
          </TabsContent>

          <TabsContent value="orders">
            <Orders />
          </TabsContent>

          <TabsContent value="queue">
            <ShippingQueue orders={[]} />
          </TabsContent>

          <TabsContent value="customers">
            <Customers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
