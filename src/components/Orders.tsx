import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, X, Check, Ban, Calendar } from 'lucide-react';
import { Chest, Item, Order, CartItem, OrderType, OrderStatus, Rarity } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

interface OrdersProps {
  chests: Chest[];
  items: Item[];
  orders: Order[];
  onCreateOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

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

const Orders: React.FC<OrdersProps> = ({
  chests,
  items,
  orders,
  onCreateOrder,
  onUpdateOrder
}) => {
  const [customerName, setCustomerName] = useState('');
  const [steamId, setSteamId] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('sale');
  const [selectedChest, setSelectedChest] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  const calculateAvailableStock = (item: Item) => {
    const usedInOrders = orders
      .filter(order => order.status === 'pending')
      .reduce((total, order) => {
        const orderItem = order.items.find(oi => oi.itemId === item.id);
        return total + (orderItem ? orderItem.quantity : 0);
      }, 0);
    
    const usedInCart = cart
      .filter(cartItem => cartItem.itemId === item.id)
      .reduce((total, cartItem) => total + cartItem.quantity, 0);
    
    return Math.max(0, item.initialStock - usedInOrders - usedInCart);
  };

  const availableItems = items.filter(item => 
    item.chestId === selectedChest && calculateAvailableStock(item) > 0
  );

  const selectedItemData = items.find(item => item.id === selectedItem);
  const maxQuantity = selectedItemData ? calculateAvailableStock(selectedItemData) : 0;

  const addToCart = () => {
    if (!selectedItem || !selectedItemData || quantity <= 0 || quantity > maxQuantity) {
      toast({ title: 'Selecione um item válido e quantidade', variant: 'destructive' });
      return;
    }

    const chest = chests.find(c => c.id === selectedItemData.chestId);
    const cartItem: CartItem = {
      itemId: selectedItem,
      quantity,
      heroName: selectedItemData.heroName,
      rarity: selectedItemData.rarity,
      price: selectedItemData.price,
      chestName: chest?.name || ''
    };

    setCart(prev => [...prev, cartItem]);
    setSelectedChest('');
    setSelectedItem('');
    setQuantity(1);
    toast({ title: 'Item adicionado ao carrinho!' });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast({ title: 'Item removido do carrinho!' });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const finishOrder = () => {
    if (!customerName.trim() || !steamId.trim() || cart.length === 0) {
      toast({ title: 'Preencha todos os campos e adicione itens ao carrinho', variant: 'destructive' });
      return;
    }

    const order: Omit<Order, 'id' | 'createdAt'> = {
      customerName: customerName.trim(),
      steamId: steamId.trim(),
      orderType,
      items: [...cart],
      status: 'pending',
      totalValue: calculateTotal()
    };

    onCreateOrder(order);
    
    // Reset form
    setCustomerName('');
    setSteamId('');
    setOrderType('sale');
    setCart([]);
    
    toast({ title: 'Pedido registrado com sucesso!' });
  };

  const markAsSent = (orderId: string) => {
    onUpdateOrder(orderId, { 
      status: 'sent', 
      sentAt: new Date().toISOString() 
    });
    toast({ title: 'Pedido marcado como enviado!' });
  };

  const cancelOrder = (orderId: string) => {
    onUpdateOrder(orderId, { status: 'cancelled' });
    toast({ title: 'Pedido cancelado!' });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer-name">Nome do Cliente</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                className="bg-secondary/50"
              />
            </div>
            
            <div>
              <Label htmlFor="steam-id">Steam ID</Label>
              <Input
                id="steam-id"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="Ex: STEAM_0:1:12345678"
                className="bg-secondary/50"
              />
            </div>
            
            <div>
              <Label>Tipo de Pedido</Label>
              <Select value={orderType} onValueChange={(value: OrderType) => setOrderType(value)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="giveaway">Sorteio</SelectItem>
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
                          {item.heroName} - R$ {item.price.toFixed(2)} ({calculateAvailableStock(item)} disponível)
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

            {/* Cart Display */}
            {cart.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Carrinho ({cart.length} itens)</h5>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                        <span className="font-medium">{item.heroName}</span>
                        <span className="text-muted-foreground">({item.chestName})</span>
                        <span>x{item.quantity}</span>
                        <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <span className="font-semibold">Total: R$ {calculateTotal().toFixed(2)}</span>
                    <Button onClick={finishOrder} className="bg-gradient-gaming">
                      Finalizar Pedido
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>Todos os pedidos registrados (mais novos primeiro)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Itens do Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((order) => (
                    <TableRow key={order.id} className="hover:bg-secondary/20">
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge className={getRarityColor(item.rarity)}>
                                {item.rarity}
                              </Badge>
                              {item.heroName} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.steamId}</div>
                          <Badge variant="outline" className="mt-1">
                            {order.orderType === 'sale' ? 'Venda' : 'Sorteio'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.sentAt ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(order.sentAt).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'pending' ? 'Pendente' : 
                           order.status === 'sent' ? 'Enviado' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => markAsSent(order.id)}
                              className="bg-success text-success-foreground"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Enviado
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelOrder(order.id)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Nenhum pedido registrado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;