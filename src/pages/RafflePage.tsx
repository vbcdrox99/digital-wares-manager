import React from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Item } from '@/types/inventory';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Star, Info, Ticket, Zap, Target, Users, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const RafflePage: React.FC = () => {
  const [premiumItemIds] = useLocalStorage<string[]>('premiumRaffleItemIds', []);
  const [premiumSelectedItems, setPremiumSelectedItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dailyItems, setDailyItems] = React.useState<Item[]>([]);
  const [loadingDaily, setLoadingDaily] = React.useState(false);
  const [dailyError, setDailyError] = React.useState<string | null>(null);
  const [featuredItem, setFeaturedItem] = React.useState<Item | null>(null);

  React.useEffect(() => {
    const fetchPremiumItems = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!premiumItemIds || premiumItemIds.length === 0) {
          setPremiumSelectedItems([]);
          return;
        }
        const { data, error: supabaseError } = await supabase
          .from('items')
          .select('*')
          .in('id', premiumItemIds);
        if (supabaseError) throw supabaseError;
        setPremiumSelectedItems((data || []) as Item[]);
      } catch (err) {
        console.error('Erro ao carregar itens do sorteio premium:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar itens do sorteio premium');
        setPremiumSelectedItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPremiumItems();
  }, [premiumItemIds]);

  // Área de live removida conforme solicitação

  // Carregar Item Raro do Dia para todos (independente de login ou seleção no Admin)
  React.useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Primeiro tenta pegar um item destacado
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('highlighted', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
          setFeaturedItem(data[0] as Item);
        } else {
          // Fallback: pegar um item de maior raridade
          const { data: fallback, error: fallbackError } = await supabase
            .from('items')
            .select('*')
            .in('rarity', ['immortal', 'arcana'])
            .order('created_at', { ascending: false })
            .limit(1);
          if (fallbackError) throw fallbackError;
          setFeaturedItem(fallback && fallback.length > 0 ? (fallback[0] as Item) : null);
        }
      } catch (err) {
        console.error('Erro ao carregar Item Raro do Dia:', err);
        setFeaturedItem(null);
      }
    };
    fetchFeatured();
  }, []);

  // Buscar itens com preço menor que R$30 para o sorteio diário
  React.useEffect(() => {
    const fetchDailyItems = async () => {
      try {
        setLoadingDaily(true);
        setDailyError(null);
        const { data, error: supabaseError } = await supabase
          .from('items')
          .select('*')
          .lt('price', 30)
          .order('price', { ascending: true });
        if (supabaseError) throw supabaseError;
        setDailyItems((data || []) as Item[]);
      } catch (err) {
        console.error('Erro ao carregar itens do sorteio diário:', err);
        setDailyError(err instanceof Error ? err.message : 'Erro ao carregar itens do sorteio diário');
        setDailyItems([]);
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchDailyItems();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Grande */}
      <motion.section 
        className="relative overflow-hidden bg-gradient-cyber py-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-6">
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
              <div className="flex items-center justify-center gap-3">
                <Star className="h-8 w-8 text-yellow-400" />
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Sorteio
                </h1>
              </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Participe das nossas lives no YouTube/Twitch e entre em sorteios diários de itens premium — doe para ganhar tickets, ajude a bater as metas e aumente suas chances!
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="#diretrizes">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
                  Como participar
                </Button>
              </a>
              <a href="https://livepix.gg/dotaplay2021" target="_blank" rel="noopener noreferrer">
                <Button 
                  className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black font-bold shadow-lg shadow-amber-500/30 hover:opacity-90 ring-2 ring-amber-300"
                >
                  <Zap className="w-4 h-4 mr-2" /> Doar via LivePix
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Seção de live removida */}

      

      {/* Conteúdo / Itens Premium */}
      <motion.section 
        className="py-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="container mx-auto px-6">
          {/* Item Raro do Dia visível para todos */}
          {featuredItem && (
            <Card className="border border-white/10 bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader>
                <div className="relative overflow-hidden rounded-xl aspect-[2/1] ring-1 ring-white/10">
                  {featuredItem.image_url ? (
                    <motion.img
                      src={featuredItem.image_url || ''}
                      alt={featuredItem.name || ''}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      fetchpriority="low"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center">
                      <Package className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-gray-400 text-sm">Sem imagem</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-sm font-bold shadow-lg ring-1 ring-amber-400/60">
                    <Info className="w-4 h-4" /> Item Raro do Dia
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-md bg-black/70 text-white text-sm font-semibold shadow">
                    R$ {parseFloat(featuredItem.price.toString()).toFixed(2)}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-white text-2xl md:text-3xl font-extrabold line-clamp-1">{featuredItem.name}</h3>
                      <p className="text-gray-300 text-sm md:text-base">{featuredItem.hero_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded ${getRarityColor(featuredItem.rarity)} text-white text-xs font-semibold uppercase`}>
                        {featuredItem.rarity}
                      </div>
                      <Link
                        to={`/item/${featuredItem.id}`}
                        className="inline-flex items-center gap-2 bg-gradient-gaming shadow-gaming-glow text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition"
                      >
                        <Ticket className="w-4 h-4" /> Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Grid de itens premium (se houver mais de um selecionado no Admin) */}
          {loading ? (
            <div className="text-center text-muted-foreground mt-6">Carregando itens do Sorteio Premium...</div>
          ) : premiumSelectedItems.length > 1 ? (
            <div className="grid grid-cols-1 gap-6 mt-6">
              {premiumSelectedItems.slice(1).map((item) => (
                <Card key={item.id} className="border border-white/10 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden">
                  <CardHeader>
                    <div className="relative overflow-hidden rounded-lg aspect-[2/1] group ring-1 ring-white/10">
                      {item.image_url ? (
                        <motion.img
                          src={item.image_url || ''}
                          alt={item.name || ''}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                          fetchpriority="low"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-gray-400 text-sm">Sem imagem</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <div className="px-2 py-1 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold shadow-md">
                          Premium
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-sm font-semibold shadow">
                        R$ {parseFloat(item.price.toString()).toFixed(2)}
                      </div>
                      <motion.div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duração-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-white text-xl md:text-2xl font-bold line-clamp-1">{item.name}</h3>
                          <p className="text-gray-300 text-sm md:text-base">{item.hero_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded ${getRarityColor(item.rarity)} text-white text-xs font-semibold uppercase`}>
                            {item.rarity}
                          </div>
                          <Link
                            to={`/item/${item.id}`}
                            className="inline-flex items-center gap-2 bg-gradient-gaming shadow-gaming-glow text-white px-3 py-2 rounded-md text-sm hover:opacity-90 transition"
                          >
                            <Ticket className="w-4 h-4" /> Ver detalhes
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* Diretrizes do Sorteio (agora abaixo dos itens) */}
      <motion.section
        id="diretrizes"
        className="py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-6">
          <Card className="border-border/50 bg-black/30 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold">Diretrizes para participar do sorteio</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-200">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-yellow-300">
                  AO BATER NOSSAS METAS DIÁRIAS SERÁ FEITO O SORTEIO DE 1 ITEM. AO DUPLICARMOS A META SERÁ FEITO O SORTEIO DE 3
                </p>
              </div>

              <p>
                Atenção, pessoal! Para participar do sorteio durante a live no YouTube ou Twitch, é obrigatório que o nick enviado no donate seja exatamente igual ao que está cadastrado na plataforma do jogo (precisamos ter certeza que é você). Nicks diferentes ou desconhecidos não serão aceitos e a participação será desclassificada. Fiquem atentos para garantir sua chance de ganhar! Para os vencedores: estejam no nosso grupo do whatsapp ou falem no instagram.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-green-400 mt-1" />
                    <p>Use o comando <span className="font-semibold">!zap</span> para entrar no grupo do WhatsApp que será divulgado os sorteados.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-400 mt-1" />
                    <p>Caso não esteja online, ficará sabendo do resultado; se não for encontrado, o item irá para sorteio novamente.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-pink-400 mt-1" />
                    <p>A cada <span className="font-semibold">R$3</span> doados, você ganha <span className="font-semibold">1 ticket</span>.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-yellow-400 mt-1" />
                    <p>Bateu a primeira meta: <span className="font-semibold">1 sorteado</span>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-yellow-400 mt-1" />
                    <p>Dobrou a meta? <span className="font-semibold">+2 sorteados</span>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-yellow-400 mt-1" />
                    <p>Triplicou a meta? <span className="font-semibold">+2 sorteados</span> e assim sucessivamente.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-1" />
                <p><span className="font-semibold">Apenas 1 item por CPF!</span> Os vencedores serão divulgados no grupo do <span className="font-semibold">!zap</span>. Boa sorte! 🍀</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Sorteio Diário - Itens abaixo de R$30 */}
      <motion.section
        className="py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-6">
          <Card className="border-border/50 bg-black/30 backdrop-blur-md">
            <CardHeader>
              <h2 className="text-2xl font-bold">Sorteio Diário</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Você pode escolher qualquer um destes itens assim que atingir a primeira meta do dia.
              </p>
              {loadingDaily ? (
                <div className="text-center text-muted-foreground">Carregando itens do Sorteio Diário...</div>
              ) : dailyError ? (
                <div className="text-center text-red-400">{dailyError}</div>
              ) : dailyItems.length === 0 ? (
                <div className="text-center text-muted-foreground">Nenhum item abaixo de R$30 encontrado.</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {dailyItems.map((item) => (
                    <Card key={item.id} className="border border-white/10 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden">
                      <CardHeader>
                        <div className="relative overflow-hidden rounded-lg aspect-[2/1] group ring-1 ring-white/10">
                          {item.image_url ? (
                            <motion.img
                              src={item.image_url || ''}
                              alt={item.name || ''}
                              className="w-full h-full object-cover object-center"
                              loading="lazy"
                              decoding="async"
                              fetchpriority="low"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg border-2 border-dashed border-gray-500/50 flex flex-col items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-gray-400 text-sm">Sem imagem</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-sm font-semibold shadow">
                            R$ {parseFloat(item.price.toString()).toFixed(2)}
                          </div>
                          <motion.div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="text-white text-xl md:text-2xl font-bold line-clamp-1">{item.name}</h3>
                              <p className="text-gray-300 text-sm md:text-base">{item.hero_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-1 rounded ${getRarityColor(item.rarity)} text-white text-xs font-semibold uppercase`}>
                                {item.rarity}
                              </div>
                              <Link
                                to={`/item/${item.id}`}
                                className="inline-flex items-center justify-center bg-gradient-gaming shadow-gaming-glow text-white p-2 rounded-md hover:opacity-90 transition"
                                aria-label="Ver detalhes"
                                title="Ver detalhes"
                              >
                                <Ticket className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  );
};

export default RafflePage;