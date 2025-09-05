import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, X, Check, Ban, Calendar, Clock } from 'lucide-react';
import { Chest, Item, CartItem, Rarity } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { createOrder, getOrdersWithItems, updateOrderStatus, deleteOrder, calculateTimeRemaining } from '@/integrations/supabase/services/orderService';
import { chestsService } from '@/integrations/supabase/services/chests';
import { itemsService } from '@/integrations/supabase/services/items';
import { customersService, Customer } from '@/integrations/supabase/services/customers';

interface OrdersProps {}

interface OrderWithItems {
  id: string;
  customer_name: string;
  steam_id: string;
  order_type: 'sale' | 'giveaway';
  status: 'pending' | 'sent' | 'cancelled';
  total_value: number;
  created_at: string;
  sent_at?: string;
  deadline?: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    items: {
      id: string;
      hero_name: string;
      rarity: string;
      price: number;
      chest_id: string;
      chests: {
        name: string;
      };
    };
  }[];
}

interface TimeOption {
  label: string;
  days: number;
}

type OrderStatus = 'pending' | 'sent' | 'cancelled';

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

const getStatusColor = (status: OrderStatus) => {
  const colors = {
    pending: 'bg-pending/20 text-pending border-pending/30',
    sent: 'bg-success/20 text-success border-success/30',
    cancelled: 'bg-destructive/20 text-destructive border-destructive/30'
  };
  return colors[status];
};

