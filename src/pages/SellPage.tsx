import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Scale, Zap, Users, Wallet, Link as LinkIcon } from "lucide-react";
import Navigation from "../components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellPage() {
  useEffect(() => {
    document.title = "Quero Vender - Dota Play Brasil";
  }, []);

  const handleWhatsApp = () => {
    window.open("https://wa.link/196mnu", "_blank");
  };

  const reasons = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Segurança Garantida",
      description:
        "Todo o processo é feito com transparência e segurança para ambas as partes.",
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Avaliação Justa",
      description:
        "Nossas propostas são baseadas nos valores atuais do mercado.",
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Pagamento Rápido",
      description:
        "Após o acordo e a troca, o pagamento é efetuado via PIX.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Atendimento Direto",
      description:
        "Negociação feita diretamente conosco, sem bots ou intermediários.",
    },
  ];

  const steps = [
    {
      title: "Primeiro Contato",
      description:
        "Você entra em contato conosco informando o seu interesse na venda.",
    },
    {
      title: "Envio do Perfil",
      description:
        "Solicitamos o link do seu perfil Steam. É fundamental que seu inventário esteja como Público.",
    },
    {
      title: "Nossa Avaliação",
      description:
        "Nossa equipe analisa seu inventário para verificar os itens e seus respectivos valores.",
    },
    {
      title: "Proposta e Pagamento",
      description:
        "Caso tenhamos interesse, enviamos uma proposta. Aceitando, combinamos a troca e realizamos o pagamento.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 via-transparent to-gray-700/10" />

      {/* Navigation */}
      <Navigation />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-4">
            Quero Vender
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Venda seus itens, skins e tesouros de Dota 2 com segurança e agilidade.
          </p>
        </motion.div>

        {/* Intro Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-10"
        >
          <Card className="bg-white/5 border border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-gray-300 leading-relaxed">
                Você possui itens, skins ou tesouros de Dota 2 que não utiliza mais? Oferecemos um serviço direto e transparente para avaliar e comprar seu inventário, transformando seus itens digitais em dinheiro de forma segura.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reasons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12"
        >
          {reasons.map((r, i) => (
            <Card key={i} className="bg-white/5 border border-white/20 backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/40 text-gray-300">
                    {r.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{r.title}</h3>
                    <p className="text-gray-300">{r.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-white/5 border border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Como funciona o processo</h2>
              <div className="grid gap-4">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center border border-white/20 text-white/80">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                      <p className="text-gray-300">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-12 text-center"
        >
          <Card className="bg-white/5 border border-white/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-gray-300 mb-6">
                Pronto para começar? Para iniciar a avaliação do seu inventário, entre em contato conosco através do nosso canal oficial.
              </p>
              <Button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                Falar no WhatsApp
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}