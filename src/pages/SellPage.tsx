import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, PackagePlus, ShoppingCart, Wallet, Shield, Percent } from "lucide-react";
import Navigation from "../components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Quero Vender - Dota Play Brasil";
  }, []);

  const steps = [
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: "Crie sua conta de vendedor",
      description:
        "Faça seu cadastro gratuitamente. Assim que aprovado, você já pode começar a anunciar seus itens.",
    },
    {
      icon: <PackagePlus className="w-6 h-6" />,
      title: "Cadastre seus itens",
      description:
        "Adicione os itens, skins ou tesouros que deseja vender diretamente pelo seu painel de vendedor. Cada item vai para revisão e, ao ser aprovado, entra automaticamente no nosso catálogo.",
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Vendemos para você",
      description:
        "Toda a negociação, atendimento e entrega ao cliente é feita por nós, do Dota Play. Você não precisa se preocupar com nada.",
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Receba após a entrega",
      description:
        "Assim que o item for vendido e entregue ao comprador, você recebe o valor combinado via PIX — rápido e seguro.",
    },
  ];

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Segurança total",
      description:
        "Todas as transações são intermediadas pela nossa equipe. Sem fraudes, sem dores de cabeça.",
    },
    {
      icon: <Percent className="w-6 h-6" />,
      title: "Taxa justa de 15%",
      description:
        "Retemos apenas 15% do valor da venda para cobrir os custos da plataforma e do atendimento. O restante é 100% seu.",
    },
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: "Cadastro simples e rápido",
      description:
        "Sem aprovação demorada. Crie sua conta, cadastre seus itens e comece a vender no mesmo dia.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 via-transparent to-gray-700/10" />

      {/* Navigation */}
      <Navigation />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-4">
            Venda seus Itens de Dota 2
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cadastre-se gratuitamente, publique seus itens e receba assim que forem vendidos.
            Simples, seguro e sem complicação.
          </p>
        </motion.div>

        {/* Intro Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Card className="bg-white/5 border border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                Agora você pode vender seus itens, skins e tesouros de Dota 2 diretamente pelo
                <span className="text-white font-semibold"> Dota Play</span>. Basta criar uma conta de
                vendedor, cadastrar seus itens e nós cuidamos de todo o resto — atendimento, negociação e
                entrega. Quando o item for vendido e entregue ao comprador, você recebe o pagamento.
                Nossa taxa é de apenas <span className="text-white font-semibold">15%</span> sobre
                o valor vendido.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Como funciona</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <Card key={i} className="bg-white/5 border border-white/20 backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        {step.icon}
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-black text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Por que vender com a gente?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <Card key={i} className="bg-white/5 border border-white/20 backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all text-center">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/40 text-gray-300">
                      {b.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-gray-300 text-sm">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-10">
              <h2 className="text-3xl font-bold text-white mb-3">Pronto para começar?</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Crie sua conta agora e comece a vender seus itens de Dota 2 hoje mesmo.
              </p>
              <Button
                onClick={() => navigate("/login?tab=register")}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-10 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
              >
                <UserPlus className="mr-2 w-5 h-5" />
                Criar conta e vender agora
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}