import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabaseServices } from '@/integrations/supabase/services';
import { Item } from '@/types/inventory';
import { 
  Home, 
  Gamepad2, 
  ShoppingBag, 
  LogOut, 
  Search, 
  Wallet,
  ChevronRight,
  Sparkles,
  Zap,
  Ticket,
  Info,
  Store,
  HelpCircle,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Usaremos fontes importadas no index.html: Outfit (Heading) e Space Grotesk (Body/Tech)
// Definindo estilos inline para fontes como utilitários caso não estejam no tailwind
const fontHeading = { fontFamily: "'Outfit', sans-serif" };
const fontTech = { fontFamily: "'Space Grotesk', sans-serif" };

// Cores baseadas na logo (Cyan, Magenta, Dark Blue)
// Dark Premium background

const MOCK_ITEMS = [
  {
    id: 1,
    name: 'Fiery Soul of the Slayer',
    hero: 'Lina',
    rarity: 'Arcana',
    price: 185.50,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsQFVcKgVX77S8Klw50vfBfz9B4Ny-m9mZmvSmZb-DxT1SscQi2rmUooijjgDk-ENkYWvzIY_AcFVtYQrRqAK8kP2cQlo/360fx360f',
    seller: { name: 'PlayerOne', avatar: '' }
  },
  {
    id: 2,
    name: 'Manifold Paradox',
    hero: 'Phantom Assassin',
    rarity: 'Arcana',
    price: 210.00,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsV1R9IwpS_7P1IFAwi_bHfzxL09Wzw5eZkvH3Pr7Cl2lfvZEjiO3Aoonym1IwrUFoZ32mINfAdFNpg11tYQoGBA/360fx360f',
    seller: { name: 'SlayerBR', avatar: '' }
  },
  {
    id: 3,
    name: 'Bladeform Legacy',
    hero: 'Juggernaut',
    rarity: 'Arcana',
    price: 195.00,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsRVx4MwFO57-1JgVl1-aYfz9R-t6wwoyOlPH1ZLnCwTkHucEg3uvHoo2g0FHg_UVuam-mcIWHdVdrYlvXqFjrx-_K8Wd1gQ/360fx360f',
    seller: { name: 'SwordMaster', avatar: '' }
  },
  {
    id: 4,
    name: 'Mace of Aeons',
    hero: 'Faceless Void',
    rarity: 'Immortal',
    price: 1450.00,
    image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsVFx5KAVo5PSkKVhx0vXOfThV4d-0yIqclvbyMOqGxWsFuZch2bCWpY2hilC3qEU-ZWmgdo_AelI5YlvRqVm7xfCK-VnS4g/360fx360f',
    seller: { name: 'TimeLord', avatar: '' }
  }
];

const CATEGORIES = [
  'Todos', 'Arcanas', 'Imortais', 'Míticos', 'Entregadores', 'Sentinelas'
];

export default function HomeTestPage() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const NAV_LINKS = [
    { icon: <Home />, label: 'Início', path: '/' },
    { icon: <ShoppingBag />, label: 'Catálogo', path: '/catalog' },
    { icon: <Ticket />, label: 'Sorteio', path: '/sorteio' },
    { icon: <Store />, label: 'Quero Vender', path: '/quero-vender' },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // Pega 8 itens em destaque (ou recentes)
        const fetchedItems = await supabaseServices.items.getHighlighted(8);
        setItems(fetchedItems);
      } catch (error) {
        console.error('Erro ao buscar itens:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex overflow-hidden">
      {/* SIDEBAR (Dark Premium / Neobrutalism misturado) */}
      <nav 
        className={`border-r border-[#1C2333] bg-[#0A0D14]/80 backdrop-blur-xl flex flex-col py-8 justify-between sticky top-0 h-screen z-20 transition-all duration-300 ${
          isSidebarExpanded ? 'w-64 items-start px-6' : 'w-20 lg:w-24 items-center px-0'
        }`}
      >
        <div className={`flex flex-col gap-10 w-full ${!isSidebarExpanded && 'items-center'}`}>
          {/* Logo Minimizer / Expander */}
          <div className={`flex items-center gap-4 ${isSidebarExpanded ? 'w-full' : ''}`}>
            <div 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#FF3B8A] to-[#00E5FF] p-0.5 shadow-[0_0_20px_rgba(0,229,255,0.2)] cursor-pointer hover:shadow-[0_0_30px_rgba(255,59,138,0.4)] transition-all"
            >
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <Menu className="w-6 h-6 text-white" />
              </div>
            </div>
            {isSidebarExpanded && (
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8892B0]" style={fontHeading}>
                Dota Play
              </span>
            )}
          </div>

          {/* Links Principais */}
          <div className="flex flex-col gap-4 w-full">
            {NAV_LINKS.map((link, idx) => (
              <Link 
                to={link.path} 
                key={idx}
                className={`flex items-center gap-4 rounded-xl transition-all h-12 ${
                  isSidebarExpanded ? 'px-4 hover:bg-[#151B2B] w-full' : 'justify-center w-12 mx-auto hover:bg-[#151B2B]'
                }`}
              >
                <div className="text-[#8892B0] hover:text-white flex-shrink-0">
                  {React.cloneElement(link.icon as React.ReactElement, { className: 'w-5 h-5' })}
                </div>
                {isSidebarExpanded && (
                  <span className="text-[#8892B0] hover:text-white font-medium" style={fontTech}>{link.label}</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-4 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <div className="flex flex-col w-full gap-1">
            <Link 
              to="/faq"
              className={`flex items-center gap-4 rounded-xl transition-all h-10 ${
                isSidebarExpanded ? 'px-4 hover:bg-[#151B2B] w-full' : 'justify-center w-10 mx-auto hover:bg-[#151B2B]'
              }`}
            >
              <div className="text-[#8892B0]/60 hover:text-[#8892B0] flex-shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              {isSidebarExpanded && (
                <span className="text-[#8892B0]/60 hover:text-[#8892B0] text-sm" style={fontTech}>FAQ</span>
              )}
            </Link>
            
            <Link 
              to="/sobre"
              className={`flex items-center gap-4 rounded-xl transition-all h-10 ${
                isSidebarExpanded ? 'px-4 hover:bg-[#151B2B] w-full' : 'justify-center w-10 mx-auto hover:bg-[#151B2B]'
              }`}
            >
              <div className="text-[#8892B0]/60 hover:text-[#8892B0] flex-shrink-0">
                <Info className="w-4 h-4" />
              </div>
              {isSidebarExpanded && (
                <span className="text-[#8892B0]/60 hover:text-[#8892B0] text-sm" style={fontTech}>Sobre</span>
              )}
            </Link>
          </div>

          <div className="w-full h-[1px] bg-[#1C2333]/50 my-2" />

          <div className={`flex items-center gap-4 ${isSidebarExpanded ? 'px-4' : ''}`}>
            <Avatar className="w-10 h-10 border-2 border-[#1C2333] cursor-pointer hover:border-[#00E5FF] transition-colors flex-shrink-0">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-[#151B2B] text-[#00E5FF]">DP</AvatarFallback>
            </Avatar>
            {isSidebarExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate" style={fontTech}>DotaPlayer</span>
                <span className="text-xs text-[#8892B0] truncate" style={fontTech}>Ver Perfil</span>
              </div>
            )}
          </div>
          
          <button className={`flex items-center gap-4 rounded-xl h-12 transition-all ${
            isSidebarExpanded ? 'px-4 hover:bg-[#151B2B] w-full text-left' : 'justify-center w-12 mx-auto hover:bg-[#151B2B]'
          }`}>
            <div className="text-[#8892B0] hover:text-[#FF3B8A] flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            {isSidebarExpanded && (
              <span className="text-[#8892B0] hover:text-[#FF3B8A] font-medium" style={fontTech}>Sair</span>
            )}
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
        {/* Glow de fundo */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00E5FF]/10 blur-[150px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#FF3B8A]/10 blur-[150px] pointer-events-none" />

        {/* TOP BAR */}
        <header className="px-8 lg:px-12 py-8 flex items-center justify-between z-10 sticky top-0 bg-[#0B0F19]/60 backdrop-blur-md border-b border-[#1C2333]/50">
          <div className="flex items-center gap-4 bg-[#151B2B] border border-[#1C2333] rounded-full px-6 py-3 w-full max-w-md focus-within:border-[#00E5FF]/50 transition-colors">
            <Search className="w-5 h-5 text-[#8892B0]" />
            <input 
              type="text" 
              placeholder="Rush mid atrás de skins, heróis, raridades..." 
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-[#8892B0]"
              style={fontTech}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button className="rounded-full bg-[#151B2B] hover:bg-[#1C2333] border border-[#1C2333] text-white px-6">
              <Wallet className="w-4 h-4 mr-2 text-[#00E5FF]" />
              <span style={fontTech}>Conectar Steam</span>
            </Button>
          </div>
        </header>

        {/* BENTO GRID DASHBOARD */}
        <div className="px-8 lg:px-12 py-8 flex flex-col gap-8 z-10">
          
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8892B0]" style={fontHeading}>
                Arsenal
              </h1>
              <p className="text-[#8892B0] mt-2" style={fontTech}>Dê aquele boost no MMR mental garantindo as melhores skins.</p>
            </div>
          </div>

          {/* HEADER SECTION: Bento Grid Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* FEATURED AUCTION / HERO CARD (Col Span 2) */}
            {items.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:col-span-2 relative rounded-[32px] overflow-hidden group bg-[#151B2B] border border-[#1C2333] h-full min-h-[450px] shadow-2xl"
              >
                {/* A Imagem preenche 100% do card sem overlay escuro por cima dela */}
                <img 
                  src={items[0].image_url || 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/faceless_void.png'} 
                  alt={items[0].name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Um gradiente sutil SOMENTE de baixo pra cima, bem na base, pra garantir que o painel flutuante fique legível, mas sem sujar a foto */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B0F19]/80 to-transparent pointer-events-none" />

                {/* Badge flutuante no topo */}
                <div className="absolute top-6 left-6 z-20">
                  <Badge className="bg-[#0B0F19]/80 backdrop-blur-md text-[#FF3B8A] border-[#FF3B8A]/30 px-3 py-1 uppercase tracking-widest text-[10px]" style={fontTech}>
                    Godlike Drop
                  </Badge>
                </div>

                {/* Painel Flutuante na parte de baixo (Inspirado no exemplo do Monkey) */}
                <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6 z-20">
                  <div className="bg-[#151B2B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                    
                    {/* Título e Hero */}
                    <div className="flex-1 w-full">
                      <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow-md" style={fontHeading}>
                        {items[0].name}
                      </h2>
                      <p className="text-[#00E5FF] text-sm mt-1 font-medium drop-shadow-sm" style={fontTech}>
                        {items[0].hero_name || 'Geral'} • {items[0].rarity}
                      </p>
                    </div>

                    {/* Preço e Botão */}
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1" style={fontTech}>Valor do Drop</p>
                        <p className="text-2xl font-bold text-white drop-shadow-md" style={fontTech}>
                          <span className="text-sm text-[#00E5FF] mr-1">R$</span>
                          {items[0].price?.toFixed(2)}
                        </p>
                      </div>
                      <Link to={`/item/${items[0].id}`}>
                        <Button className="bg-[#00E5FF] hover:bg-[#00cce6] text-[#0B0F19] rounded-full px-8 py-6 font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all hover:scale-105" style={fontTech}>
                          Pegar Drop <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>

                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="lg:col-span-2 relative rounded-[32px] overflow-hidden group bg-[#151B2B] border border-[#1C2333] flex items-center justify-center min-h-[350px]">
                <span className="text-[#8892B0]" style={fontTech}>Carregando destaque...</span>
              </div>
            )}

            {/* SELLER CALL TO ACTION CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="bg-gradient-to-br from-[#151B2B] to-[#1C2333] rounded-[32px] p-8 border border-[#1C2333] relative overflow-hidden flex flex-col justify-between h-full min-h-[450px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3B8A]/20 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FF3B8A]/20 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-[#FF3B8A]" />
                </div>
                <h3 className="text-2xl font-bold" style={fontHeading}>Vire um Mercador</h3>
                <p className="text-[#8892B0] text-sm leading-relaxed" style={fontTech}>
                  Inventário lotado? Venda pra comunidade Dota Play e transforme seus itens em Pix na vida real.
                </p>
              </div>

              <div className="bg-[#0B0F19] rounded-2xl p-4 border border-[#1C2333] space-y-3 mt-6 z-10">
                <div className="flex justify-between items-center text-sm" style={fontTech}>
                  <span className="text-[#8892B0]">GPM (Ganhos Por Mês)</span>
                  <span className="text-green-400">+15%</span>
                </div>
                <p className="text-2xl font-bold text-white" style={fontTech}>R$ 3.450<span className="text-sm text-[#8892B0]">,00</span></p>
                <Button className="w-full rounded-xl bg-gradient-to-r from-[#FF3B8A] to-[#ff6b9a] hover:from-[#e62e78] hover:to-[#ff5c8e] text-white border-none shadow-[0_0_20px_rgba(255,59,138,0.3)]">
                  Começar o Farm <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* FILTERS / CATEGORIES */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full border text-sm transition-all ${
                  activeCategory === cat 
                    ? 'bg-white text-[#0B0F19] border-white font-medium' 
                    : 'bg-[#151B2B] text-[#8892B0] border-[#1C2333] hover:border-[#8892B0]/50'
                }`}
                style={fontTech}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* MARKETPLACE GRID */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={fontHeading}>Meta do Mercado</h3>
              <Button variant="link" className="text-[#00E5FF] p-0" style={fontTech}>Ver Tudo</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full py-12 flex justify-center">
                  <span className="text-[#8892B0]" style={fontTech}>Carregando itens...</span>
                </div>
              ) : items.slice(1).map((item, i) => (
                <Link to={`/item/${item.id}`} key={item.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (i % 4) * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="bg-[#151B2B] rounded-3xl p-3 border border-[#1C2333] group hover:border-[#00E5FF]/50 transition-all cursor-pointer flex flex-col h-full hover:shadow-[0_10px_30px_rgba(0,229,255,0.1)] hover:-translate-y-2"
                  >
                    <div className="bg-[#0B0F19] rounded-2xl aspect-[3/2] relative overflow-hidden flex items-center justify-center p-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="text-[#8892B0] text-xs">No image</div>
                      )}
                      
                      <div className="absolute top-3 right-3">
                        <button 
                          onClick={(e) => e.preventDefault()} 
                          className="w-8 h-8 rounded-full bg-[#151B2B]/80 backdrop-blur-md flex items-center justify-center border border-[#1C2333] hover:text-[#FF3B8A] transition-colors"
                        >
                          <HeartIcon />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-[#0B0F19]/80 backdrop-blur-md text-[#00E5FF] border-[#00E5FF]/30 text-[10px] uppercase tracking-wider" style={fontTech}>
                          {item.rarity}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                      <div>
                        <h4 className="font-bold text-lg leading-tight line-clamp-1" style={fontHeading}>{item.name}</h4>
                        <p className="text-[#8892B0] text-xs mt-1 uppercase truncate" style={fontTech}>{item.hero_name || 'Geral'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#1C2333]">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 border border-[#1C2333]">
                            <AvatarFallback className="bg-[#0B0F19] text-[10px]">DP</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-[#8892B0] truncate max-w-[80px]" style={fontTech}>DotaPlay</span>
                        </div>
                        <span className="font-bold text-white" style={fontTech}>R$ {item.price?.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1C2333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8892B0;
        }
      `}</style>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}
