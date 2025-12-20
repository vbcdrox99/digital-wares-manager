import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, User, Package, X } from 'lucide-react';
import { getOrdersWithItems, updateOrderStatus } from '@/integrations/supabase/services/orderService';
import { useRarities } from '@/hooks/useRarities';
import { getBadgeStyleFromColor } from '@/utils/rarityUtils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  items: {
    id: string;
    hero_name: string;
    rarity: string;
    chests: {
      id: string;
      name: string;
    };
  };
}

interface OrderWithItems {
  id: string;
  customer_name: string;
  steam_id: string;
  order_type: 'sale' | 'giveaway';
  status: 'pending' | 'sent' | 'cancelled';
  created_at: string;
  sent_at: string | null;
  total_value: number;
  shipping_queue: {
    deadline: string;
  }[] | null;
  order_items: OrderItem[];
}

type OrderStatus = 'pending' | 'overdue' | 'sent' | 'cancelled';

interface ShippingQueueProps {}

const getStatusColor = (status: OrderStatus) => {
  const colors = {
    'pending': 'bg-blue-100 text-blue-800 border-blue-300',
    'overdue': 'bg-red-100 text-red-800 border-red-300',
    'sent': 'bg-green-100 text-green-800 border-green-300',
    'cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[status];
};

const getStatusLabel = (status: OrderStatus) => {
  const labels = {
    'pending': 'Pendente',
    'overdue': 'Atrasado',
    'sent': 'Enviado',
    'cancelled': 'Cancelado'
  };
  return labels[status];
};

const ShippingQueue: React.FC<ShippingQueueProps> = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { getRarityColor } = useRarities();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrdersWithItems();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatusLocal = async (orderId: string, newStatus: 'pending' | 'sent' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Recarrega os dados
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };

  // Calcular status baseado na data de entrega
  const getOrderStatus = (order: OrderWithItems): OrderStatus => {
    if (order.status === 'sent') return 'sent';
    if (order.status === 'cancelled') return 'cancelled';
    
    // Se não há shipping_queue, é um pedido sem prazo definido
    if (!order.shipping_queue || order.shipping_queue.length === 0) {
      return 'pending';
    }
    
    const deliveryDate = new Date(order.shipping_queue[0].deadline);
    const now = new Date();
    
    if (deliveryDate < now) {
      return 'overdue';
    }
    
    return 'pending';
  };

  // Filtrar apenas pedidos que não foram enviados ou cancelados
  const queueOrders = orders.filter(order => 
    order.status !== 'sent' && order.status !== 'cancelled'
  ).map(order => {
    let daysLeft = 0;
    
    if (order.shipping_queue && order.shipping_queue.length > 0) {
      const deliveryDate = new Date(order.shipping_queue[0].deadline);
      const today = new Date();
      const timeDiff = deliveryDate.getTime() - today.getTime();
      daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    
    return {
      ...order,
      daysLeft,
      calculatedStatus: getOrderStatus(order)
    };
  }).sort((a, b) => {
    // Ordenar por prioridade: atrasados primeiro, depois por dias restantes
    if (a.calculatedStatus === 'overdue' && b.calculatedStatus !== 'overdue') return -1;
    if (a.calculatedStatus !== 'overdue' && b.calculatedStatus === 'overdue') return 1;
    return a.daysLeft - b.daysLeft;
  });

  const overdueCount = queueOrders.filter(order => order.calculatedStatus === 'overdue').length;
  const pendingCount = queueOrders.filter(order => order.calculatedStatus === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando fila de envios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ENTREGUES</p>
                <p className="text-2xl font-bold text-green-600">{orders.filter(order => order.status === 'sent').length}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
              </div>
              <User className="h-8 w-8 text-pending" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-overdue">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-overdue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Queue Table */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Fila de Envios Priorizada
          </CardTitle>
          <CardDescription>
            Pedidos pendentes ordenados por prazo de envio (mais antigos primeiro)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Prazo de Envio</TableHead>
                  <TableHead>Status do Envio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className={`hover:bg-secondary/20 ${
                      order.calculatedStatus === 'overdue' ? 'bg-overdue/5' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {order.shipping_queue && order.shipping_queue.length > 0 
                            ? new Date(order.shipping_queue[0].deadline).toLocaleDateString('pt-BR')
                            : 'Sem prazo definido'
                          }
                        </div>
                        <div className={`text-sm ${
                          order.calculatedStatus === 'overdue' 
                            ? 'text-overdue font-medium' 
                            : order.daysLeft <= 7 
                              ? 'text-warning font-medium'
                              : 'text-muted-foreground'
                        }`}>
                          {order.shipping_queue && order.shipping_queue.length > 0 
                            ? (order.calculatedStatus === 'overdue' 
                                ? `${Math.abs(order.daysLeft)} dias em atraso`
                                : `${order.daysLeft} dias restantes`)
                            : 'Aguardando agendamento'
                          }
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.calculatedStatus)}>
                          {getStatusLabel(order.calculatedStatus)}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                             size="sm"
                             variant="outline"
                             onClick={() => updateOrderStatusLocal(order.id, 'sent')}
                             className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                             title="Marcar como Enviado"
                           >
                             <Package className="h-3 w-3" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => updateOrderStatusLocal(order.id, 'cancelled')}
                             className="h-7 px-2 text-destructive hover:text-destructive"
                             title="Cancelar Pedido"
                           >
                             <X className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.steam_id}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {order.order_items.map((orderItem, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge {...getBadgeStyleFromColor(getRarityColor(orderItem.items.rarity))}>
                              {orderItem.items.rarity}
                            </Badge>
                            <span>{orderItem.items.hero_name}</span>
                            <span className="text-muted-foreground">x{orderItem.quantity}</span>
                            <span className="text-xs text-muted-foreground">({orderItem.items.chests.name})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        R$ {order.total_value.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.order_items.reduce((total, orderItem) => total + orderItem.quantity, 0)} itens
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {queueOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground/50" />
                        <p>Nenhum pedido pendente na fila de envios</p>
                        <p className="text-sm">Todos os pedidos foram processados!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Delivered Orders Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            ENTREGUES
          </CardTitle>
          <CardDescription>
            Pedidos que foram finalizados e entregues aos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Data de Entrega</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.filter(order => order.status === 'sent').map((order) => (
                  <TableRow key={order.id} className="hover:bg-secondary/20">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {order.sent_at 
                            ? new Date(order.sent_at).toLocaleDateString('pt-BR')
                            : 'Data não disponível'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.sent_at 
                            ? new Date(order.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : ''
                          }
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.steam_id}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {order.order_items.map((orderItem, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge {...getBadgeStyleFromColor(getRarityColor(orderItem.items.rarity))}>
                              {orderItem.items.rarity}
                            </Badge>
                            <span>{orderItem.items.hero_name}</span>
                            <span className="text-muted-foreground">x{orderItem.quantity}</span>
                            <span className="text-xs text-muted-foreground">({orderItem.items.chests.name})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-green-600">
                        R$ {order.total_value.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.order_items.reduce((total, orderItem) => total + orderItem.quantity, 0)} itens
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={order.order_type === 'sale' ? 'default' : 'secondary'}>
                        {order.order_type === 'sale' ? 'Venda' : 'Sorteio'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                
                {orders.filter(order => order.status === 'sent').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <p>Nenhum pedido foi entregue ainda</p>
                        <p className="text-sm">Os pedidos finalizados aparecerão aqui</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Priority Legend */}
      {queueOrders.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-overdue"></div>
                  <span>Atrasados (prazo vencido)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span>Urgente (&le; 7 dias)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pending"></div>
                  <span>Normal (&gt; 7 dias)</span>
                </div>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShippingQueue;