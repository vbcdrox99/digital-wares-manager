import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Truck } from 'lucide-react';
import SupabaseStockControl from '@/components/SupabaseStockControl';

const SupabaseInventory: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Digital Wares Manager</h1>
        <p className="text-muted-foreground">
          Gerencie seu inventário digital com Supabase
        </p>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Controle de Estoque
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2" disabled>
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2" disabled>
            <Truck className="h-4 w-4" />
            Fila de Envios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6">
          <SupabaseStockControl />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Esta funcionalidade será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Envios</CardTitle>
              <CardDescription>Em desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Esta funcionalidade será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseInventory;