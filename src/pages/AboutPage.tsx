import { useEffect } from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";

export default function AboutPage() {
  useEffect(() => {
    document.title = "Sobre - Dota Play Brasil";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              Sobre nós(sa) Comunidade :)
            </motion.h1>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-black/30 backdrop-blur-sm rounded-lg p-8 border border-white/10"
            >
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                O Dotaplay nasceu da paixão por Dota 2 e da vontade de criar um espaço onde a comunidade brasileira pudesse se encontrar, jogar, rir e competir. Começamos com vídeos e tutoriais sobre o jogo de forma despretensiosas, mas rapidamente nos tornamos um dos principais canais de Dota do Brasil no youtube, com milhares de inscritos, lives diárias e campeonatos que movimentam jogadores de todo o país.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Aqui, a gente respira Dota — seja organizando a tradicional Dotaplay League, apresentando a caótica "Rinha de Ruins" ou apenas trocando aquela ideia marota no chat. Nosso conteúdo mistura competitividade, humor e muita interação com a galera que acompanha.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-black/30 backdrop-blur-sm rounded-lg p-8 border border-white/10"
            >
              <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Nossa Comunidade
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Mas o Dotaplay é muito mais do que só conteúdo ou campeonatos; é a nossa comunidade! Uma galera que, em muitos casos, joga junto há anos, criando laços, rivalidades saudáveis e, claro, memes inesquecíveis. Somos conhecidos por sermos unidos, nos ajudando dentro e fora das partidas, celebrando as vitórias e lamentando as derrotas (muitas vezes com muito bom humor).
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                É uma turma antiga no jogo e no canal, sim, mas que mantém uma energia muito louca e engraçada, transformando qualquer live ou chat em um show à parte. Interação com o chat é nosso lema, e é ali que a magia acontece, onde a zoeira encontra a estratégia e todos se sentem em casa.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Mais do que criar conteúdo, nosso propósito é fortalecer a cena brasileira de Dota, dar visibilidade para novos talentos e manter a chama da comunidade sempre acesa. Acreditamos que jogar vai muito além da vitória ou da derrota: é sobre construir histórias, amizades e, claro, colecionar aqueles memes inesquecíveis das partidas.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-lg p-8 border border-purple-500/30 text-center"
            >
              <p className="text-white text-xl leading-relaxed mb-6">
                O Dotaplay é por quem joga pra quem joga, pra quem só assiste e pra quem vive Dota. E se você chegou até aqui, já faz parte disso tudo.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Compre os itens, nos acompanhe nas lives, participe dos campeonatos ou só cola no chat pra dar aquela risada. Estamos te esperando!
              </p>
            </motion.section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}