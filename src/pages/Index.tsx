import React, { useState } from 'react';
import { TabsCustom, TabsCustomList, TabsCustomTrigger, TabsCustomContent } from '@/components/ui/tabs-custom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Truck } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Chest, Item, Order } from '@/types/inventory';
import StockControl from '@/components/StockControl';
import Orders from '@/components/Orders';
import ShippingQueue from '@/components/ShippingQueue';
import DataManagement from '@/components/DataManagement';

const Index = () => {
  const [chests, setChests] = useLocalStorage<Chest[]>('digital-wares-chests', []);
  const [items, setItems] = useLocalStorage<Item[]>('digital-wares-items', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('digital-wares-orders', []);

  const handleCreateChest = (name: string) => {
    const newChest: Chest = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    setChests(prev => [...prev, newChest]);
  };

  const handleAddItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...item,
      id: Date.now().toString()
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleDeleteChest = (chestId: string) => {
    setChests(prev => prev.filter(chest => chest.id !== chestId));
    setItems(prev => prev.filter(item => item.chestId !== chestId));
  };

  const handleCreateOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ));
  };

  const handleImportData = (data: { chests: Chest[]; items: Item[]; orders: Order[] }) => {
    setChests(data.chests);
    setItems(data.items);
    setOrders(data.orders);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
              Digital Wares Manager
            </h1>
            <p className="text-muted-foreground text-lg">
              Sistema completo para gerenciamento de estoque digital e pedidos
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <TabsCustom defaultValue="stock" className="space-y-6">
          <TabsCustomList className="grid w-full grid-cols-3">
            <TabsCustomTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Controle de Estoque
            </TabsCustomTrigger>
            <TabsCustomTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </TabsCustomTrigger>
            <TabsCustomTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Fila de Envios
            </TabsCustomTrigger>
          </TabsCustomList>

          <TabsCustomContent value="stock">
            <StockControl
              chests={chests}
              items={items}
              orders={orders}
              onCreateChest={handleCreateChest}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onDeleteChest={handleDeleteChest}
            />
          </TabsCustomContent>

          <TabsCustomContent value="orders">
            <Orders
              chests={chests}
              items={items}
              orders={orders}
              onCreateOrder={handleCreateOrder}
              onUpdateOrder={handleUpdateOrder}
            />
          </TabsCustomContent>

          <TabsCustomContent value="shipping">
            <ShippingQueue orders={orders} />
          </TabsCustomContent>
        </TabsCustom>

        {/* Data Management */}
        <DataManagement
          chests={chests}
          items={items}
          orders={orders}
          onImportData={handleImportData}
        />
      </div>
    </div>
  );
};

export default Index;
