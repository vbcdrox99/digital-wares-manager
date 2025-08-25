import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { Chest, Item, Rarity, Order } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

interface StockControlProps {
  chests: Chest[];
  items: Item[];
  orders: Order[];
  onCreateChest: (name: string) => void;
  onAddItem: (item: Omit<Item, 'id'>) => void;
  onUpdateItem: (itemId: string, updates: Partial<Item>) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteChest: (chestId: string) => void;
}

const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'legendary', 'immortal', 'mythic'];

const getRarityColor = (rarity: Rarity) => {
  const colors = {
    common: 'bg-common/20 text-common border-common/30',
    uncommon: 'bg-uncommon/20 text-uncommon border-uncommon/30',
    rare: 'bg-rare/20 text-rare border-rare/30',
    legendary: 'bg-legendary/20 text-legendary border-legendary/30',
    immortal: 'bg-immortal/20 text-immortal border-immortal/30',
    mythic: 'bg-mythic/20 text-mythic border-mythic/30 shadow-glow-mythic'
  };
  return colors[rarity];
};

const StockControl: React.FC<StockControlProps> = ({
  chests,
  items,
  orders,
  onCreateChest,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteChest
}) => {
  const [newChestName, setNewChestName] = useState('');
  const [selectedChestForAdd, setSelectedChestForAdd] = useState('');
  const [selectedChestForView, setSelectedChestForView] = useState('');
  const [newItem, setNewItem] = useState({
    heroName: '',
    rarity: 'common' as Rarity,
    price: 0,
    initialStock: 0
  });

  const handleCreateChest = () => {
    if (!newChestName.trim()) {
      toast({ title: 'Nome do baú é obrigatório', variant: 'destructive' });
      return;
    }
    onCreateChest(newChestName.trim());
    setNewChestName('');
    toast({ title: 'Baú criado com sucesso!' });
  };

  const handleAddItem = () => {
    if (!selectedChestForAdd || !newItem.heroName.trim() || newItem.price <= 0 || newItem.initialStock <= 0) {
      toast({ title: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }
    
    onAddItem({
      ...newItem,
      chestId: selectedChestForAdd,
      heroName: newItem.heroName.trim()
    });
    
    setNewItem({ heroName: '', rarity: 'common', price: 0, initialStock: 0 });
    toast({ title: 'Item adicionado com sucesso!' });
  };

  const calculateAvailableStock = (item: Item) => {
    const usedInOrders = orders
      .filter(order => order.status === 'pending')
      .reduce((total, order) => {
        const orderItem = order.items.find(oi => oi.itemId === item.id);
        return total + (orderItem ? orderItem.quantity : 0);
      }, 0);
    
    return Math.max(0, item.initialStock - usedInOrders);
  };

  const viewingChest = chests.find(c => c.id === selectedChestForView);
  const chestItems = items.filter(item => item.chestId === selectedChestForView);

  return (
    <div className="space-y-6">
      {/* Create Chest */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Criar Baú
          </CardTitle>
          <CardDescription>Crie uma nova categoria de itens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="chest-name">Nome do Baú</Label>
              <Input
                id="chest-name"
                value={newChestName}
                onChange={(e) => setNewChestName(e.target.value)}
                placeholder="Ex: Skins de Herói"
                className="bg-secondary/50"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateChest} className="bg-gradient-gaming">
                Criar Baú
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Adicionar Item ao Baú</CardTitle>
          <CardDescription>Adicione um novo item a um baú existente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Baú</Label>
              <Select value={selectedChestForAdd} onValueChange={setSelectedChestForAdd}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecionar baú" />
                </SelectTrigger>
                <SelectContent>
                  {chests.map((chest) => (
                    <SelectItem key={chest.id} value={chest.id}>
                      {chest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nome do Herói</Label>
              <Input
                value={newItem.heroName}
                onChange={(e) => setNewItem({ ...newItem, heroName: e.target.value })}
                placeholder="Ex: Pudge"
                className="bg-secondary/50"
              />
            </div>
            
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                placeholder="0.00"
                className="bg-secondary/50"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label>Estoque Inicial</Label>
              <Input
                type="number"
                value={newItem.initialStock || ''}
                onChange={(e) => setNewItem({ ...newItem, initialStock: Number(e.target.value) })}
                placeholder="0"
                className="bg-secondary/50"
                min="0"
              />
            </div>
            
            <div>
              <Label>Raridade</Label>
              <Select value={newItem.rarity} onValueChange={(value: Rarity) => setNewItem({ ...newItem, rarity: value })}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rarities.map((rarity) => (
                    <SelectItem key={rarity} value={rarity}>
                      <Badge className={getRarityColor(rarity)}>
                        {rarity}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleAddItem} className="bg-gradient-gaming">
            Adicionar Item
          </Button>
        </CardContent>
      </Card>

      {/* View Catalog */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Visualizar Catálogo</CardTitle>
          <CardDescription>Selecione um baú para visualizar e gerenciar seus itens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Selecionar Baú</Label>
              <Select value={selectedChestForView} onValueChange={setSelectedChestForView}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Escolha um baú" />
                </SelectTrigger>
                <SelectContent>
                  {chests.map((chest) => (
                    <SelectItem key={chest.id} value={chest.id}>
                      {chest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {viewingChest && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDeleteChest(viewingChest.id);
                  setSelectedChestForView('');
                  toast({ title: 'Baú excluído com sucesso!' });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Baú
              </Button>
            )}
          </div>

          {viewingChest && (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead>Herói</TableHead>
                    <TableHead>Raridade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chestItems.map((item) => {
                    const availableStock = calculateAvailableStock(item);
                    return (
                      <TableRow key={item.id} className="hover:bg-secondary/20">
                        <TableCell className="font-medium">{item.heroName}</TableCell>
                        <TableCell>
                          <Select
                            value={item.rarity}
                            onValueChange={(value: Rarity) => onUpdateItem(item.id, { rarity: value })}
                          >
                            <SelectTrigger className="w-32 bg-secondary/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rarities.map((rarity) => (
                                <SelectItem key={rarity} value={rarity}>
                                  <Badge className={getRarityColor(rarity)}>
                                    {rarity}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateItem(item.id, { price: Math.max(0, item.price - 0.5) })}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-16 text-center text-sm">R$ {item.price.toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateItem(item.id, { price: item.price + 0.5 })}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateItem(item.id, { initialStock: Math.max(0, item.initialStock - 1) })}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className={`w-16 text-center text-sm ${availableStock === 0 ? 'text-destructive' : ''}`}>
                              {availableStock}/{item.initialStock}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateItem(item.id, { initialStock: item.initialStock + 1 })}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onDeleteItem(item.id);
                              toast({ title: 'Item excluído com sucesso!' });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {chestItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Nenhum item encontrado neste baú
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockControl;