import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShoppingCart, Star, Package, Eye, X, Info, Copy, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useItems } from '../hooks/useItems';
import { Item } from '../types/inventory';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { useRarities } from '../hooks/useRarities';
import { getBadgeStyleFromColor } from '@/utils/rarityUtils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, loading } = useItems();
  const { getRarityColor } = useRarities();
  const { user } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Checkout States
  const [showPixModal, setShowPixModal] = useState(false);
  const [customerCpf, setCustomerCpf] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle'|'loading'|'waiting_payment'|'paid'>('idle');
  const [orderId, setOrderId] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos (300 segundos)

  useEffect(() => {
    if (user) {
      setSteamId(user.steam_id || '');
    }
    const savedCpf = localStorage.getItem('user_cpf');
    if (savedCpf) {
      setCustomerCpf(savedCpf);
    }
  }, [user]);

  // Contador de 5 minutos para o pagamento do PIX
  useEffect(() => {
    if (paymentStatus !== 'waiting_payment' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('idle');
          toast.error('O tempo limite para pagamento do PIX expirou. Por favor, gere um novo código.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, timeLeft]);

  useEffect(() => {
    if (!loading && id) {
      const foundItem = items.find(item => item.id === id);
      setItem(foundItem ? foundItem : null);
      setIsLoading(false);
    } else if (!loading && items.length === 0) {
      setIsLoading(false);
    }
  }, [id, items, loading]);

  // Listen to Order Status Changes via Realtime
  useEffect(() => {
    if (!orderId || paymentStatus !== 'waiting_payment') return;
    
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload: any) => {
        if (payload.new.is_paid) {
          setPaymentStatus('paid');
          toast.success('Pagamento confirmado com sucesso!');
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    }
  }, [orderId, paymentStatus]);

  const handleBuy = () => {
    if (!user) {
      toast('Login Necessário', { description: 'Você precisa fazer login para comprar.' });
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!item) return;
    
    if (item.current_stock < quantity) {
      alert('Quantidade indisponível em estoque!');
      return;
    }
    
    // Reset modal states
    setPaymentStatus('idle');
    setQrCode('');
    setQrCodeBase64('');
    setOrderId(null);
    setTimeLeft(300); // 5 minutos (300 segundos)
    setShowPixModal(true);
  };

  const formatCpf = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 11);
  }

  const handleGeneratePix = async () => {
    if (!customerCpf || customerCpf.length !== 11) {
      toast.error('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }
    
    setPaymentStatus('loading');
    
    try {
      // Salvar CPF no localStorage para compras futuras
      localStorage.setItem('user_cpf', customerCpf);

      const totalValue = (item?.discount && item.discount > 0 
        ? item.price * (1 - item.discount / 100) 
        : item?.price || 0) * quantity;

      // 1. Create Order in DB (steam_id can be updated later on paid screen)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: user?.user_metadata?.name || user?.email,
          total_value: totalValue,
          steam_id: steamId || '',
          order_type: 'sale',
          status: 'pending' 
        })
        .select()
        .single();
        
      if (orderError) throw orderError;
      setOrderId(orderData.id);

      // 2. Create Order Item to link the order to the specific item
      const { error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          item_id: item.id,
          quantity: quantity,
          price: item?.price || 0
        });

      if (orderItemError) throw orderItemError;

      const { data: pixData, error: pixError } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          order: orderData,
          customer_email: user?.email,
          customer_name: user?.user_metadata?.name || user?.email,
          customer_cpf: customerCpf
        }
      });

      console.log('Pix Response:', { pixData, pixError });

      if (pixError || pixData?.error) {
        throw new Error(pixData?.error || pixError?.message || 'Erro ao gerar PIX');
      }
      
      setQrCode(pixData.qr_code);
      setQrCodeBase64(pixData.qr_code_base64);
      setTimeLeft(300); // Garante reset do tempo ao gerar
      setPaymentStatus('waiting_payment');
      
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PIX: ' + e.message);
      setPaymentStatus('idle');
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  }
  
  const getRelatedItems = () => {
    if (!item || !items.length) return [];
    return items
      .filter(i => i.id !== item.id && (i.rarity === item.rarity || i.hero_name === item.hero_name))
      .slice(0, 4);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-muted-foreground text-lg">Carregando detalhes...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Item não encontrado</h1>
          <Button onClick={() => navigate('/catalog')} variant="outline" className="border-primary/20 hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-blue-900/20 pointer-events-none" />

        <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
            <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            >
            <Button
                onClick={() => navigate('/catalog')}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 mb-4 backdrop-blur-sm border border-transparent hover:border-white/10 transition-all duration-300"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Catálogo
            </Button>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden group shadow-2xl shadow-black/20">
                <CardContent className="p-0">
                    <div className="relative aspect-[16/10] overflow-hidden">
                    {item.image_url ? (
                        <ImageWithFallback
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center group-hover:from-gray-800 group-hover:to-gray-700 transition-colors">
                        <Package className="h-24 w-24 text-gray-600 group-hover:text-gray-500 transition-colors mb-4" />
                        <span className="text-gray-500 text-lg">Sem imagem</span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge 
                            {...getBadgeStyleFromColor(getRarityColor(item.rarity), "shadow-lg backdrop-blur-md text-xs px-2.5 py-0.5 md:text-base md:px-3 md:py-1")}
                        >
                            {item.rarity}
                        </Badge>
                        {item.discount !== undefined && item.discount > 0 && (
                        <Badge className="bg-red-600 text-white font-bold shadow-lg border-0 self-start">
                            -{item.discount}%
                        </Badge>
                        )}
                    </div>
                    
                    {item.highlighted && (
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-none font-bold shadow-lg backdrop-blur-md flex items-center gap-1">
                                <Star className="w-4 h-4 fill-current" /> Destaque
                            </Badge>
                        </div>
                    )}
                    </div>
                </CardContent>
                </Card>

                <div className="mt-6 grid grid-cols-2 gap-3 md:gap-6">
                <Card className="bg-black/20 border-white/10 backdrop-blur-sm rounded-xl">
                    <CardHeader className="p-3 pb-2 md:p-6 md:pb-2">
                    <h3 className="text-sm md:text-lg font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        Disponibilidade
                    </h3>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 md:mb-2 gap-1">
                        <span className="text-xs md:text-base text-muted-foreground">Em estoque:</span>
                        <span className="text-sm md:text-base text-foreground font-semibold">
                        {item.current_stock} / {item.initial_stock}
                        </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 md:h-2">
                        <div
                        className="bg-gradient-to-r from-primary/80 to-primary h-1.5 md:h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${Math.min((item.current_stock / item.initial_stock) * 100, 100)}%`
                        }}
                        />
                    </div>
                    </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/10 backdrop-blur-sm rounded-xl">
                    <CardHeader className="p-3 pb-2 md:p-6 md:pb-2">
                    <h3 className="text-sm md:text-lg font-semibold text-foreground">Quantidade</h3>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/10 hover:bg-white/5 h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                        -
                        </Button>
                        <span className="text-foreground font-semibold text-lg md:text-xl w-6 md:w-8 text-center">
                        {quantity}
                        </span>
                        <Button
                        onClick={() => setQuantity(Math.min(item.current_stock, quantity + 1))}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/10 hover:bg-white/5 h-7 w-7 md:h-8 md:w-8 p-0"
                        disabled={quantity >= item.current_stock}
                        >
                        +
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-xs md:text-sm mt-1 md:mt-2">
                        Total: R$ {(
                        (item.discount && item.discount > 0 
                            ? item.price * (1 - item.discount / 100) 
                            : item.price
                        ) * quantity
                        ).toFixed(2)}
                    </p>
                    </CardContent>
                </Card>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-8"
            >
                <div className="space-y-4">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 drop-shadow-sm">{item.name}</h1>
                    {item.hero_name && (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-1 text-sm">
                            {item.hero_name}
                        </Badge>
                    </div>
                    )}
                </div>
                
                <div className="flex items-end gap-4 p-6 bg-black/20 border border-white/5 rounded-xl">
                    {item.discount && item.discount > 0 ? (
                    <div className="flex flex-col">
                        <span className="text-lg text-muted-foreground line-through">
                        R$ {parseFloat(item.price.toString()).toFixed(2)}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-green-400 drop-shadow-sm">
                            R$ {(item.price * (1 - item.discount / 100)).toFixed(2)}
                            </span>
                            <span className="text-sm text-green-500/80 font-medium">com desconto</span>
                        </div>
                    </div>
                    ) : (
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary drop-shadow-sm">
                        R$ {parseFloat(item.price.toString()).toFixed(2)}
                        </span>
                    </div>
                    )}
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                        Este item é uma adição exclusiva para sua coleção. Garantimos a entrega rápida e segura através de nossa plataforma.
                        Aproveite os preços especiais e complete seu inventário hoje mesmo.
                    </p>
                </div>
                </div>

                <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                >
                <Button
                    onClick={handleBuy}
                    disabled={item.current_stock === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg shadow-lg shadow-primary/20 transition-all duration-300"
                >
                    <div className="flex items-center justify-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    {item.current_stock === 0 ? 'Fora de Estoque' : 'Comprar Agora'}
                    </div>
                </Button>
                </motion.div>

                <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors duration-300">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-foreground font-medium">Dúvidas sobre a entrega?</p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                    O envio é realizado via presente (30 dias) ou troca direta, dependendo do item. 
                                    Garantimos segurança e suporte total durante todo o processo.
                                </p>
                            </div>
                            <Link to="/faq" className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors font-medium group/link">
                                Entenda como funciona no FAQ <ArrowRight className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
            </div>
            
            {getRelatedItems().length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-24"
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-foreground">
                        Itens Relacionados
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate('/catalog')}>
                        Ver todos
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getRelatedItems().map((relatedItem, index) => (
                    <motion.div
                    key={relatedItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    >
                    <Link to={`/item/${relatedItem.id}`} className="block h-full">
                        <Card className="group bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-black/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer h-full">
                        <CardHeader className="p-0">
                            <div className="relative overflow-hidden aspect-[16/10]">
                            {relatedItem.image_url ? (
                                <ImageWithFallback 
                                src={relatedItem.image_url} 
                                alt={relatedItem.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center group-hover:from-gray-800 group-hover:to-gray-700 transition-colors">
                                <Package className="h-8 w-8 text-gray-600 group-hover:text-gray-500 transition-colors mb-2" />
                                <span className="text-gray-600 text-sm">Sem imagem</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                            
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <Badge 
                                    {...getBadgeStyleFromColor(getRarityColor(relatedItem.rarity), "shadow-lg backdrop-blur-md")}
                                >
                                    {relatedItem.rarity}
                                </Badge>
                            </div>

                            {relatedItem.discount && relatedItem.discount > 0 && (
                                <Badge
                                className="absolute top-2 right-2 bg-red-600 text-white font-bold shadow-lg border-0"
                                >
                                -{relatedItem.discount}%
                                </Badge>
                            )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1">
                            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">{relatedItem.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="uppercase tracking-wider text-xs font-medium bg-white/5 px-2 py-0.5 rounded text-gray-400">
                                {relatedItem.hero_name}
                                </span>
                            </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="space-y-0.5">
                                <div className="flex flex-col items-start">
                                    {relatedItem.discount && relatedItem.discount > 0 ? (
                                    <>
                                        <span className="text-xs text-muted-foreground line-through">
                                        R$ {parseFloat(relatedItem.price.toString()).toFixed(2)}
                                        </span>
                                        <span className="text-xl font-bold text-green-400 shadow-green-900/20">
                                        R$ {(relatedItem.price * (1 - relatedItem.discount / 100)).toFixed(2)}
                                        </span>
                                    </>
                                    ) : (
                                    <span className="text-xl font-bold text-primary shadow-primary/20">
                                        R$ {parseFloat(relatedItem.price.toString()).toFixed(2)}
                                    </span>
                                    )}
                                </div>
                            </div>
                            
                            <Button 
                                size="sm" 
                                className="bg-white/5 hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-white/10 transition-all duration-300"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            </div>
                        </CardContent>
                        </Card>
                    </Link>
                    </motion.div>
                ))}
                </div>
            </motion.div>
            )}
        </div>
      </div>

      {/* Modal PIX Transparente */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Pagamento Seguro</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPixModal(false);
                  if (paymentStatus === 'paid') {
                    navigate('/perfil');
                  }
                }}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {paymentStatus === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Preencha os dados abaixo para gerar seu QR Code de pagamento PIX e iniciar o processo de entrega.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Seu CPF (só números)</label>
                  <input
                    type="text"
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                    placeholder="00011122233"
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    maxLength={11}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1.5">
                    O CPF deve ser colocado apenas a primeira vez (primeira compra), e ficará salvo para as próximas.
                  </p>
                </div>
                
                <Button 
                  onClick={handleGeneratePix} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2 py-6 text-lg"
                  disabled={customerCpf.length !== 11}
                >
                  Gerar PIX
                </Button>
              </div>
            )}

            {paymentStatus === 'loading' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-300 font-medium">Gerando pagamento no Mercado Pago...</p>
              </div>
            )}

            {paymentStatus === 'waiting_payment' && (
              <div className="flex flex-col items-center text-center space-y-6">
                
                {/* Informações do Item */}
                <div className="w-full bg-black/30 border border-white/10 rounded-lg p-4 flex items-center gap-4 text-left">
                  {item?.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-md border border-white/10" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center border border-white/10">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white line-clamp-2">{item?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Quantidade: {quantity}</p>
                    <p className="text-lg font-bold text-green-400 mt-1">
                      R$ {((item?.discount && item.discount > 0 ? (item?.price || 0) * (1 - item.discount / 100) : item?.price || 0) * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Cronômetro Regressivo */}
                <div className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span>Tempo restante: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <p className="text-[10px] text-red-300/80 mt-1">Efetue o pagamento antes que o código expire.</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-lg shadow-white/5 mt-2">
                  <img src={`data:image/jpeg;base64,${qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
                
                <div className="space-y-2 w-full">
                  <p className="text-gray-300 text-sm">Escaneie o QR Code ou use o Pix Copia e Cola:</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={qrCode} 
                      className="flex-1 bg-black/50 border border-gray-700 rounded-lg py-2 px-3 text-xs text-gray-400 focus:outline-none overflow-hidden text-ellipsis"
                    />
                    <Button 
                      variant="secondary" 
                      onClick={copyPixCode}
                      className="shrink-0 flex items-center gap-2"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="w-full flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-sm text-blue-400">Aguardando confirmação do pagamento...</span>
                </div>
              </div>
            )}

            {paymentStatus === 'paid' && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-1"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white">Pagamento Aprovado!</h3>
                <p className="text-gray-300 text-sm max-w-sm mx-auto">
                  Por favor, digite seu **ID do Dota 2 (ID de Amigo)** para podermos te adicionar e efetuar o envio do seu item.
                </p>

                <div className="w-full text-left space-y-2 mt-2">
                  <label className="block text-xs font-semibold text-zinc-400">ID do Dota 2</label>
                  <input
                    type="text"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 235480181"
                    className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Você pode encontrar esse ID dentro do Dota 2 na aba de amigos. Todas as informações do seu pedido estarão no seu perfil.
                  </p>
                </div>

                <Button 
                  onClick={async () => {
                    if (steamId.trim()) {
                      try {
                        if (user) {
                          await supabase
                            .from('users')
                            .update({ steam_id: steamId })
                            .eq('id', user.id);
                        }
                        if (orderId) {
                          await supabase
                            .from('orders')
                            .update({ steam_id: steamId })
                            .eq('id', orderId);
                        }
                        toast.success('ID do Dota 2 salvo com sucesso!');
                      } catch (err) {
                        console.error('Error saving Dota ID:', err);
                      }
                    }
                    setShowPixModal(false);
                    navigate('/perfil');
                  }}
                  className="w-full bg-white text-black hover:bg-gray-200 mt-4 py-6 text-base font-bold"
                >
                  Confirmar e Ver Perfil
                </Button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;