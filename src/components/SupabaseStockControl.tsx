import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Package, Loader2 } from 'lucide-react';
import { Rarity } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import { supabaseServices, Chest, Item } from '@/integrations/supabase/services';

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

const SupabaseStockControl: React.FC = () => {
  // Estados para os dados
  const [chests, setChests] = useState<Chest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // Estados para carregamento
  const [loading, setLoading] = useState({
    chests: false,
    items: false,
    createChest: false,
    addItem: false,
    deleteChest: false,
    deleteItem: false
  });

  // Estados para formulários
  const [newChestName, setNewChestName] = useState('');
  const [selectedChestForAdd, setSelectedChestForAdd] = useState('');
  const [selectedChestForView, setSelectedChestForView] = useState('');
  const [newItem, setNewItem] = useState({
    hero_name: '',
    rarity: 'common' as Rarity,
    price: 0,
    initial_stock: 0
  });

  // Carregar baús ao iniciar
  useEffect(() => {
    loadChests();
  }, []);

  // Carregar itens quando um baú for selecionado para visualização
  useEffect(() => {
    if (selectedChestForView) {
      loadItemsByChestId(selectedChestForView);
    } else {
      setItems([]);
    }
  }, [selectedChestForView]);

  // Funções para carregar dados
  const loadChests = async () => {
    try {
      setLoading(prev => ({ ...prev, chests: true }));
      const chestsData = await supabaseServices.chests.getAll();
      setChests(chestsData);
      
      // Se não houver baú selecionado e existirem baús, seleciona o primeiro
      if (!selectedChestForView && chestsData.length > 0) {
        setSelectedChestForView(chestsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar baús:', error);
      toast({ title: 'Erro ao carregar baús', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, chests: false }));
    }
  };

  const loadItemsByChestId = async (chestId: string) => {
    try {
      setLoading(prev => ({ ...prev, items: true }));
      const itemsData = await supabaseServices.items.getByChestId(chestId);
      setItems(itemsData);
    } catch (error) {
      console.error(`Erro ao carregar itens do baú ${chestId}:`, error);
      toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, items: false }));
    }
  };

  // Funções para manipular dados
  const handleCreateChest = async () => {
    if (!newChestName.trim()) {
      toast({ title: 'Nome do baú é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, createChest: true }));
      await supabaseServices.chests.create({ name: newChestName.trim() });
      setNewChestName('');
      toast({ title: 'Baú criado com sucesso!' });
      await loadChests();
    } catch (error) {
      console.error('Erro ao criar baú:', error);
      toast({ title: 'Erro ao criar baú', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, createChest: false }));
    }
  };

  const handleAddItem = async () => {
    if (!selectedChestForAdd || !newItem.hero_name.trim() || newItem.price <= 0 || newItem.initial_stock <= 0) {
      toast({ title: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, addItem: true }));
      await supabaseServices.items.create({
        hero_name: newItem.hero_name.trim(),
        rarity: newItem.rarity,
        price: newItem.price,
        initial_stock: newItem.initial_stock,
        chest_id: selectedChestForAdd
      });
      
      setNewItem({ hero_name: '', rarity: 'common', price: 0, initial_stock: 0 });
      toast({ title: 'Item adicionado com sucesso!' });
      
      // Se o baú atual for o mesmo que estamos visualizando, recarregar itens
      if (selectedChestForAdd === selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, addItem: false }));
    }
  };

  const handleDeleteChest = async (chestId: string) => {
    if (!confirm('Tem certeza que deseja excluir este baú? Todos os itens serão removidos.')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, deleteChest: true }));
      await supabaseServices.chests.remove(chestId);
      toast({ title: 'Baú removido com sucesso!' });
      
      // Se o baú removido for o que estamos visualizando, limpar seleção
      if (chestId === selectedChestForView) {
        setSelectedChestForView('');
      }
      
      await loadChests();
    } catch (error) {
      console.error(`Erro ao remover baú ${chestId}:`, error);
      toast({ title: 'Erro ao remover baú', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, deleteChest: false }));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, deleteItem: true }));
      await supabaseServices.items.remove(itemId);
      toast({ title: 'Item removido com sucesso!' });
      
      if (selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error(`Erro ao remover item ${itemId}:`, error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, deleteItem: false }));
    }
  };

  const viewingChest = chests.find(c => c.id === selectedChestForView);

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
              <Button 
                onClick={handleCreateChest} 
                className="bg-gradient-gaming"
                disabled={loading.createChest}
              >
                {loading.createChest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Baú'
                )}
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
                value={newItem.hero_name}
                onChange={(e) => setNewItem({ ...newItem, hero_name: e.target.value })}
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
                value={newItem.initial_stock || ''}
                onChange={(e) => setNewItem({ ...newItem, initial_stock: Number(e.target.value) })}
                placeholder="0"
                className="bg-secondary/50"
                min="0"
              />
            </div>
            
            <div>
              <Label>Raridade</Label>
              <Select 
                value={newItem.rarity} 
                onValueChange={(value: Rarity) => setNewItem({ ...newItem, rarity: value })}
              >
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
          
          <div className="flex justify-end">
            <Button 
              onClick={handleAddItem} 
              className="bg-gradient-gaming"
              disabled={loading.addItem}
            >
              {loading.addItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Chest */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Visualizar Catálogo</CardTitle>
          <CardDescription>Visualize e gerencie os itens em cada baú</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Selecionar Baú</Label>
              <Select value={selectedChestForView} onValueChange={setSelectedChestForView}>
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
            
            {viewingChest && (
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteChest(viewingChest.id)}
                disabled={loading.deleteChest}
              >
                {loading.deleteChest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Baú
                  </>
                )}
              </Button>
            )}
          </div>

          {loading.items ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewingChest ? (
            items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Herói</TableHead>
                    <TableHead>Raridade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.hero_name}</TableCell>
                      <TableCell>
                        <Badge className={getRarityColor(item.rarity as Rarity)}>
                          {item.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.initial_stock}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={loading.deleteItem}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item encontrado neste baú.
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um baú para visualizar seus itens.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseStockControl;