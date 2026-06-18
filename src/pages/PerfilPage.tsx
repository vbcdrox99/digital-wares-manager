import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Shield, Award, Calendar, DollarSign, ShoppingBag, Layers, Save, CheckCircle2, AlertCircle, Copy, Check, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { getClientOrders, OrderWithItems } from '../integrations/supabase/services/orderService';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/ui/image-with-fallback';

const getOrderBadgeStatus = (order: any) => {
  if (order.status === 'sent') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        Entregue
      </Badge>
    );
  }
  if (order.status === 'cancelled') {
    return (
      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
        Cancelado
      </Badge>
    );
  }
  
  if (order.is_paid) {
    const hasDeadline = order.shipping_queue && order.shipping_queue.length > 0 && order.shipping_queue[0].deadline;
    if (!hasDeadline) {
      return (
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
          Pago (Aguardando adicionar como amigo)
        </Badge>
      );
    } else {
      const deadlineDate = new Date(order.shipping_queue[0].deadline);
      const diffTime = deadlineDate.getTime() - new Date().getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      if (diffTime <= 0) {
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse">
            Pronto para entrega
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            Pago (Aguardando envio - {diffDays} {diffDays === 1 ? 'dia restante' : 'dias restantes'})
          </Badge>
        );
      }
    }
  } else {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
        Aguardando Pagamento
      </Badge>
    );
  }
};

const PerfilPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Profile editing states
  const [name, setName] = useState('');
  const [steamId, setSteamId] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // PIX Modal states for paying pending orders
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [customerCpf, setCustomerCpf] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'waiting' | 'paid'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSteamId(user.steam_id || '');
      fetchOrders();
    }
  }, [user]);

  // Realtime subscription for pending orders
  useEffect(() => {
    if (orders.length === 0) return;

    const pendingOrderIds = orders.filter(o => o.status === 'pending').map(o => o.id);
    if (pendingOrderIds.length === 0) return;

    const channel = supabase
      .channel('public:orders:profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload: any) => {
        if (pendingOrderIds.includes(payload.new.id)) {
          // Atualiza a lista de pedidos localmente
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status, is_paid: payload.new.is_paid } : o));
          
          if (payload.new.is_paid) {
            toast.success(`Pagamento do pedido ${payload.new.id.slice(0, 8)} confirmado!`);
            if (selectedOrder && selectedOrder.id === payload.new.id) {
              setPaymentStatus('paid');
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders, selectedOrder]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const identifiers = [user.email];
      if (user.name) identifiers.push(user.name);
      
      const data = await getClientOrders(identifiers);
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar histórico de pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ name, steam_id: steamId })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso! Recarregando dados...');
      // Recarregar a página para atualizar o AuthContext
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Metricas
  const totalSpent = orders
    .filter(o => o.is_paid)
    .reduce((sum, o) => sum + Number(o.total_value), 0);

  const totalItems = orders
    .filter(o => o.is_paid)
    .reduce((sum, o) => sum + o.order_items.reduce((iSum, oi) => iSum + oi.quantity, 0), 0);

  const pendingOrdersCount = orders.filter(o => !o.is_paid && o.status !== 'cancelled').length;

  const handlePayOrder = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setCustomerCpf('');
    setQrCode('');
    setQrCodeBase64('');
    setPaymentStatus('idle');
    setShowPixModal(true);
  };

  const handleGeneratePix = async () => {
    if (!selectedOrder || !user) return;
    if (!customerCpf || customerCpf.length !== 11) {
      toast.error('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    setPaymentStatus('loading');
    try {
      const { data: pixData, error: pixError } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          order: selectedOrder,
          customer_email: user.email,
          customer_name: name || user.email,
          customer_cpf: customerCpf
        }
      });

      if (pixError || pixData?.error) {
        throw new Error(pixData?.error || pixError?.message || 'Erro ao gerar PIX');
      }

      setQrCode(pixData.qr_code);
      setQrCodeBase64(pixData.qr_code_base64);
      setPaymentStatus('waiting');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar PIX: ' + err.message);
      setPaymentStatus('idle');
    }
  };

  const copyPixCode = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <Navigation />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-background to-blue-900/10 pointer-events-none" />
        
        <div className="container mx-auto px-6 pt-24 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Meu Perfil
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus dados e acompanhe seus pedidos.
              </p>
            </div>
            <Button onClick={() => navigate('/catalog')} variant="outline" className="border-white/10 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Catálogo
            </Button>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
                    <h3 className="text-3xl font-bold mt-1 text-emerald-400">
                      R$ {totalSpent.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Itens Adquiridos</p>
                    <h3 className="text-3xl font-bold mt-1 text-cyan-400">
                      {totalItems}
                    </h3>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pedidos Efetuados</p>
                    <h3 className="text-3xl font-bold mt-1 text-purple-400">
                      {pendingOrdersCount}
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <Layers className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Alerta de ID do Dota 2 Pendente */}
          {!steamId && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 shadow-lg"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-400 text-sm">ID do Dota 2 Pendente!</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Você não definiu seu ID do Dota 2 (ID de Amigo) no seu perfil. Precisamos desta informação para te adicionar na Steam e realizar a entrega dos seus itens. Por favor, insira-o no campo de atualização abaixo.
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Form de Dados do Perfil */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Meus Dados
                  </CardTitle>
                  <CardDescription>
                    Mantenha seu perfil atualizado para agilizar a entrega de itens.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Seu nome"
                        className="bg-black/40 border-white/10 focus:border-primary/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <Input 
                        value={user?.email || ''} 
                        disabled 
                        className="bg-black/20 border-white/5 text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-muted-foreground">ID do Dota 2 (Dota ID)</label>
                        <span className="text-[10px] text-primary font-medium">
                          ID de Amigo (dentro do jogo)
                        </span>
                      </div>
                      <Input 
                        value={steamId} 
                        onChange={(e) => setSteamId(e.target.value.replace(/\D/g, ''))} 
                        placeholder="Ex: 235480181"
                        className="bg-black/40 border-white/10 focus:border-primary/50"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Precisamos do seu ID do Dota 2 para enviar o convite de amizade e entregar seus itens.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={savingProfile} 
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-700 transition-all font-semibold"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Card de Contato / WhatsApp */}
              <Card className="bg-gradient-to-br from-green-950/20 to-emerald-950/20 border-emerald-500/20 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
                    <MessageCircle className="w-5 h-5 text-emerald-400 animate-pulse" /> Contato / Dúvidas
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs">
                    Precisa de ajuda com o seu pedido, prazos de envio ou suporte? Fale conosco!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="https://wa.me/5511999999999" // Link do WhatsApp de suporte (exemplo configurável)
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                  >
                    Falar no WhatsApp
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Histórico de Compras */}
            <div className="lg:col-span-2">
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl min-h-[450px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Histórico de Pedidos
                  </CardTitle>
                  <CardDescription>
                    Veja abaixo todos os seus pedidos efetuados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
                      <span>Carregando pedidos...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                      <h4 className="text-lg font-semibold">Nenhum pedido encontrado</h4>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Você ainda não efetuou nenhuma compra. Explore nosso catálogo de skins premium do Dota 2!
                      </p>
                      <Button onClick={() => navigate('/catalog')} className="bg-primary hover:bg-primary/90 text-white font-medium">
                        Ver Catálogo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="border border-white/10 rounded-xl p-5 bg-black/30 hover:bg-black/40 transition-all duration-300"
                        >
                          <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-white/5 mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Pedido #{order.id.slice(0, 8)}</span>
                                {getOrderBadgeStatus(order)}
                              </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground block">Total</span>
                                <span className="font-bold text-lg text-white">R$ {Number(order.total_value).toFixed(2)}</span>
                              </div>
                            </div>

                          {/* Itens do Pedido */}
                          <div className="space-y-3">
                            {order.order_items.map((oi) => (
                              <div key={oi.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0">
                                    {oi.items?.image_url ? (
                                      <ImageWithFallback src={oi.items.image_url} alt={oi.items.name || oi.items.hero_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs text-zinc-600">No Image</div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-medium text-white block">{oi.items?.name || oi.items?.hero_name}</span>
                                    <span className="text-xs text-muted-foreground">Qtd: {oi.quantity} • Hero: {oi.items?.hero_name}</span>
                                  </div>
                                </div>
                                <span className="text-muted-foreground">R$ {Number(oi.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Se pendente e não pago, disponibilizar botão para pagar */}
                          {order.status === 'pending' && !(order as any).is_paid && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                              <Button 
                                onClick={() => handlePayOrder(order)}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Pagar com PIX
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mini fluxo ilustrativo de entrega */}
              <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Como funciona a sua entrega?
                  </CardTitle>
                  <CardDescription>
                    Entenda passo a passo o processo desde a compra até o recebimento do item.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    
                    {/* Passo 1 */}
                    <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">1. Escolha</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Escolha o item no catálogo e faça a compra.</p>
                    </div>

                    {/* Passo 2 */}
                    <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-2">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">2. Pagamento</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Pague via PIX e insira seu ID do Dota 2.</p>
                    </div>

                    {/* Passo 3 */}
                    <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-2">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">3. Amizade</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Nós te adicionamos como amigo no Dota 2.</p>
                    </div>

                    {/* Passo 4 */}
                    <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-2">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">4. Espera</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Aguarde o prazo regulamentar da Steam.</p>
                    </div>

                    {/* Passo 5 */}
                    <div className="flex flex-col items-center text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">5. Entrega</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Seu item é enviado via presente!</p>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL PIX */}
      {showPixModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
            
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" /> Pagamento Seguro
              </h3>
              <button onClick={() => setShowPixModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Resumo do Pedido no Modal */}
              <div className="bg-zinc-900/60 border border-zinc-800/40 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-xs text-zinc-400 block">Pedido #{selectedOrder.id.slice(0, 8)}</span>
                  <span className="text-sm font-semibold text-white">
                    {selectedOrder.order_items.length} item(ns)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Valor</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    R$ {Number(selectedOrder.total_value).toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentStatus === 'idle' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Informe seu CPF para gerar o PIX</label>
                    <Input 
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value.replace(/\D/g, '').slice(0,11))}
                      placeholder="Apenas números (11 dígitos)"
                      className="bg-zinc-900 border-zinc-800 focus:border-amber-500/50 text-white"
                      maxLength={11}
                    />
                  </div>
                  <Button 
                    onClick={handleGeneratePix}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl transition-all"
                  >
                    Gerar QR Code PIX
                  </Button>
                </div>
              )}

              {paymentStatus === 'loading' && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-zinc-400 text-sm font-medium">Gerando PIX no Mercado Pago...</span>
                </div>
              )}

              {paymentStatus === 'waiting' && qrCodeBase64 && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-inner">
                    <img 
                      src={`data:image/png;base64,${qrCodeBase64}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  
                  <p className="text-xs text-zinc-400 text-center max-w-xs">
                    Escaneie o QR Code acima no aplicativo do seu banco ou use a chave Copia e Cola abaixo.
                  </p>

                  <div className="flex items-center gap-2 w-full mt-2">
                    <Input 
                      value={qrCode}
                      readOnly
                      className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs text-ellipsis overflow-hidden"
                    />
                    <Button 
                      onClick={copyPixCode}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3 flex items-center justify-center gap-3 text-xs text-amber-400 mt-2">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    <span>Aguardando confirmação do pagamento...</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'paid' && (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Pagamento Confirmado!</h4>
                    <p className="text-sm text-zinc-400 mt-1">
                      O estoque foi atualizado e seu item já está pronto para envio.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setShowPixModal(false);
                      fetchOrders();
                    }}
                    className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl"
                  >
                    Fechar
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple X Icon mock for close buttons
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export default PerfilPage;
