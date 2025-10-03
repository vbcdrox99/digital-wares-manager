import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Star, Package, Shield, Truck, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useItems } from '../hooks/useItems';
import { Item } from '../types/inventory';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useItems();
  const [item, setItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    if (!loading && id) {
      const foundItem = items.find(item => item.id === id);
      setItem(foundItem ? foundItem : null);
      setIsLoading(false);
    } else if (!loading && items.length === 0) {
      setIsLoading(false);
    }
  }, [id, items, loading]);

  const handleBuy = () => {
    if (!item) return;
    
    if (item.current_stock < quantity) {
      alert('Quantidade indisponível em estoque!');
      return;
    }
    
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppRedirect = () => {
    window.open('https://wa.link/196mnu', '_blank');
    setShowWhatsAppModal(false);
  };
  
  const getRelatedItems = () => {
    if (!item || !items.length) return [];
    return items
      .filter(i => i.id !== item.id && (i.rarity === item.rarity || i.hero_name === item.hero_name))
      .slice(0, 4);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'comum':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'persona':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'arcana':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'immortal':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Item não encontrado</h1>
          <Button onClick={() => navigate('/catalog')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Navigation */}
      <Navigation />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header com botão voltar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/catalog')}
            variant="ghost"
            className="text-white hover:bg-white/10 mb-4 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Imagem do Item */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative aspect-[2/1] overflow-hidden">
                  {item.image_url ? (
                    <motion.img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      decoding="async"
                      fetchpriority="high"
                      loading="eager"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center group-hover:border-gray-400/50 transition-colors">
                      <Package className="h-24 w-24 text-gray-400 group-hover:text-gray-300 transition-colors mb-4" />
                      <span className="text-gray-400 text-lg">Sem imagem</span>
                    </div>
                  )}
                  
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  {/* Badge de raridade */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getRarityColor(item.rarity)} border`}>
                      {item.rarity}
                    </Badge>
                  </div>
                  
                  {/* Estrela se destacado */}
                  {item.highlighted && (
                    <div className="absolute top-4 right-4">
                      <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blocos auxiliares abaixo da imagem para preencher a coluna e evitar espaço vazio */}
            <div className="mt-6 space-y-6">
              {/* Estoque */}
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Disponibilidade
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Em estoque:</span>
                    <span className="text-white font-semibold">
                      {item.current_stock} / {item.initial_stock}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(item.current_stock / item.initial_stock) * 100}%`
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seletor de Quantidade */}
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white">Quantidade</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold text-xl w-12 text-center">
                      {quantity}
                    </span>
                    <Button
                      onClick={() => setQuantity(Math.min(item.current_stock, quantity + 1))}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={quantity >= item.current_stock}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    Total: ${(item.price * quantity).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Informações do Item */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Título e Preço */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{item.name}</h1>
              {item.hero_name && (
                <p className="text-xl text-purple-300 mb-4">{item.hero_name}</p>
              )}
              <div className="flex items-center gap-4">
                <motion.span 
                  className="text-3xl font-bold text-primary"
                  whileHover={{ scale: 1.05 }}
                >
                  R$ {parseFloat(item.price.toString()).toFixed(2)}
                </motion.span>
                <Badge className={`${getRarityColor(item.rarity)} border text-sm`}>
                  {item.rarity}
                </Badge>
              </div>
            </div>

            {/* Botão de Compra */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleBuy}
                disabled={item.current_stock === 0}
                className="w-full bg-gradient-gaming shadow-gaming-glow text-white font-semibold py-3 text-lg hover:shadow-gaming-glow-intense transition-all duration-300"
              >
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ x: 2 }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {item.current_stock === 0 ? 'Fora de Estoque' : 'Comprar Agora'}
                </motion.div>
              </Button>
            </motion.div>

            {/* Informações Adicionais */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white/80 text-sm">Garantia</p>
                  <p className="text-white font-semibold">30 dias</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <Truck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white/80 text-sm">Entrega</p>
                  <p className="text-white font-semibold">Imediata</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
        
        {/* Seção de Itens Relacionados */}
        {getRelatedItems().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Itens Relacionados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getRelatedItems().map((relatedItem, index) => (
                <motion.div
                  key={relatedItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={`/item/${relatedItem.id}`} className="block">
                    <Card className="group bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="relative overflow-hidden rounded-lg">
                          <div className="aspect-[2/1] relative overflow-hidden rounded-lg">
                            {relatedItem.image_url ? (
                              <motion.img 
                                src={relatedItem.image_url} 
                                alt={relatedItem.name}
                                className="w-full h-full object-cover bg-muted"
                                loading="lazy"
                                decoding="async"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center group-hover:border-gray-400/50 transition-colors">
                                <Package className="h-8 w-8 text-gray-400 group-hover:text-gray-300 transition-colors mb-2" />
                                <span className="text-gray-400 text-sm">Sem imagem</span>
                              </div>
                            )}
                          </div>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          />
                          <Badge 
                            className={`absolute bottom-2 left-2 ${getRarityColor(relatedItem.rarity)} text-white`}
                          >
                            {relatedItem.rarity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1 text-white">{relatedItem.name}</h3>
                          <p className="text-muted-foreground">{relatedItem.hero_name}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <motion.span 
                              className="text-xl font-bold text-primary"
                              whileHover={{ scale: 1.05 }}
                            >
                              R$ {parseFloat(relatedItem.price.toString()).toFixed(2)}
                            </motion.span>
                            <div className="text-xs text-muted-foreground">
                              Estoque: {relatedItem.current_stock}
                            </div>
                          </div>
                          
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => e.preventDefault()}
                          >
                            <Button 
                              size="sm" 
                              className="bg-gradient-gaming shadow-gaming-glow"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <motion.div
                                className="flex items-center"
                                whileHover={{ x: 2 }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </motion.div>
                            </Button>
                          </motion.div>
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

      {/* Modal do WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 max-w-md w-full border border-white/20 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Redirecionamento</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                </svg>
              </div>
              <p className="text-white/80 mb-2">
                Você será redirecionada para nosso atendimento no WhatsApp.
              </p>
              <p className="text-white/60 text-sm">
                Preferimos finalizar as compras por lá para oferecer um atendimento mais personalizado e garantir que você tenha a melhor experiência possível!
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleWhatsAppRedirect}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Ir para WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;