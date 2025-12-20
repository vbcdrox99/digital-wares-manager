import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeroCombobox } from '@/components/HeroCombobox';
import { 
  Star, 
  Search, 
  Filter, 
  Package, 
  Loader2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';
import { useRarities } from '@/hooks/useRarities';
import { getBadgeStyleFromColor } from '@/utils/rarityUtils';
import ImageWithFallback from '@/components/ui/image-with-fallback';
// Removido lógica de Sorteio Premium do Catálogo
import Navigation from '@/components/Navigation';

const CatalogPage: React.FC = () => {
  const { items, loading, error } = useItems();
  const { rarities, getRarityColor } = useRarities();
  const [filteredItems, setFilteredItems] = useState(items);
  const [nameSearch, setNameSearch] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<string>('all');
  // Lógica de Sorteio Premium movida para página de Admin

  // Filtrar e ordenar itens
  useEffect(() => {
    let filtered = [...items];

    // Filtro por nome
    if (nameSearch) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }

    // Filtro por herói
    if (heroSearch) {
      filtered = filtered.filter(item => 
        item.hero_name.toLowerCase() === heroSearch.toLowerCase()
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
  }, [items, nameSearch, heroSearch, selectedRarity, sortBy, priceRange]);

  const clearFilters = () => {
    setNameSearch('');
    setHeroSearch('');
    setSelectedRarity('all');
    setSortBy('newest');
    setPriceRange('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Filtros e Controles */}
      <motion.section 
        className="py-8 bg-gradient-to-b from-background to-muted/20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="container mx-auto px-6">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl space-y-6">
            
            {/* Header dos Filtros */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="h-5 w-5" />
                <h2 className="font-semibold text-lg tracking-wide">Filtros Avançados</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              
              {/* Filtro: Nome */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Nome
                </label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <Input
                    placeholder="Buscar item..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10 rounded-lg focus:bg-black/40 focus:border-primary/50 transition-all duration-300 h-10"
                  />
                </div>
              </div>

              {/* Filtro: Herói */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Herói</label>
                <HeroCombobox 
                  value={heroSearch} 
                  onChange={setHeroSearch} 
                  className="w-full bg-black/20 border-white/10 rounded-lg hover:bg-black/30 focus:border-primary/50 transition-all duration-300 h-10"
                />
              </div>

              {/* Filtro: Raridade */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raridade</label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger className="bg-black/20 border-white/10 rounded-lg hover:bg-black/30 focus:border-primary/50 transition-all duration-300 h-10">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {rarities.map((rarity) => (
                      <SelectItem key={rarity.id} value={rarity.name}>
                        <span className="capitalize">{rarity.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro: Preço */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="bg-black/20 border-white/10 rounded-lg hover:bg-black/30 focus:border-primary/50 transition-all duration-300 h-10">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="low">Até R$ 25</SelectItem>
                    <SelectItem value="medium">R$ 25 - R$ 100</SelectItem>
                    <SelectItem value="high">Acima de R$ 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ordenar</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-black/20 border-white/10 rounded-lg hover:bg-black/30 focus:border-primary/50 transition-all duration-300 h-10">
                    <SelectValue placeholder="Recentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigos</SelectItem>
                    <SelectItem value="price-low">Menor preço</SelectItem>
                    <SelectItem value="price-high">Maior preço</SelectItem>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visualização e Limpar */}
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visualização</label>
                 <div className="flex gap-2">
                  <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/10 h-10">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {(nameSearch || heroSearch || selectedRarity !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
                    <Button 
                      variant="ghost" 
                      onClick={clearFilters} 
                      className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-10 transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                 </div>
              </div>

            </div>
          </div>

          {/* Painel de seleção de Itens Premium removido (agora no Admin) */}
        </div>
      </motion.section>

      {/* Grid de Itens */}
      <motion.section 
        className="py-12 bg-gradient-to-b from-muted/20 to-background"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Carregando catálogo...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center py-24">
              <div className="bg-black/40 backdrop-blur-md border border-red-500/20 rounded-xl p-8 text-center max-w-md">
                <Package className="h-16 w-16 text-red-500/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-red-400">Erro ao carregar itens</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex justify-center py-24">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center max-w-md">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum item encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
                <Button onClick={clearFilters} variant="outline" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                  Limpar filtros
                </Button>
              </div>
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
                    <Card className={`group bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-black/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer h-full ${
                       viewMode === 'list' ? 'flex flex-row' : ''
                     }`}>
                    <CardHeader className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''} p-0`}>
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'h-full' : 'aspect-[16/10]'}`}>
                        {item.image_url ? (
                          <ImageWithFallback 
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center group-hover:from-gray-800 group-hover:to-gray-700 transition-colors`}>
                            <Package className="h-8 w-8 text-gray-600 group-hover:text-gray-500 transition-colors mb-2" />
                            <span className="text-gray-600 text-sm">Sem imagem</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <Badge 
                            {...getBadgeStyleFromColor(getRarityColor(item.rarity), "shadow-lg backdrop-blur-md")}
                          >
                            {item.rarity}
                          </Badge>
                          {item.is_partner && (
                            <Badge
                              className="bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-md shadow-lg"
                            >
                              Parceiro
                            </Badge>
                          )}
                        </div>

                        {item.discount && item.discount > 0 && (
                          <Badge
                            className="absolute top-2 right-2 bg-red-600 text-white font-bold shadow-lg border-0"
                          >
                            -{item.discount}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className={`p-5 space-y-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="uppercase tracking-wider text-xs font-medium bg-white/5 px-2 py-0.5 rounded text-gray-400">
                            {item.hero_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center justify-between pt-2 border-t border-white/5 ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                        <div className="space-y-0.5">
                          <div className="flex flex-col items-start">
                            {item.discount && item.discount > 0 ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  R$ {parseFloat(item.price.toString()).toFixed(2)}
                                </span>
                                <span className="text-xl font-bold text-green-400 shadow-green-900/20">
                                  R$ {(item.price * (1 - item.discount / 100)).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-primary shadow-primary/20">
                                R$ {parseFloat(item.price.toString()).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.current_stock > 0 && (
                             <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                               Estoque: {item.current_stock}
                             </span>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="bg-white/5 hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-white/10 transition-all duration-300"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
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
    </div>
  );
};

export default CatalogPage;