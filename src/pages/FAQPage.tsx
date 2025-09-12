import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, Shield, Clock, Users, HelpCircle, RefreshCw, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";

const FAQPage = () => {
  const faqs = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      question: "Como posso comprar os itens do Dotaplay?",
      answer: "Ao clicar no botão de comprar, você será direcionado para um dos administradores do canal, através do WhatsApp. Optamos por esse formato para garantir mais segurança, proximidade e um atendimento personalizado. Não temos interesse em usar sistemas automatizados ou lojas integradas — aqui, você fala direto com a gente!"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      question: "Por que não há uma opção de pagamento direto pelo site?",
      answer: "Escolhemos não usar sistemas automáticos de pagamento porque queremos manter um processo mais seguro e próximo da nossa comunidade. Todas as transações são feitas diretamente com um administrador, garantindo que cada negociação seja acompanhada de perto e realizada com total confiança."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      question: "Quando vou receber meus itens?",
      answer: "Na maioria dos casos prazo de envio é de até 30 dias. Esse tempo é necessário porque os itens são enviados como presente, o que permite que você os receba com segurança, sem precisar tornar seu perfil da Steam público. Assim, garantimos a sua privacidade e a integridade da transação.\n\nExistem itens que podem ser enviados por proposta de troca. Essa opção exige que o seu perfil esteja configurado como público e apto a receber propostas. Caso prefira esse tipo de envio, é só nos avisar! Sempre verificamos se o item desejado está disponível para envio por proposta antes de concluir a transação."
    },
    {
      icon: <Users className="w-6 h-6" />,
      question: "Por que posso confiar em vocês?",
      answer: "O Dotaplay está há anos online, ao vivo todos os dias, com milhares de inscritos e uma comunidade sólida. Nossa reputação é construída diariamente, com transparência, responsabilidade e respeito por quem nos acompanha. Para nós, confiança não é só uma palavra: é uma regra."
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      question: "E se eu tiver mais dúvidas?",
      answer: "Fique à vontade para entrar em contato com a nossa equipe pelo WhatsApp ou pelas redes sociais. Estamos sempre disponíveis para ajudar e garantir que sua experiência seja tranquila e segura."
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      question: "É possível pedir reembolso?",
      answer: "Não, não é possível. Os pagamentos são feitos via Pix e, assim que a transação é confirmada, o item é imediatamente reservado para você. Por isso, o pagamento é sempre antecipado, garantindo que ninguém mais possa comprar aquele item."
    },
    {
      icon: <Package className="w-6 h-6" />,
      question: "Quais itens posso comprar?",
      answer: "Todos os itens que aparecem na nossa loja estão disponíveis. Assim que um cliente realiza o pagamento, o item é retirado do catálogo ou sinalizado como esgotado, evitando qualquer confusão. Trabalhamos sempre para manter a lista atualizada e transparente."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      question: "Como funciona o envio como presente na Steam?",
      answer: "O envio como presente é uma forma segura e prática de entregar itens. Assim que o prazo de envio se cumpre, enviamos o item diretamente para a sua conta Steam como um presente. Isso significa que você não precisa tornar seu perfil público nem adicionar desconhecidos como amigos. A Steam permite que o envio de presentes seja feito diretamente, desde que os perfis estejam configurados para aceitar esse tipo de transação. Esse método é mais seguro e protege sua privacidade."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 via-transparent to-gray-700/10" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Encontre respostas para as principais dúvidas sobre o Dotaplay e nossos serviços
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="grid gap-6 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-lg border border-gray-600/40">
                      <div className="text-gray-300">
                        {faq.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                        {faq.question}
                      </h3>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/8 hover:border-white/30 transition-all duration-300 overflow-hidden max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageCircle className="w-8 h-8 text-gray-300" />
                <h3 className="text-2xl font-bold text-white">Ainda tem dúvidas?</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Nossa equipe está sempre disponível para ajudar você!
              </p>
              <button className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 border border-gray-600 backdrop-blur-sm hover:border-gray-500">
                Falar no WhatsApp
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;