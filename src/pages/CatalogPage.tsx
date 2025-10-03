import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  Search, 
  Filter, 
  Package, 
  Loader2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';
import Navigation from '@/components/Navigation';

// Função para cores de raridade (mesma da HomePage)
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'comum':
      return 'bg-gray-500/80 border-gray-400/50';
    case 'persona':
      return 'bg-blue-500/80 border-blue-400/50';
    case 'arcana':
      return 'bg-purple-500/80 border-purple-400/50';
    case 'immortal':
      return 'bg-yellow-500/80 border-yellow-400/50';
    default:
      return 'bg-gray-500/80 border-gray-400/50';
  }
};

const CatalogPage: React.FC = () => {
  const { items, loading, error } = useItems();
  const [filteredItems, setFilteredItems] = useState(items);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Filtrar e ordenar itens
  useEffect(() => {
    let filtered = [...items];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hero_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por raridade
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === selectedRarity);
    }

    // Filtro por faixa de preço
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'low':
          filtered = filtered.filter(item => parseFloat(item.price.toString()) < 25);
          break;
        case 'medium':
          filtered = filtered.filter(item => {
            const price = parseFloat(item.price.toString());
            return price >= 25 && price <= 100;
          });
          break;
        case 'high':
          filtered = filtered.filter(item => parseFloat(item.price.toString()) > 100);
          break;
      }
    }

    // Ordenação
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price.toString()) - parseFloat(a.price.toString()));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedRarity, sortBy, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRarity('all');
    setSortBy('newest');
    setPriceRange('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section do Catálogo */}
      <motion.section 
        className="relative overflow-hidden bg-gradient-cyber py-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-6">
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Catálogo Completo
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explore nossa coleção completa de skins lendárias de Dota 2. Encontre o item perfeito para sua coleção.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{items.length} itens disponíveis</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Verificados e autênticos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Filtros e Controles */}
      <motion.section 
        className="py-8 bg-muted/30 border-b border-border/50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Buscar por nome ou herói..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duration-300 focus:outline-none focus:ring-0"
                />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-40 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duration-300 focus:outline-none focus:ring-0">
                  <SelectValue placeholder="Raridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="comum">Comum</SelectItem>
                  <SelectItem value="persona">Persona</SelectItem>
                  <SelectItem value="arcana">Arcana</SelectItem>
                  <SelectItem value="immortal">Immortal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duration-300 focus:outline-none focus:ring-0">
                  <SelectValue placeholder="Preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Até R$ 25</SelectItem>
                  <SelectItem value="medium">R$ 25 - R$ 100</SelectItem>
                  <SelectItem value="high">Acima de R$ 100</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duration-300 focus:outline-none focus:ring-0">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="price-low">Menor preço</SelectItem>
                  <SelectItem value="price-high">Maior preço</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Modo de visualização */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Limpar filtros */}
              {(searchTerm || selectedRarity !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 focus:bg-white/10 focus:border-white/30 transition-all duration-300 focus:outline-none focus:ring-0">
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}
            </span>
          </div>
        </div>
      </motion.section>

      {/* Grid de Itens */}
      <motion.section 
        className="py-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Carregando catálogo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Erro ao carregar itens</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-24">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum item encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou buscar por outros termos.
              </p>
              <Button onClick={clearFilters} variant="outline" className="glass-card">
                Limpar filtros
              </Button>
            </div>
          ) : (
            <motion.div 
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={`/item/${item.id}`} className="block">
                    <Card className={`group bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden cursor-pointer ${
                       viewMode === 'list' ? 'flex flex-row' : ''
                     }`}>
                    <CardHeader className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''} pb-3`}>
                      <div className={`relative overflow-hidden rounded-lg aspect-[2/1]`}>
                        {item.image_url ? (
                          <motion.img 
                            src={item.image_url} 
                            alt={item.name}
                            className={`w-full h-full object-cover bg-muted`}
                            loading="lazy"
                            decoding="async"
                            fetchpriority="low"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center group-hover:border-gray-400/50 transition-colors`}>
                            <Package className="h-8 w-8 text-gray-400 group-hover:text-gray-300 transition-colors mb-2" />
                            <span className="text-gray-400 text-sm">Sem imagem</span>
                          </div>
                        )}
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
                    <CardContent className={`space-y-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                        <p className="text-muted-foreground">{item.hero_name}</p>
                      </div>
                      
                      <div className={`flex items-center justify-between ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <motion.span 
                              className="text-2xl font-bold text-primary"
                              whileHover={{ scale: 1.05 }}
                            >
                              R$ {parseFloat(item.price.toString()).toFixed(2)}
                            </motion.span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Estoque: {item.current_stock}
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
                              // Aqui você pode adicionar lógica de compra rápida se desejar
                            }}
                          >
                            <motion.div
                              className="flex items-center"
                              whileHover={{ x: 2 }}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </motion.div>
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Footer - mesmo da HomePage */}
      <footer className="bg-muted/50 border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
                  DOTA PLAY
                </h3>
              </div>
              <p className="text-muted-foreground">
                A plataforma mais confiável para trading de itens de Dota 2 no Brasil.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Links Rápidos</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/" className="block hover:text-foreground transition-colors">Início</Link>
                <Link to="/catalog" className="block hover:text-foreground transition-colors">Catálogo</Link>
                <div>Sobre</div>
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
                <div>suporte@dotaplay.com.br</div>
                <div>WhatsApp: (11) 99999-9999</div>
                <div>Discord: DotaPlay#1234</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Dota Play Brasil. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CatalogPage;