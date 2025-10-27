import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Zap, Gift, TrendingUp, Users, Package, Award, Loader2, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabaseServices } from '@/integrations/supabase/services';
import { Item } from '@/types/inventory';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '../components/Navigation';
import { useToast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/ui/image-with-fallback';

// Função para mapear raridade para cor do badge
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'comum':
      return 'bg-gray-500';
    case 'persona':
      return 'bg-blue-500';
    case 'arcana':
      return 'bg-purple-500';
    case 'immortal':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const HomePage: React.FC = () => {
  // Removido carregamento global de itens para otimizar primeira visita
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [highlightedItems, setHighlightedItems] = useState<Item[]>([]);
  const [currentHighlightedIndex, setCurrentHighlightedIndex] = useState(0);
  const [loadingHighlighted, setLoadingHighlighted] = useState(true);
  const [highlightedError, setHighlightedError] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para lidar com compra
  const handleBuy = () => {
    setShowWhatsAppModal(true);
  };

  // Função para redirecionar para WhatsApp
  const handleWhatsAppRedirect = () => {
    window.open('https://wa.link/196mnu', '_blank');
    setShowWhatsAppModal(false);
  };
  
  // Pegar apenas os primeiros 3 itens destacados para exibir
  const featuredItems = highlightedItems.slice(0, 3);

  // Buscar itens destacados
  useEffect(() => {
    const fetchHighlightedItems = async () => {
      try {
        setLoadingHighlighted(true);
        const highlighted = await supabaseServices.items.getHighlighted(12);
        setHighlightedItems(highlighted);
        setCurrentHighlightedIndex(0);
      } catch (error) {
        console.error('Erro ao buscar itens destacados:', error);
        setHighlightedError('Erro ao buscar itens destacados');
      } finally {
        setLoadingHighlighted(false);
      }
    };

    fetchHighlightedItems();
  }, []);

  // Funções para navegação dos slides
  const nextHighlightedItem = () => {
    if (highlightedItems.length > 1) {
      setCurrentHighlightedIndex((prev) => 
        prev === highlightedItems.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevHighlightedItem = () => {
    if (highlightedItems.length > 1) {
      setCurrentHighlightedIndex((prev) => 
        prev === 0 ? highlightedItems.length - 1 : prev - 1
      );
    }
  };

  const currentHighlightedItem = highlightedItems[currentHighlightedIndex] || null;

  const stats = [
    { label: "Itens Disponíveis", value: "1.146.416", icon: Package },
    { label: "Itens Vendidos", value: "1.098.620", icon: ShoppingCart },
    { label: "Clientes Satisfeitos", value: "302.489", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <motion.section 
         className="relative overflow-hidden bg-gradient-cyber"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-6 py-24">
          <motion.div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  A Skin Certa no Lugar Certo
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Colecione, venda ou troque skins lendárias com segurança e estilo. Entre no mundo das skins épicas de Dota 2.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                   <Link to="/catalog">
                     <Button size="lg" className="bg-gradient-gaming text-lg px-8 py-6 shadow-glow">
                       <ShoppingCart className="mr-2 h-5 w-5" />
                       Explorar Catálogo
                     </Button>
                 </Link>
               </motion.div>
               <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/quero-vender">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 glass-card"
                      aria-label="Ir para Quero Vender"
                      title="Quero Vender"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Vender Itens
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Subscriber Benefits */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              >
                <div className="flex flex-wrap gap-3">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                     <Badge className="glass-card bg-cyan-400/20 text-cyan-400 border-cyan-400/30 shadow-glow">
                       + de 30k inscritos
                     </Badge>
                   </motion.div>
                   <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                     <Badge className="glass-card bg-cyan-400/20 text-cyan-400 border-cyan-400/30 shadow-glow">
                       Atendimento exclusivo
                     </Badge>
                   </motion.div>
                </div>
              </motion.div>
            </div>

            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <div className="relative z-10">
                {loadingHighlighted ? (
                  <div className="w-full max-w-md mx-auto h-64 rounded-2xl shadow-2xl bg-muted/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : currentHighlightedItem ? (
                  <div className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-3 border border-white/20 backdrop-blur-sm relative overflow-hidden">
                    {/* Background decorativo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl" />
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-lg" />
                    
                    <div className="relative z-10 space-y-3">
                      {/* Imagem do item - DESTAQUE PRINCIPAL ocupando quase todo o card */}
                      <div className="relative group">
                        {currentHighlightedItem.image_url ? (
                          <div className="relative">
                            <ImageWithFallback
                              src={currentHighlightedItem.image_url}
                              alt={currentHighlightedItem.name}
                              className="w-full h-64 object-cover rounded-xl border-2 border-white/30 shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-3xl"
                              imgProps={{ decoding: 'async', loading: 'eager', fetchpriority: 'high' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl pointer-events-none" />
                            <div className="absolute inset-0 ring-2 ring-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            {/* Header com badge e estrela sobreposto na imagem */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                              <Badge className={`${getRarityColor(currentHighlightedItem.rarity)} text-white text-xs px-2 py-1 shadow-lg backdrop-blur-sm`}>
                                {currentHighlightedItem.rarity}
                              </Badge>
                              <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-medium">Destaque</span>
                              </div>
                            </div>
                            {/* Botões de navegação - apenas se houver mais de 1 item */}
                            {highlightedItems.length > 1 && (
                              <>
                                <button
                                  onClick={prevHighlightedItem}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-all duration-300 group/nav"
                                >
                                  <ChevronLeft className="h-4 w-4 text-white group-hover/nav:scale-110 transition-transform" />
                                </button>
                                <button
                                  onClick={nextHighlightedItem}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-all duration-300 group/nav"
                                >
                                  <ChevronRight className="h-4 w-4 text-white group-hover/nav:scale-110 transition-transform" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center group hover:border-gray-400/50 transition-colors relative">
                            <Package className="h-16 w-16 text-gray-400 group-hover:text-gray-300 transition-colors mb-2" />
                            <span className="text-gray-400 text-sm">Sem imagem</span>
                            
                            {/* Header para estado sem imagem */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                              <Badge className={`${getRarityColor(currentHighlightedItem.rarity)} text-white text-xs px-2 py-1 shadow-lg backdrop-blur-sm`}>
                                {currentHighlightedItem.rarity}
                              </Badge>
                              <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-medium">Destaque</span>
                              </div>
                            </div>
                            
                            {/* Botões de navegação - apenas se houver mais de 1 item */}
                            {highlightedItems.length > 1 && (
                              <>
                                <button
                                  onClick={prevHighlightedItem}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-all duration-300 group/nav"
                                >
                                  <ChevronLeft className="h-4 w-4 text-white group-hover/nav:scale-110 transition-transform" />
                                </button>
                                <button
                                  onClick={nextHighlightedItem}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-all duration-300 group/nav"
                                >
                                  <ChevronRight className="h-4 w-4 text-white group-hover/nav:scale-110 transition-transform" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Informações do item - layout horizontal compacto */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{currentHighlightedItem.name}</h3>
                          <p className="text-xs text-gray-300 opacity-80">{currentHighlightedItem.hero_name}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">
                              R$ {currentHighlightedItem.price?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Est: {currentHighlightedItem.current_stock || currentHighlightedItem.initial_stock || 0}
                            </div>
                          </div>
                          
                          {/* Botão de ação compacto */}
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-gaming text-white px-2 py-2 rounded-lg text-xs font-medium shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                          >
                            <ShoppingCart className="h-3 w-3" />
                          </motion.button>
                        </div>
                        </div>
                      </div>
                      
                      {/* Indicadores visuais - dots para navegação */}
                      {highlightedItems.length > 1 && (
                        <div className="flex justify-center pt-3">
                          <div className="flex space-x-2">
                            {highlightedItems.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentHighlightedIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  index === currentHighlightedIndex 
                                    ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50' 
                                    : 'bg-white/30 hover:bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                ) : (
                  <div className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl bg-gradient-to-br from-gray-900/30 to-gray-700/30 p-4 border border-white/20 backdrop-blur-sm relative overflow-hidden">
                    {/* Background decorativo para estado vazio */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-2xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-400/10 to-gray-500/10 rounded-full blur-xl" />
                    
                    <div className="relative z-10 text-center space-y-3">
                      <div className="relative">
                        <Package className="h-12 w-12 text-gray-400 mx-auto" />
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 rounded-full" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Nenhum Item em Destaque</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">Marque um item com estrela para destacá-lo aqui!</p>
                      </div>
                      
                      {/* Indicadores visuais - dots para navegação */}
                      {highlightedItems.length > 1 && (
                        <div className="flex justify-center pt-2">
                          <div className="flex space-x-1">
                            {highlightedItems.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentHighlightedIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  index === currentHighlightedIndex 
                                    ? 'bg-cyan-400 scale-125' 
                                    : 'bg-gray-500/50 hover:bg-gray-400/70'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="absolute -top-4 -right-4 bg-gradient-gaming rounded-full p-3">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-3xl" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      

      {/* Featured Items */}
      <motion.section 
        className="py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center space-y-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Itens em Destaque
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Os itens mais populares e procurados da nossa coleção
            </p>
          </motion.div>

          {loadingHighlighted ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando itens...</span>
            </div>
          ) : highlightedError ? (
            <div className="text-center py-12">
              <p className="text-red-500">{highlightedError}</p>
            </div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {featuredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="group bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="relative overflow-hidden rounded-lg aspect-[2/1]">
                      <motion.div 
                        whileHover={{ scale: 1.1 }} 
                        transition={{ duration: 0.3 }} 
                        onClick={() => navigate(`/item/${item.id}`)}
                        className="w-full h-full"
                      >
                        <ImageWithFallback 
                          src={item.image_url || ''} 
                          alt={item.name} 
                          className="w-full h-full object-cover bg-muted cursor-pointer" 
                          fallbackSrc="/placeholder.svg"
                          imgProps={{ decoding: 'async', loading: 'eager', fetchpriority: 'high' }}
                        />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <Badge 
                        className={`absolute bottom-2 left-2 ${getRarityColor(item.rarity)} text-white`}
                      >
                        {item.rarity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                       <h3 className="font-semibold text-lg">{item.name}</h3>
                       <p className="text-muted-foreground">{item.hero_name}</p>
                     </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <motion.span 
                            className="text-2xl font-bold text-primary"
                            whileHover={{ scale: 1.05 }}
                          >
                             R$ {parseFloat(item.price.toString()).toFixed(2)}
                           </motion.span>
                        </div>
                        <motion.div 
                          className="flex items-center gap-1"
                          whileHover={{ scale: 1.02 }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              whileHover={{ scale: 1.2, rotate: 15 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </motion.div>
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
                        </motion.div>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="sm" className="bg-gradient-gaming shadow-gaming-glow" onClick={(e) => { e.stopPropagation(); handleBuy(); }}>
                          <motion.div
                            className="flex items-center"
                            whileHover={{ x: 2 }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Comprar
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/catalog">
                <Button variant="outline" size="lg" className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300">
                  Ver Todos os Itens
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Promotional Section */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-red-500/10 to-orange-500/10"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center space-y-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Gift className="h-8 w-8 text-red-500" />
              Sobre Nós
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ofertas limitadas com descontos imperdíveis
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0 }
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.02, rotateY: 2 }}
            >
              <Card className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-6 w-6 text-emerald-500" />
                    Linktr.ee
                  </CardTitle>
                  <CardDescription>
                    Acesse todas as nossas redes e links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <a href="https://linktr.ee/dotaplaybrasil" target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300">
                        <motion.span whileHover={{ x: 2 }}>
                          Abrir Linktr.ee
                        </motion.span>
                      </Button>
                    </a>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: 30 },
                visible: { opacity: 1, x: 0 }
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.02, rotateY: -2 }}
            >
              <Card className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-blue-500" />
                    Sobre
                  </CardTitle>
                  <CardDescription>
                    Saiba mais sobre a nossa comunidade e o projeto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/sobre">
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300">
                        <motion.span whileHover={{ x: 2 }}>
                          Abrir página Sobre
                        </motion.span>
                      </Button>
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white drop-shadow-lg">
                  Dota Play Brasil
                </h3>
              </div>
              <p className="text-muted-foreground">
                A plataforma mais confiável para trading de itens de Dota 2 no Brasil.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Links Rápidos</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Catálogo</div>
                <div>Sobre</div>
                <div>Como Funciona</div>
                <div>Suporte</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Segurança</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Pagamento Seguro</div>
                <div>Proteção ao Comprador</div>
                <div>Verificação de Itens</div>
                <div>Suporte 24/7</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Dotaplaybrasil@gmail.com</div>
                <div>WhatsApp: 11 99609-8995</div>
                <div>Discord: DotaPlay#1234</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Dota Play Brasil. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal do WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative"
          >
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">
                Redirecionamento para WhatsApp
              </h3>
              
              <p className="text-gray-600">
                Você será redirecionado para nosso atendimento via WhatsApp. Preferimos esse método para oferecer um atendimento mais personalizado e rápido.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleWhatsAppRedirect}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomePage;