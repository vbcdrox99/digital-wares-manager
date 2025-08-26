import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Package, Loader2, Users } from 'lucide-react';
import { Rarity } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import { supabaseServices, Chest, Item, Customer } from '@/integrations/supabase/services';

const rarities: Rarity[] = ['comum', 'persona', 'arcana', 'immortal'];

const getRarityColor = (rarity: Rarity) => {
  const colors = {
    comum: 'bg-common/20 text-common border-common/30',
    persona: 'bg-uncommon/20 text-uncommon border-uncommon/30',
    arcana: 'bg-rare/20 text-rare border-rare/30',
    immortal: 'bg-immortal/20 text-immortal border-immortal/30'
  };
  return colors[rarity];
};

const SupabaseStockControl: React.FC = () => {
  // Estados para os dados
  const [chests, setChests] = useState<Chest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Estados para carregamento
  const [loading, setLoading] = useState({
    chests: false,
    items: false,
    customers: false,
    createChest: false,
    addItem: false,
    deleteChest: false,
    deleteItem: false,
    createCustomer: false
  });

  // Estados para formulários
  const [newChestName, setNewChestName] = useState('');
  const [selectedChestForAdd, setSelectedChestForAdd] = useState('');
  const [selectedChestForView, setSelectedChestForView] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    hero_name: '',
    rarity: 'comum' as Rarity,
    price: 0,
    initial_stock: 0,
    image_url: ''
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    steam_id: ''
  });
  
  // Estados para controle de preços e descontos
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});

  // Carregar baús e clientes ao iniciar
  useEffect(() => {
    loadChests();
    loadCustomers();
  }, []);

  // Carregar itens quando um baú for selecionado para visualização
  useEffect(() => {
    if (selectedChestForView) {
      loadItemsByChestId(selectedChestForView);
    } else {
      setItems([]);
    }
  }, [selectedChestForView]);

  // Inicializar preços quando itens forem carregados
  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    const initialDiscounts: Record<string, number> = {};
    items.forEach(item => {
      initialPrices[item.id] = item.price;
      initialDiscounts[item.id] = 0;
    });
    setItemPrices(initialPrices);
    setItemDiscounts(initialDiscounts);
  }, [items]);

  // Funções para carregar dados
  const loadChests = async () => {
    try {
      setLoading(prev => ({ ...prev, chests: true }));
      console.log('🔍 Carregando baús...');
      
      const chestsData = await supabaseServices.chests.getAll();
      
      console.log('📦 Baús carregados:', chestsData);
      
      setChests(chestsData);
      
      // Se não houver baú selecionado e existirem baús, seleciona o primeiro
      if (!selectedChestForView && chestsData.length > 0) {
        setSelectedChestForView(chestsData[0].id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar baús:', error);
      toast({ title: 'Erro ao carregar baús', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, chests: false }));
    }
  };

  const loadItemsByChestId = async (chestId: string) => {
    try {
      setLoading(prev => ({ ...prev, items: true }));
      console.log('🔍 Carregando itens do baú:', chestId);
      
      const itemsData = await supabaseServices.items.getByChestId(chestId);
      
      console.log('🎮 Itens carregados:', itemsData);
      
      setItems(itemsData);
    } catch (error) {
      console.error(`❌ Erro ao carregar itens do baú ${chestId}:`, error);
      toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, items: false }));
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      console.log('🔍 Carregando clientes...');
      
      const customersData = await supabaseServices.customers.getAll();
      
      console.log('👥 Clientes carregados:', customersData);
      
      setCustomers(customersData);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
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
      
      console.log('🔍 Iniciando criação de baú:', { name: newChestName.trim() });
      
      const newChest = await supabaseServices.chests.create({ name: newChestName.trim() });
      
      console.log('✅ Baú criado com sucesso:', newChest);
      
      // Atualizar a lista de baús diretamente no estado
      setChests(prev => [newChest, ...prev]);
      
      setNewChestName('');
      toast({ title: 'Baú criado com sucesso!' });
      
      // Recarregar a lista para garantir sincronização
      await loadChests();
    } catch (error) {
      console.error('❌ Erro ao criar baú:', error);
      toast({ title: 'Erro ao criar baú', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, createChest: false }));
    }
  };

  const handleAddItem = async () => {
    if (!selectedChestForAdd || !newItem.name.trim() || !newItem.hero_name.trim() || newItem.price <= 0 || newItem.initial_stock <= 0) {
      toast({ title: 'Preencha todos os campos obrigatórios corretamente', variant: 'destructive' });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, addItem: true }));
      
      const itemData = {
        name: newItem.name.trim(),
        hero_name: newItem.hero_name.trim(),
        rarity: newItem.rarity,
        price: newItem.price,
        initial_stock: newItem.initial_stock,
        chest_id: selectedChestForAdd,
        image_url: newItem.image_url.trim() || null
      };
      
      console.log('🔍 Iniciando criação de item:', itemData);
      
      const createdItem = await supabaseServices.items.create(itemData);
      
      console.log('✅ Item criado com sucesso:', createdItem);
      
      setNewItem({ name: '', hero_name: '', rarity: 'comum', price: 0, initial_stock: 0, image_url: '' });
      toast({ title: 'Item adicionado com sucesso!' });
      
      // Se o baú atual for o mesmo que estamos visualizando, recarregar itens
      if (selectedChestForAdd === selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
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

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.steam_id.trim()) {
      toast({ title: 'Nome e Steam ID são obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, createCustomer: true }));
      console.log('🔄 Criando cliente:', newCustomer);
      
      await supabaseServices.customers.create({
        name: newCustomer.name.trim(),
        steam_id: newCustomer.steam_id.trim()
      });
      
      toast({ title: 'Cliente criado com sucesso!' });
      
      // Limpar formulário
      setNewCustomer({ name: '', steam_id: '' });
      
      // Recarregar lista de clientes
      await loadCustomers();
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      if (error.message?.includes('duplicate key')) {
        toast({ title: 'Steam ID já cadastrado', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao criar cliente', variant: 'destructive' });
      }
    } finally {
      setLoading(prev => ({ ...prev, createCustomer: false }));
    }
  };

  // Funções para controle de preços e descontos
  const handlePriceChange = (itemId: string, change: number) => {
    setItemPrices(prev => {
      const currentPrice = prev[itemId] || 0;
      const newPrice = Math.max(0, currentPrice + change);
      return { ...prev, [itemId]: newPrice };
    });
  };

  const handleDiscountChange = (itemId: string, discount: number) => {
    setItemDiscounts(prev => ({ ...prev, [itemId]: discount }));
  };

  const getDiscountedPrice = (itemId: string, originalPrice: number) => {
    const currentPrice = itemPrices[itemId] || originalPrice;
    const discount = itemDiscounts[itemId] || 0;
    return currentPrice * (1 - discount / 100);
  };

  const discountOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

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

      {/* Create Customer */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Cadastrar Cliente
          </CardTitle>
          <CardDescription>Cadastre um novo cliente com nome e Steam ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">Nome do Cliente</Label>
              <Input
                id="customer-name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="bg-secondary/50"
              />
            </div>
            <div>
              <Label htmlFor="customer-steam-id">Steam ID</Label>
              <Input
                id="customer-steam-id"
                value={newCustomer.steam_id}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, steam_id: e.target.value }))}
                placeholder="Ex: 76561198123456789"
                className="bg-secondary/50"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateCustomer} 
              className="bg-gradient-gaming"
              disabled={loading.createCustomer}
            >
              {loading.createCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Cliente'
              )}
            </Button>
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
              <Label>Nome do Item</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex: Dragonclaw Hook"
                className="bg-secondary/50"
              />
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
              <Label>URL da Imagem (opcional)</Label>
              <Input
                value={newItem.image_url}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
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
                    <TableHead>Nome do Item</TableHead>
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
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.hero_name}</TableCell>
                      <TableCell>
                        <Badge className={getRarityColor(item.rarity as Rarity)}>
                          {item.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePriceChange(item.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[80px] text-center font-medium">
                              R$ {(itemPrices[item.id] || item.price).toFixed(2)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePriceChange(item.id, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Desconto:</Label>
                            <Select
                              value={(itemDiscounts[item.id] || 0).toString()}
                              onValueChange={(value) => handleDiscountChange(item.id, parseInt(value))}
                            >
                              <SelectTrigger className="h-8 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {discountOptions.map(discount => (
                                  <SelectItem key={discount} value={discount.toString()}>
                                    {discount}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {(itemDiscounts[item.id] || 0) > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              Final: R$ {getDiscountedPrice(item.id, item.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
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