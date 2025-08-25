import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, User } from 'lucide-react';
import { Order, Rarity } from '@/types/inventory';

interface ShippingQueueProps {
  orders: Order[];
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

const ShippingQueue: React.FC<ShippingQueueProps> = ({ orders }) => {
  const pendingOrders = orders.filter(order => order.status === 'pending');
  
  const shippingQueue = pendingOrders.map(order => {
    const createdDate = new Date(order.createdAt);
    const deadline = new Date(createdDate);
    deadline.setDate(deadline.getDate() + 31); // 31 days to ship
    
    const now = new Date();
    const isOverdue = now > deadline;
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...order,
      deadline: deadline.toISOString(),
      status: isOverdue ? 'overdue' as const : 'awaiting' as const,
      daysLeft
    };
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const overdueCount = shippingQueue.filter(item => item.status === 'overdue').length;
  const awaitingCount = shippingQueue.filter(item => item.status === 'awaiting').length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total na Fila</p>
                <p className="text-2xl font-bold text-primary">{shippingQueue.length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold text-pending">{awaitingCount}</p>
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
                {shippingQueue.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={`hover:bg-secondary/20 ${
                      item.status === 'overdue' ? 'bg-overdue/5' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {new Date(item.deadline).toLocaleDateString('pt-BR')}
                        </div>
                        <div className={`text-sm ${
                          item.status === 'overdue' 
                            ? 'text-overdue font-medium' 
                            : item.daysLeft <= 7 
                              ? 'text-warning font-medium'
                              : 'text-muted-foreground'
                        }`}>
                          {item.status === 'overdue' 
                            ? `${Math.abs(item.daysLeft)} dias em atraso`
                            : `${item.daysLeft} dias restantes`
                          }
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={
                        item.status === 'overdue'
                          ? 'bg-overdue/20 text-overdue border-overdue/30'
                          : 'bg-pending/20 text-pending border-pending/30'
                      }>
                        {item.status === 'overdue' ? 'Atrasado' : 'Aguardando Liberação'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.customerName}</div>
                        <div className="text-sm text-muted-foreground">{item.steamId}</div>
                        <Badge variant="outline" className="mt-1">
                          {item.orderType === 'sale' ? 'Venda' : 'Sorteio'}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {item.items.map((orderItem, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge className={getRarityColor(orderItem.rarity)}>
                              {orderItem.rarity}
                            </Badge>
                            <span>{orderItem.heroName}</span>
                            <span className="text-muted-foreground">x{orderItem.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        R$ {item.totalValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.items.reduce((total, orderItem) => total + orderItem.quantity, 0)} itens
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {shippingQueue.length === 0 && (
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
      
      {/* Priority Legend */}
      {shippingQueue.length > 0 && (
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