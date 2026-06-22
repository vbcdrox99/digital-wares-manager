import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mic, PenTool, Loader2, Copy, CheckCircle, Volume2, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DotaPixDonatePage() {
  const [donorName, setDonorName] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'audio'>('text');
  const [message, setMessage] = useState('');
  const [voiceId, setVoiceId] = useState('br_001');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [amount, setAmount] = useState('3,00');
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Payment states
  const [loading, setLoading] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
  const [paymentCopyPaste, setPaymentCopyPaste] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved'>('pending');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Gravando áudio...");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Gravação concluída!");
    }
  };

  // Convert amount string to number
  const getAmountNumber = () => {
    const clean = amount.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const [settings, setSettings] = useState<{
    min_donation: number;
    min_donation_custom_voice: number;
    min_donation_audio: number;
    fish_voices: { id: string; name: string }[];
  } | null>(null);

  // Fetch settings for custom voices
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('dotapix_settings')
        .select('min_donation, min_donation_custom_voice, min_donation_audio, fish_voices')
        .maybeSingle();
      console.log("DotaPixDonatePage - Loaded settings:", data, "error:", error);
      if (!error && data) {
        setSettings({
          min_donation: Number(data.min_donation) || 3.00,
          min_donation_custom_voice: Number(data.min_donation_custom_voice) || 5.00,
          min_donation_audio: Number(data.min_donation_audio) || 8.00,
          fish_voices: Array.isArray(data.fish_voices) ? data.fish_voices : []
        });
        
        // Formate initial default amount if standard donation has different value
        const initialMin = Number(data.min_donation) || 3.00;
        setAmount(initialMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }
    };
    fetchSettings();
  }, []);

  // Realtime subscription for payment confirmation
  useEffect(() => {
    if (!donationId) return;

    const channel = supabase
      .channel(`donation_status_${donationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dotapix_donations',
          filter: `id=eq.${donationId}`
        },
        (payload) => {
          if (payload.new && payload.new.is_paid === true) {
            setPaymentStatus('approved');
            toast.success("Doação confirmada com sucesso! Obrigado pelo apoio!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [donationId]);

  const handleContinue = async () => {
    const numericAmount = getAmountNumber();
    if (!donorName.trim()) {
      toast.error("Por favor, digite seu nome de usuário.");
      return;
    }

    const minVal = settings 
      ? (messageType === 'audio' 
          ? settings.min_donation_audio 
          : (voiceId === 'br_001' ? settings.min_donation : settings.min_donation_custom_voice))
      : 3.00;

    if (numericAmount < minVal) {
      toast.error(`O valor mínimo para esta modalidade é R$ ${minVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      return;
    }
    if (messageType === 'text' && !message.trim()) {
      toast.error("Por favor, escreva uma mensagem.");
      return;
    }
    if (messageType === 'audio' && !audioBlob) {
      toast.error("Por favor, grave uma mensagem de áudio.");
      return;
    }

    setLoading(true);
    try {
      let uploadedAudioUrl = null;

      // 1. Upload audio if type is audio
      if (messageType === 'audio' && audioBlob) {
        const fileExt = 'webm';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `donations/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dotapix-audios')
          .upload(filePath, audioBlob, {
            contentType: 'audio/webm',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('dotapix-audios')
          .getPublicUrl(filePath);
        
        uploadedAudioUrl = data.publicUrl;
      }

      // 2. Insert donation record
      const { data: donation, error: insertError } = await supabase
        .from('dotapix_donations')
        .insert({
          donor_name: donorName,
          message_type: messageType,
          message: messageType === 'text' ? message : null,
          audio_url: uploadedAudioUrl,
          amount: numericAmount,
          voice_id: messageType === 'text' ? voiceId : null,
          is_paid: false,
          played_on_stream: false
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setDonationId(donation.id);

      // 3. Create Mercado Pago PIX Payment
      const { data: paymentResponse, error: functionError } = await supabase.functions
        .invoke('create-pix-payment', {
          body: {
            donation: {
              id: donation.id,
              amount: donation.amount,
              donor_name: donation.donor_name
            },
            customer_name: donation.donor_name,
            customer_email: "doador@dotaplay.com",
            customer_cpf: "00000000000", // Fake/Default CPF for MP API
            is_donation: true
          }
        });

      if (functionError) throw functionError;
      if (paymentResponse.error) throw new Error(paymentResponse.error);

      setPaymentQrCode(paymentResponse.qr_code_base64);
      setPaymentCopyPaste(paymentResponse.qr_code);
      toast.success("PIX Gerado! Aguardando pagamento.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar doação.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentCopyPaste) {
      navigator.clipboard.writeText(paymentCopyPaste);
      toast.success("Código Copia e Cola copiado!");
    }
  };

  const handleAmountChange = (val: string) => {
    // Basic BRL currency formatting helper
    let clean = val.replace(/\D/g, '');
    if (clean === '') {
      setAmount('0,00');
      return;
    }
    let num = parseInt(clean, 10);
    let formatted = (num / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setAmount(formatted);
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] flex flex-col items-center justify-center p-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      <Card className="w-full max-w-md bg-black border border-neutral-800/80 shadow-[0_30px_70px_rgba(0,0,0,0.8)] rounded-[2.5rem] relative overflow-visible flex flex-col p-6 mt-16 text-white">
        
        {/* Avatar/Logo overlapping */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="w-28 h-28 bg-[#1c1c1e] rounded-full border-4 border-black flex items-center justify-center overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop" 
              alt="Dota Play" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center mt-12 mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">Dota Play</h1>
          <p className="text-sm text-[#34c759] font-bold mt-0.5">Apoie a live e envie seu alerta!</p>
        </div>

        {paymentQrCode ? (
          <div className="flex flex-col items-center py-4 space-y-6">
            {paymentStatus === 'approved' ? (
              <div className="flex flex-col items-center text-center space-y-4 py-8">
                <CheckCircle className="w-20 h-20 text-[#34c759] animate-bounce" />
                <h2 className="text-2xl font-extrabold text-white">Doação Recebida!</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Muito obrigado, <span className="text-[#34c759] font-bold">{donorName}</span>! Sua mensagem foi enviada para a tela do streaming.
                </p>
                <Button 
                  onClick={() => {
                    setPaymentQrCode(null);
                    setPaymentCopyPaste(null);
                    setDonationId(null);
                    setPaymentStatus('pending');
                    setMessage('');
                    setAudioBlob(null);
                    setAudioUrl(null);
                  }}
                  className="bg-[#34c759] hover:bg-[#2cb04d] text-black font-bold rounded-2xl px-6 py-3 border-none shadow-md shadow-green-500/10"
                >
                  Fazer outra doação
                </Button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <h3 className="font-bold text-white text-lg">Pague com o PIX QR Code</h3>
                <div className="bg-[#1c1c1e] border border-neutral-800/80 p-4 rounded-3xl shadow-inner">
                  <img 
                    src={`data:image/png;base64,${paymentQrCode}`} 
                    alt="Pix QR Code" 
                    className="w-48 h-48 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-[#34c759] text-sm font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aguardando aprovação...</span>
                </div>
                <div className="w-full space-y-1.5">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Pix Copia e Cola</label>
                  <div className="flex gap-2">
                    <Input 
                      value={paymentCopyPaste || ''} 
                      readOnly 
                      className="bg-[#1c1c1e] border-white/5 text-white text-sm rounded-2xl h-12"
                    />
                    <Button onClick={copyToClipboard} size="icon" className="bg-[#34c759] hover:bg-[#2cb04d] text-black rounded-2xl h-12 w-12 shrink-0 border-none">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPaymentQrCode(null);
                    setPaymentCopyPaste(null);
                    setDonationId(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-300 text-sm mt-2"
                >
                  Cancelar e voltar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Nome de usuário */}
            <div className="space-y-1">
              <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Seu nome de usuário</label>
              <Input
                placeholder="Ex: dotaplay2021"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="bg-[#1c1c1e] border-white/5 text-white placeholder-neutral-500 rounded-2xl focus:ring-2 focus:ring-[#34c759] h-12 px-4"
              />
            </div>

            {/* Abas Enviar Mensagem / Gravar Áudio */}
            <div className="grid grid-cols-2 gap-2 bg-[#1c1c1e] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMessageType('text');
                  const currentAmt = getAmountNumber();
                  const reqMin = settings ? (voiceId === 'br_001' ? settings.min_donation : settings.min_donation_custom_voice) : 3.00;
                  if (currentAmt < reqMin) {
                    setAmount(reqMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  messageType === 'text' 
                    ? 'bg-[#2c2c2e] text-white shadow-[0_4px_10px_rgba(0,0,0,0.4)]' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <PenTool className="w-4 h-4" />
                Enviar Mensagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessageType('audio');
                  const currentAmt = getAmountNumber();
                  const reqMin = settings ? settings.min_donation_audio : 8.00;
                  if (currentAmt < reqMin) {
                    setAmount(reqMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  messageType === 'audio' 
                    ? 'bg-[#2c2c2e] text-white shadow-[0_4px_10px_rgba(0,0,0,0.4)]' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                Gravar Áudio
              </button>
            </div>

            {/* Mensagem de Texto */}
            {messageType === 'text' && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="Escreva sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.substring(0, 200))}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-[#1c1c1e] border-none rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#34c759] resize-none"
                  />
                  <div className="absolute right-3 bottom-3 text-neutral-500 text-xs font-semibold">
                    {message.length}/200
                  </div>
                </div>

                {/* Seleção de Voz */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Voz para TTS</label>
                  
                  {/* Custom select trigger button */}
                  <button
                    type="button"
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border-none rounded-2xl px-4 py-3.5 text-sm text-white flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#34c759]"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#34c759]" />
                      <span className="font-bold text-white">
                        {voiceId === 'br_001' ? 'Voz padrão' : 
                         voiceId === 'pt_male_bueno' ? 'Galvão Bueno' :
                         voiceId === 'bp_female_ivete' ? 'Ivete Sangalo' :
                         voiceId === 'bp_female_ludmilla' ? 'Ludmilla' :
                         settings?.fish_voices?.find(v => v.id === voiceId)?.name || 'Voz padrão'}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${showVoiceMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Custom select dropdown */}
                  {showVoiceMenu && (
                    <>
                      {/* Backdrop to close dropdown on clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowVoiceMenu(false)} />
                      
                      <div className="absolute left-0 right-0 z-50 mt-2 bg-[#1c1c1e] border border-neutral-800/80 rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-64 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-800 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                        {[
                          { id: 'br_001', name: 'Voz padrão', description: 'A voz clássica do tradutor' },
                          { id: 'pt_male_bueno', name: 'Galvão Bueno', description: 'Narrador do Tetra' },
                          { id: 'bp_female_ivete', name: 'Ivete Sangalo', description: 'Alegria do Carnaval' },
                          { id: 'bp_female_ludmilla', name: 'Ludmilla', description: 'Estilo e atitude' },
                          ...(settings?.fish_voices?.map(v => ({ id: v.id, name: v.name, description: 'Voz personalizada' })) || [])
                        ].map((voice) => {
                          const isSelected = voice.id === voiceId;
                          const isCustomVoice = voice.id !== 'br_001';
                          const minVal = isCustomVoice ? settings?.min_donation_custom_voice : settings?.min_donation;
                          
                          return (
                            <button
                              key={voice.id}
                              type="button"
                              onClick={() => {
                                setVoiceId(voice.id);
                                setShowVoiceMenu(false);
                                
                                // Auto-adjust amount to the minimum of the selected voice if current amount is lower
                                const currentAmt = getAmountNumber();
                                const requiredMin = minVal || 3.00;
                                if (currentAmt < requiredMin) {
                                  setAmount(requiredMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
                                isSelected 
                                  ? 'bg-[#34c759]/10 text-[#34c759]' 
                                  : 'hover:bg-white/5 border border-transparent text-neutral-400 hover:text-white'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{voice.name}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    isCustomVoice 
                                      ? 'bg-blue-500/10 text-blue-400' 
                                      : 'bg-[#34c759]/10 text-[#34c759]'
                                  }`}>
                                    Min: R$ {minVal?.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500">{voice.description}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#34c759]" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Gravar Áudio */}
            {messageType === 'audio' && (
              <div className="flex flex-col items-center p-4 bg-[#1c1c1e] rounded-2xl space-y-4">
                <div className="text-center">
                  <p className="text-xs text-neutral-400 font-medium">Grave um áudio de até 15 segundos para tocar na live</p>
                </div>

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button 
                      type="button" 
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-14 w-14 flex items-center justify-center shadow-lg shadow-red-500/20 border-none"
                    >
                      <Mic className="w-6 h-6" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={stopRecording}
                      className="bg-neutral-600 hover:bg-neutral-700 text-white rounded-full p-4 h-14 w-14 flex items-center justify-center animate-pulse border-none"
                    >
                      <div className="w-4 h-4 bg-red-500 rounded-sm" />
                    </Button>
                  )}
                </div>

                {audioUrl && (
                  <div className="w-full flex flex-col items-center space-y-2">
                    <p className="text-xs text-[#34c759] font-bold flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> Áudio gravado pronto!
                    </p>
                    <audio src={audioUrl} controls className="w-full max-w-xs h-8 bg-[#2c2c2e] rounded-lg" />
                  </div>
                )}
              </div>
            )}

            {/* Valor da Doação */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Valor da doação</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 font-extrabold text-lg">R$</span>
                <Input
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-[#1c1c1e] border-white/5 text-white pl-12 pr-4 py-6 text-lg font-black rounded-2xl focus:ring-2 focus:ring-[#34c759]"
                />
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">
                O valor mínimo para esta modalidade é R$ {
                  (settings 
                    ? (messageType === 'audio' 
                        ? settings.min_donation_audio 
                        : (voiceId === 'br_001' ? settings.min_donation : settings.min_donation_custom_voice))
                    : 3.00
                  ).toFixed(2).replace('.', ',')
                }
              </p>
            </div>

            {/* Botão CONTINUAR */}
            <Button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className="w-full bg-[#34c759] hover:bg-[#2cb04d] text-black font-black text-base py-6 rounded-2xl transition-all shadow-[0_10px_30px_rgba(52,199,89,0.15)] flex items-center justify-center gap-2 border-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                "CONTINUAR"
              )}
            </Button>

            {/* Footer legal */}
            <p className="text-[10px] text-neutral-500 text-center leading-normal">
              Ao clicar em continuar, você declara que leu e concorda com os <a href="#" className="underline hover:text-neutral-400">Termos de Uso</a> e a <a href="#" className="underline hover:text-neutral-400">Política de Privacidade</a>.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