const Orders: React.FC<OrdersProps> = () => {
  const [customerName, setCustomerName] = useState('');
  const [steamId, setSteamId] = useState('');
  const [orderType, setOrderType] = useState<'sale' | 'giveaway'>('sale');
  const [selectedChest, setSelectedChest] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedTime, setSelectedTime] = useState<number>(5);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingItem, setPendingItem] = useState<CartItem | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [chests, setChests] = useState<Chest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para autocomplete de clientes
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showSteamSuggestions, setShowSteamSuggestions] = useState(false);
  
  const timeOptions: TimeOption[] = [
    { label: '5 dias', days: 5 },
    { label: '10 dias', days: 10 },
    { label: '15 dias', days: 15 },
    { label: '31 dias', days: 31 }
  ];

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadOrders, 60000); // Atualiza a cada minuto para o cronômetro
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chestsData, itemsData, ordersData, customersData] = await Promise.all([
        chestsService.getAll(),
        itemsService.getAll(),
        getOrdersWithItems(),
        customersService.getAll()
      ]);
      setChests(chestsData);
      setItems(itemsData);
      setOrders(ordersData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await getOrdersWithItems();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  // Funções de autocomplete para clientes
  const searchCustomers = (searchTerm: string, searchBy: 'name' | 'steam_id') => {
    if (!searchTerm.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    const filtered = customers.filter(customer => {
      if (searchBy === 'name') {
        return customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return customer.steam_id.includes(searchTerm);
      }
    });

    setCustomerSuggestions(filtered.slice(0, 5)); // Limita a 5 sugestões
  };

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    setSelectedCustomer(null);
    searchCustomers(value, 'name');
    setShowCustomerSuggestions(true);
    setShowSteamSuggestions(false);
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    setSelectedCustomer(null);
    searchCustomers(value, 'steam_id');
    setShowSteamSuggestions(true);
    setShowCustomerSuggestions(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setSteamId(customer.steam_id);
    setShowCustomerSuggestions(false);
    setShowSteamSuggestions(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setSteamId('');
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
    setShowSteamSuggestions(false);
  };

  const createNewCustomer = async (name: string, steamId: string): Promise<Customer | null> => {
    try {
      const newCustomer = await customersService.create({ name, steam_id: steamId });
      // Recarregar lista de clientes
      const updatedCustomers = await customersService.getAll();
      setCustomers(updatedCustomers);
      return newCustomer;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      if (error instanceof Error && error.message.includes('duplicate')) {
        toast({ title: 'Steam ID já cadastrado', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao criar cliente', variant: 'destructive' });
      }
      return null;
    }
  };

  const getOrCreateCustomer = async (): Promise<Customer | null> => {
    if (selectedCustomer) {
      return selectedCustomer;
    }

    if (!customerName.trim() || !steamId.trim()) {
      toast({ title: 'Nome e Steam ID são obrigatórios', variant: 'destructive' });
      return null;
    }

    // Verificar se já existe um cliente com esse Steam ID
    const existingCustomer = customers.find(c => c.steam_id === steamId);
    if (existingCustomer) {
      return existingCustomer;
    }

    // Criar novo cliente
    return await createNewCustomer(customerName.trim(), steamId.trim());
  };

  const calculateAvailableStock = (item: Item) => {
    // Usar current_stock se disponível, senão usar initial_stock
    const currentStock = item.current_stock ?? item.initial_stock ?? 0;
    
    const usedInOrders = orders
      .filter(order => order.status === 'pending')
      .reduce((total, order) => {
        const orderItem = order.order_items?.find(oi => oi.items.id === item.id);
        return total + (orderItem ? orderItem.quantity : 0);
      }, 0);
    
    const usedInCart = cart
      .filter(cartItem => cartItem.itemId === item.id)
      .reduce((total, cartItem) => total + cartItem.quantity, 0);
    
    return Math.max(0, currentStock - usedInOrders - usedInCart);
  };

  const availableItems = items.filter(item => 
    item.chest_id === selectedChest && calculateAvailableStock(item) > 0
  );

  const selectedItemData = items.find(item => item.id === selectedItem);
  const maxQuantity = selectedItemData ? calculateAvailableStock(selectedItemData) : 0;

  const addToCart = () => {
    if (!selectedItem || !selectedItemData || quantity <= 0 || quantity > maxQuantity) {
      toast({ title: 'Selecione um item válido e quantidade', variant: 'destructive' });
      return;
    }

    // Verificar estoque disponível
    const currentStock = selectedItemData.current_stock ?? selectedItemData.initial_stock ?? 0;
    if (quantity > currentStock) {
      toast({ 
        title: 'Estoque insuficiente', 
        description: `Apenas ${currentStock} unidades disponíveis em estoque.`,
        variant: 'destructive' 
      });
      return;
    }

    const chest = chests.find(c => c.id === selectedItemData.chest_id);
    const cartItem: CartItem = {
      itemId: selectedItem,
      quantity,
      name: selectedItemData.name,
      heroName: selectedItemData.hero_name,
      rarity: selectedItemData.rarity,
      price: selectedItemData.price,
      chestName: chest?.name || ''
    };

    setPendingItem(cartItem);
    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    if (!pendingItem) return;
    
    try {
      setLoading(true);
      
      // Obter ou criar cliente
      const customer = await getOrCreateCustomer();
      if (!customer) {
        return; // Erro já foi mostrado na função getOrCreateCustomer
      }
      
      await createOrder({
        customer_id: customer.id,
        customer_name: customer.name,
        steam_id: customer.steam_id,
        order_type: orderType,
        items: [{
          item_id: pendingItem.itemId,
          quantity: pendingItem.quantity,
          price: pendingItem.price
        }],
        delivery_days: selectedTime
      });
      
      // Atualizar estoque do item
      const selectedItemData = items.find(item => item.id === pendingItem.itemId);
      if (selectedItemData) {
        const currentStock = selectedItemData.current_stock ?? selectedItemData.initial_stock ?? 0;
        const newStock = currentStock - pendingItem.quantity;
        
        await itemsService.update(pendingItem.itemId, { current_stock: newStock });
        
        // Atualizar estado local dos itens
        setItems(prev => prev.map(item => 
          item.id === pendingItem.itemId 
            ? { ...item, current_stock: newStock } 
            : item
        ));
      }
      
      // Reset form
       clearCustomerSelection();
       setOrderType('sale');
       setSelectedTime(5);
       setSelectedChest('');
       setSelectedItem(null);
       setQuantity(1);
       setPendingItem(null);
       setShowConfirmation(false);
      
      // Reload orders
      await loadOrders();
      
      toast({ title: 'Pedido criado com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({ title: 'Erro ao criar pedido', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrderConfirmation = () => {
     setPendingItem(null);
     setShowConfirmation(false);
     setSelectedChest('');
     setSelectedItem(null);
     setQuantity(1);
   };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast({ title: 'Item removido do carrinho!' });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Adicione itens ao carrinho', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      // Obter ou criar cliente
      const customer = await getOrCreateCustomer();
      if (!customer) {
        return; // Erro já foi mostrado na função getOrCreateCustomer
      }
      
      await createOrder({
        customer_id: customer.id,
        customer_name: customer.name,
        steam_id: customer.steam_id,
        order_type: orderType,
        items: cart.map(item => ({
          item_id: item.itemId,
          quantity: item.quantity,
          price: item.price
        })),
        delivery_days: selectedTime
      });
      
      // Reset form
      clearCustomerSelection();
      setOrderType('sale');
      setSelectedTime(5);
      setCart([]);
      
      // Reload orders
      await loadOrders();
      
      toast({ title: 'Pedido registrado com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({ title: 'Erro ao registrar pedido', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markAsSent = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'sent');
      await loadOrders();
      toast({ title: 'Pedido marcado como enviado!' });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast({ title: 'Erro ao atualizar pedido', variant: 'destructive' });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      await loadOrders();
      toast({ title: 'Pedido cancelado!' });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast({ title: 'Erro ao cancelar pedido', variant: 'destructive' });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      await loadOrders();
      toast({ title: 'Pedido excluído com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({ title: 'Erro ao excluir pedido', variant: 'destructive' });
    }
  };

  const formatTimeRemaining = (deadline: string) => {
    const timeRemaining = calculateTimeRemaining(deadline);
    
    if (timeRemaining.expired) {
      return <span className="text-red-500 font-semibold">Expirado</span>;
    }
    
    return (
      <div className="flex items-center gap-1 text-sm">
        <Clock className="h-4 w-4" />
        <span className="font-mono">
          {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Register Order */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Registrar Pedido
          </CardTitle>
          <CardDescription>Crie um novo pedido para um cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Data */}
          <div className="space-y-4">
            {selectedCustomer && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-300">Cliente Selecionado</div>
                    <div className="text-sm text-green-600 dark:text-green-400">{selectedCustomer.name} - {selectedCustomer.steam_id}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCustomerSelection}
                  className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Label htmlFor="customer-name">Nome do Cliente</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder={selectedCustomer ? "Cliente selecionado" : "Digite o nome do cliente..."}
                  className={`bg-secondary/50 ${selectedCustomer ? 'border-green-500/50' : ''}`}
                  onFocus={() => customerName && setShowCustomerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                  disabled={!!selectedCustomer}
                />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.steam_id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Label htmlFor="steam-id">Steam ID</Label>
                <Input
                  id="steam-id"
                  value={steamId}
                  onChange={(e) => handleSteamIdChange(e.target.value)}
                  placeholder={selectedCustomer ? "Cliente selecionado" : "Digite o Steam ID..."}
                  className={`bg-secondary/50 ${selectedCustomer ? 'border-green-500/50' : ''}`}
                  onFocus={() => steamId && setShowSteamSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSteamSuggestions(false), 200)}
                  disabled={!!selectedCustomer}
                />
                {showSteamSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.steam_id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label>Tipo de Pedido</Label>
              <Select value={orderType} onValueChange={(value: 'sale' | 'giveaway') => setOrderType(value)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="giveaway">Sorteio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tempo de Entrega</Label>
              <Select value={selectedTime.toString()} onValueChange={(value) => setSelectedTime(Number(value))}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.days} value={option.days.toString()}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shopping Cart System */}
          <div className="border border-border/50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold">Sistema de Carrinho</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Baú</Label>
                <Select value={selectedChest} onValueChange={setSelectedChest}>
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
                <Label>Item (Herói)</Label>
                <Select 
                  value={selectedItem} 
                  onValueChange={setSelectedItem}
                  disabled={!selectedChest}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Selecionar item" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <Badge className={getRarityColor(item.rarity)}>
                            {item.rarity}
                          </Badge>
                          {item.name} ({item.hero_name}) - R$ {item.price.toFixed(2)} ({calculateAvailableStock(item)} disponível)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  max={maxQuantity}
                  disabled={!selectedItem}
                  className="bg-secondary/50"
                />
                {selectedItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo: {maxQuantity}
                  </p>
                )}
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={addToCart}
                  disabled={!selectedItem || quantity <= 0 || quantity > maxQuantity}
                  className="bg-gradient-gaming"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && pendingItem && (
              <div className="mt-4">
                <div className="bg-secondary/30 p-4 rounded-lg border border-border/50">
                  <h5 className="font-medium mb-3 text-center">Deseja finalizar esse pedido?</h5>
                  
                  <div className="bg-secondary/50 p-3 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={getRarityColor(pendingItem.rarity)}>
                        {pendingItem.rarity}
                      </Badge>
                      <span className="font-medium">{pendingItem.name}</span>
                      <span className="text-muted-foreground">({pendingItem.hero_name})</span>
                      <span className="text-muted-foreground">({pendingItem.chestName})</span>
                      <span>x{pendingItem.quantity}</span>
                      <span className="font-medium">R$ {(pendingItem.price * pendingItem.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={cancelOrderConfirmation}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={confirmOrder}
                      className="bg-gradient-gaming flex-1"
                      disabled={loading}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {loading ? 'Finalizando...' : 'Confirmar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default Orders;