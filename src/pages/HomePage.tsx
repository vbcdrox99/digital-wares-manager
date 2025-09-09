import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Zap, Gift, TrendingUp, Users, Package, Award, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';

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
  const { items, loading, error } = useItems();
  
  // Pegar apenas os primeiros 3 itens para exibir como destaque
  const featuredItems = items.slice(0, 3);

  const stats = [
    { label: "Itens Disponíveis", value: "1.146.416", icon: Package },
    { label: "Itens Vendidos", value: "1.098.620", icon: ShoppingCart },
    { label: "Clientes Satisfeitos", value: "302.489", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
            Dota Play Brasil
          </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Início
              </Link>
              <Link to="/catalog" className="text-muted-foreground hover:text-primary transition-colors">
                Catálogo
              </Link>
              <Link to="/promotions" className="text-muted-foreground hover:text-primary transition-colors">
                Promoções
              </Link>
              <Link to="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                Admin
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Login
              </Button>
              <Button size="sm" className="bg-gradient-gaming">
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Compre e venda itens de
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {" "}Dota 2
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  A maior plataforma de trading de itens do Brasil. Seguro, rápido e confiável.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-gaming text-lg px-8 py-6">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Explorar Catálogo
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
                  <Zap className="mr-2 h-5 w-5" />
                  Vender Itens
                </Button>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Métodos de pagamento aceitos:</p>
                <div className="flex flex-wrap gap-3">
                  {['PIX', 'Cartão', 'PayPal', 'Bitcoin'].map((method) => (
                    <Badge key={method} variant="secondary" className="bg-white/10 text-white border-white/20">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/placeholder.svg" 
                  alt="Featured Item" 
                  className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
                />
                <div className="absolute -top-4 -right-4 bg-gradient-gaming rounded-full p-3">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-gaming rounded-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Itens em Destaque
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Os itens mais populares e procurados da nossa coleção
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando itens...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Erro ao carregar itens: {error}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="relative">
                      <img 
                         src={item.image_url || "/placeholder.svg"} 
                         alt={item.name}
                         className="w-full h-48 object-cover rounded-lg bg-muted"
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
                          <span className="text-2xl font-bold text-primary">
                             R$ {parseFloat(item.price.toString()).toFixed(2)}
                           </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
                        </div>
                      </div>
                      
                      <Button size="sm" className="bg-gradient-gaming">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Comprar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Ver Todos os Itens
            </Button>
          </div>
        </div>
      </section>

      {/* Promotional Section */}
      <section className="py-16 bg-gradient-to-r from-red-500/10 to-orange-500/10">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Gift className="h-8 w-8 text-red-500" />
              Promoções Especiais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ofertas limitadas com descontos imperdíveis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6 text-red-500" />
                  Flash Sale
                </CardTitle>
                <CardDescription>
                  Até 50% de desconto em itens selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-red-500 hover:bg-red-600">
                  Ver Ofertas
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-500" />
                  Novidades
                </CardTitle>
                <CardDescription>
                  Últimos itens adicionados ao catálogo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  Explorar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <div>Catálogo</div>
                <div>Promoções</div>
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

export default HomePage;