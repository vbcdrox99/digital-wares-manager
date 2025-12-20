import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Star, Package, Eye, X, Info } from 'lucide-react';
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

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useItems();
  const { getRarityColor } = useRarities();
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
      {/* Navigation */}
      <Navigation />
      
      <div className="relative">
        {/* Background Gradients similar to RafflePage */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-blue-900/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="container mx-auto px-6 py-12 relative z-10">
            {/* Header com botão voltar */}
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
            {/* Imagem do Item */}
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
                    
                    {/* Badge de raridade */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge 
                            {...getBadgeStyleFromColor(getRarityColor(item.rarity), "shadow-lg backdrop-blur-md text-base px-3 py-1")}
                        >
                            {item.rarity}
                        </Badge>
                        {item.discount && item.discount > 0 && (
                        <Badge className="bg-red-600 text-white font-bold shadow-lg border-0 self-start">
                            -{item.discount}%
                        </Badge>
                        )}
                    </div>
                    
                    {/* Estrela se destacado */}
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

                {/* Blocos auxiliares */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estoque */}
                <Card className="bg-black/20 border-white/10 backdrop-blur-sm rounded-xl">
                    <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Disponibilidade
                    </h3>
                    </CardHeader>
                    <CardContent>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Em estoque:</span>
                        <span className="text-foreground font-semibold">
                        {item.current_stock} / {item.initial_stock}
                        </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                        className="bg-gradient-to-r from-primary/80 to-primary h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${Math.min((item.current_stock / item.initial_stock) * 100, 100)}%`
                        }}
                        />
                    </div>
                    </CardContent>
                </Card>

                {/* Seletor de Quantidade */}
                <Card className="bg-black/20 border-white/10 backdrop-blur-sm rounded-xl">
                    <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold text-foreground">Quantidade</h3>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center gap-4">
                        <Button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/10 hover:bg-white/5 h-8 w-8 p-0"
                        >
                        -
                        </Button>
                        <span className="text-foreground font-semibold text-xl w-8 text-center">
                        {quantity}
                        </span>
                        <Button
                        onClick={() => setQuantity(Math.min(item.current_stock, quantity + 1))}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-white/10 hover:bg-white/5 h-8 w-8 p-0"
                        disabled={quantity >= item.current_stock}
                        >
                        +
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
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

            {/* Informações do Item */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-8"
            >
                {/* Título e Preço */}
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

                {/* Botão de Compra */}
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

                <div className="flex items-center gap-4 text-sm text-muted-foreground p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        <span>Entrega via Trade Link</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div>
                        Garantia de 7 dias
                    </div>
                </div>
            </motion.div>
            </div>
            
            {/* Seção de Itens Relacionados */}
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

      {/* Modal do WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Finalizar Compra</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <p className="text-gray-300 mb-6">
                Você será redirecionado para nosso WhatsApp para combinar o pagamento e entrega do item <strong>{item.name}</strong>.
              </p>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowWhatsAppModal(false)} className="flex-1 border-white/10 hover:bg-white/5">
                  Cancelar
                </Button>
                <Button onClick={handleWhatsAppRedirect} className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none">
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

export default ItemDetailPage;