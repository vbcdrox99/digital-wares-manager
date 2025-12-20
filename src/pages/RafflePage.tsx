import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import type { Item } from '@/types/inventory';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Star, Info, Ticket, Zap, Target, Users, ShieldCheck, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { useRarities } from '@/hooks/useRarities';
import { getBadgeStyleFromColor } from '@/utils/rarityUtils';

const RafflePage: React.FC = () => {
  const { getRarityColor } = useRarities();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = React.useState(false);
  const [premiumSelectedItems, setPremiumSelectedItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dailyItems, setDailyItems] = React.useState<Item[]>([]);
  const [loadingDaily, setLoadingDaily] = React.useState(false);
  const [dailyError, setDailyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPremiumItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: featured, error: featuredError } = await supabase
          .from('premium_featured')
          .select('item_id, position')
          .order('position', { ascending: true });
        if (featuredError) throw featuredError;
        const ids = (featured || []).map((row: { item_id: string }) => row.item_id);
        if (!ids || ids.length === 0) {
          setPremiumSelectedItems([]);
          return;
        }
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .in('id', ids);
        if (itemsError) throw itemsError;
        const fetched = (itemsData || []) as Item[];
        const positionMap = new Map((featured || []).map((row: { item_id: string; position: number }) => [row.item_id, row.position]));
        fetched.sort((a, b) => (positionMap.get(a.id) ?? 999) - (positionMap.get(b.id) ?? 999));
        setPremiumSelectedItems(fetched);
      } catch (err) {
        console.error('Erro ao carregar itens do sorteio premium:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar itens do sorteio premium');
        setPremiumSelectedItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPremiumItems();
  }, []);

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

  // Shared Card Component to avoid duplication and ensure consistency
  const RaffleItemCard = ({ item, isPremium = false }: { item: Item, isPremium?: boolean }) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link to={`/item/${item.id}`} className="block h-full">
        <Card className="group bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-black/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-pointer h-full">
            <CardHeader className="p-0">
            <div className="relative overflow-hidden aspect-[16/10]">
                {item.image_url ? (
                <ImageWithFallback 
                    src={item.image_url}
                    alt={item.name}
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
                        {...getBadgeStyleFromColor(getRarityColor(item.rarity), "shadow-lg backdrop-blur-md")}
                    >
                        {item.rarity}
                    </Badge>
                    {isPremium && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-none font-bold shadow-lg backdrop-blur-md flex items-center gap-1">
                            <Info className="w-3 h-3" /> Raro do Dia
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
            <CardContent className="p-5 space-y-4">
            <div className="space-y-1">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="uppercase tracking-wider text-xs font-medium bg-white/5 px-2 py-0.5 rounded text-gray-400">
                    {item.hero_name}
                </span>
                </div>
            </div>
            
            <div className="pt-2 border-t border-white/5">
                <Button 
                className="w-full bg-white/5 hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-white/10 transition-all duration-300 gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                >
                <Ticket className="h-4 w-4" />
                <span className="font-medium">Ver Detalhes</span>
                </Button>
            </div>
            </CardContent>
        </Card>
        </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
            {/* Hero Grande */}
            <motion.section 
              className="relative overflow-hidden bg-gradient-to-br from-violet-900/20 via-background to-blue-900/20 pt-24 pb-8 border-b border-white/5"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-6">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-yellow-400" />
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              Sorteio
              </h1>
            </div>
            <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Participe das nossas lives no YouTube/Twitch e entre em sorteios diários de itens premium — doe para ganhar tickets, ajude a bater as metas e aumente suas chances!
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <a href="#diretrizes">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
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

      {/* Conteúdo / Itens Premium */}
      <motion.section 
        className="py-12 bg-gradient-to-b from-purple-900/5 to-background"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
                <Star className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold tracking-tight">Destaques Premium</h2>
            </div>

          {/* Grid de itens premium */}
          {loading ? (
            <div className="text-center text-muted-foreground mt-6 py-12 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">Carregando itens do Sorteio Premium...</div>
          ) : premiumSelectedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {premiumSelectedItems.map((item) => (
                <RaffleItemCard key={item.id} item={item} isPremium={true} />
              ))}
            </div>
          ) : !loadingDaily && dailyItems.length > 0 ? (
            // Fallback: mostrar um item do diário com o mesmo tamanho de card
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[dailyItems[0]].map((item) => (
                <RaffleItemCard key={item.id} item={item} isPremium={true} />
              ))}
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* Diretrizes do Sorteio */}
      <motion.section
        id="diretrizes"
        className="py-12 bg-black/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-6">
          <div 
            className={`relative mb-10 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/20 to-background border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-900/10 transition-all duration-300 ${isGuidelinesOpen ? 'ring-1 ring-cyan-500/50' : 'hover:bg-cyan-900/10 cursor-pointer'}`}
            onClick={() => !isGuidelinesOpen && setIsGuidelinesOpen(true)}
          >
            <div className="absolute top-0 right-0 p-20 bg-cyan-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-3 md:p-4 rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-pulse shrink-0">
                    <Info className="w-6 h-6 md:w-8 md:h-8 text-cyan-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                      Diretrizes do Sorteio
                    </h2>
                    <p className="text-cyan-200/70 text-sm md:text-base mt-1">
                      Regras essenciais para garantir sua participação
                    </p>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 self-start md:self-center border border-cyan-500/30 bg-cyan-950/30"
                  onClick={(e) => { e.stopPropagation(); setIsGuidelinesOpen(!isGuidelinesOpen); }}
                >
                  {isGuidelinesOpen ? (
                    <>
                      <span className="mr-2">Ocultar regras</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Ler regras completas</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {isGuidelinesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-8 mt-6 border-t border-cyan-500/20 space-y-6 text-gray-200">
                      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <p className="font-bold text-yellow-300 text-center md:text-left text-lg">
                          AO BATER NOSSAS METAS DIÁRIAS SERÁ FEITO O SORTEIO DE 1 ITEM. AO DUPLICARMOS A META SERÁ FEITO O SORTEIO DE 3
                        </p>
                      </div>

                      <p className="leading-relaxed text-gray-300 text-lg">
                        Atenção, pessoal! Para participar do sorteio durante a live no YouTube ou Twitch, é obrigatório que o nick enviado no donate seja exatamente igual ao que está cadastrado na plataforma do jogo (precisamos ter certeza que é você). Nicks diferentes ou desconhecidos não serão aceitos e a participação será desclassificada. Fiquem atentos para garantir sua chance de ganhar! Para os vencedores: estejam no nosso grupo do whatsapp ou falem no instagram.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                              <Zap className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">Use o comando <span className="font-bold text-green-300">!zap</span> para entrar no grupo do WhatsApp que será divulgado os sorteados.</p>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                              <Users className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">Caso não esteja online, ficará sabendo do resultado; se não for encontrado, o item irá para sorteio novamente.</p>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                              <Ticket className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">A cada <span className="font-bold text-pink-300">R$3</span> doados, você ganha <span className="font-bold text-pink-300">1 ticket</span>.</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                              <Target className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">Bateu a primeira meta: <span className="font-bold text-yellow-300">1 sorteado</span>.</p>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                              <Target className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">Dobrou a meta? <span className="font-bold text-yellow-300">+2 sorteados</span>.</p>
                          </div>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                              <Target className="w-5 h-5" />
                            </div>
                            <p className="text-sm leading-relaxed">Triplicou a meta? <span className="font-bold text-yellow-300">+2 sorteados</span> e assim sucessivamente.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <div className="p-2 rounded-full bg-emerald-500/20 shrink-0 animate-pulse">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-lg"><span className="font-bold">Apenas 1 item por CPF!</span> Os vencedores serão divulgados no grupo do <span className="font-bold">!zap</span>. Boa sorte! 🍀</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Sorteio Diário - Itens abaixo de R$30 */}
      <motion.section
        className="pt-2 pb-12 bg-gradient-to-b from-background to-purple-900/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-6">
            <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-r from-purple-900/40 via-blue-900/20 to-background border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-900/10">
                <div className="absolute top-0 right-0 p-20 bg-purple-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="p-4 rounded-full bg-purple-500/20 ring-1 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse">
                        <Gift className="w-8 h-8 text-purple-300" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                            Sorteio Diário
                            <span className="text-sm font-normal px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Metas Batidas
                            </span>
                        </h2>
                        <p className="text-lg text-gray-300 max-w-3xl">
                            Bateu a meta? Escolheu! Você pode selecionar <span className="text-purple-300 font-bold border-b border-purple-500/30 pb-0.5">qualquer item desta lista</span> assim que atingirmos a primeira meta do dia na live.
                        </p>
                    </div>
                </div>
            </div>

          {loadingDaily ? (
            <div className="text-center text-muted-foreground py-12 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">Carregando itens do Sorteio Diário...</div>
          ) : dailyError ? (
            <div className="text-center text-red-400 py-12 bg-black/20 rounded-xl border border-red-500/20 backdrop-blur-sm">{dailyError}</div>
          ) : dailyItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">Nenhum item abaixo de R$30 encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dailyItems.map((item) => (
                <RaffleItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default RafflePage;
