import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Eye, Calendar, DollarSign, Package, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabaseServices, Customer } from '@/integrations/supabase/services';
import { formatCurrency } from '@/lib/utils';

interface CustomerWithStats {
  id: string;
  name: string;
  steam_id: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

interface OrderWithItems {
  id: string;
  customer_name: string;
  steam_id: string;
  order_type: string;
  status: string;
  total_value: number;
  created_at: string;
  sent_at?: string;
  deadline?: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    items: {
      id: string;
      name: string;
      hero_name: string;
      rarity: string;
      price: number;
      chest_id: string;
      chests: {
        name: string;
      };
    };
  }>;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderWithItems[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState({
    customers: false,
    orders: false
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      console.log('🔍 Carregando clientes...');
      
      // Buscar todos os clientes primeiro
      const customersData = await supabaseServices.customers.getAll();
      
      // Para cada cliente, calcular estatísticas básicas
      const customersWithStats = customersData.map(customer => ({
        ...customer,
        total_orders: 0,
        total_spent: 0,
        last_order_date: undefined
      }));
      
      console.log('👥 Clientes carregados:', customersWithStats);
      setCustomers(customersWithStats);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const loadCustomerOrders = async (customerId: string) => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      console.log('🔍 Carregando pedidos do cliente:', customerId);
      
      const ordersData = await supabaseServices.customers.getCustomerOrders(customerId);
      
      console.log('📦 Pedidos carregados:', ordersData);
      setCustomerOrders(ordersData);
    } catch (error) {
      console.error(`❌ Erro ao carregar pedidos do cliente ${customerId}:`, error);
      toast({ title: 'Erro ao carregar pedidos', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const handleViewCustomer = async (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    await loadCustomerOrders(customer.id);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.steam_id.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      sent: 'bg-green-500/20 text-green-500 border-green-500/30',
      delivered: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerenciamento de Clientes
          </CardTitle>
          <CardDescription>
            Visualize todos os clientes cadastrados e seu histórico de compras
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou Steam ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredCustomers.length} cliente(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading.customers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando clientes...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/30 border-border/50 hover:bg-secondary/50'
                    }`}
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Steam ID: {customer.steam_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-3 w-3" />
                          {customer.total_orders} pedidos
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-500">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(customer.total_spent)}
                        </div>
                      </div>
                    </div>
                    {customer.last_order_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        Último pedido: {formatDate(customer.last_order_date)}
                      </div>
                    )}
                  </div>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Orders */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>
              {selectedCustomer ? `Pedidos de ${selectedCustomer.name}` : 'Histórico de Pedidos'}
            </CardTitle>
            <CardDescription>
              {selectedCustomer 
                ? `Steam ID: ${selectedCustomer.steam_id}`
                : 'Selecione um cliente para ver o histórico'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Selecione um cliente para visualizar seus pedidos
              </div>
            ) : loading.orders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando pedidos...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customerOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pedido #{order.id.slice(-8)}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <span className="font-bold text-green-500">
                        {formatCurrency(order.total_value)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {formatDate(order.created_at)}
                    </div>
                    
                    <div className="space-y-1">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.items.name} ({item.items.hero_name})
                          </span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {customerOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Este cliente ainda não fez nenhum pedido
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Customers;