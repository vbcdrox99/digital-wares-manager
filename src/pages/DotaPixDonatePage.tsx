import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mic, PenTool, Loader2, Copy, CheckCircle, Volume2, ChevronDown, Check, Flame, TrendingUp, Tv, Activity, Heart, Camera } from "lucide-react";
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
    channel_name?: string;
  } | null>(null);

  const [goal, setGoal] = useState<{
    title: string;
    target: number;
    current: number;
    enabled: boolean;
  } | null>(null);

  // Profile image and settings row ID
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  // YouTube Live Status states
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [ytSettings, setYtSettings] = useState<{ key: string; channelId: string; enabled: boolean } | null>(null);

  // Removed external font loading to use system default
  useEffect(() => {
    // Fonts are now handled globally
  }, []);

  // Fetch settings and live goal details
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('dotapix_settings')
        .select('*')
        .maybeSingle();

      console.log("DotaPixDonatePage - Loaded settings:", settingsData, "error:", settingsError);
      
      if (!settingsError && settingsData) {
        setSettingsId(settingsData.id);
        setProfileImageUrl(settingsData.profile_image_url);

        setSettings({
          min_donation: Number(settingsData.min_donation) || 3.00,
          min_donation_custom_voice: Number(settingsData.min_donation_custom_voice) || 5.00,
          min_donation_audio: Number(settingsData.min_donation_audio) || 8.00,
          fish_voices: Array.isArray(settingsData.fish_voices) ? settingsData.fish_voices : [],
          channel_name: settingsData.channel_name || 'Dota Play Brasil'
        });
        
        // Formate initial default amount if standard donation has different value
        const initialMin = Number(settingsData.min_donation) || 3.00;
        setAmount(initialMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

        // 2. Fetch active goal if enabled
        if (settingsData.goal_enabled) {
          const { data: donationsData, error: donationsError } = await supabase
            .from('dotapix_donations')
            .select('amount')
            .eq('is_paid', true)
            .gte('created_at', settingsData.goal_start_date);

          if (!donationsError) {
            const totalRaised = (donationsData || []).reduce((sum, item) => sum + Number(item.amount), 0);
            const initialValue = Number(settingsData.goal_initial_value) || 0;
            
            setGoal({
              title: settingsData.goal_title || 'Meta da Live',
              target: Number(settingsData.goal_target) || 500,
              current: totalRaised + initialValue,
              enabled: settingsData.goal_enabled
            });
          }
        }

        // Set YouTube settings if enabled
        if (settingsData.youtube_integration_enabled && settingsData.youtube_api_key && settingsData.youtube_channel_id) {
          setYtSettings({
            key: settingsData.youtube_api_key,
            channelId: settingsData.youtube_channel_id,
            enabled: true
          });
        }
      }
    };
    fetchData();
  }, []);

  // Poll YouTube Live Status
  useEffect(() => {
    if (!ytSettings || !ytSettings.enabled || !ytSettings.key || !ytSettings.channelId) {
      setIsLive(false);
      return;
    }

    const checkYouTubeLiveStatus = async () => {
      try {
        console.log("YouTube - Checking if channel is live...");
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytSettings.channelId}&type=video&eventType=live&key=${ytSettings.key}`;
        const res = await fetch(searchUrl);
        if (!res.ok) throw new Error("YouTube API returned error");
        const searchData = await res.json();
        
        const live = searchData.items && searchData.items.length > 0;
        setIsLive(live);
        console.log("YouTube - Live status checked:", live);
      } catch (err) {
        console.error("YouTube Live check error:", err);
      }
    };

    checkYouTubeLiveStatus();
    // Check status every 2 minutes (120000ms)
    const interval = setInterval(checkYouTubeLiveStatus, 120000);
    return () => clearInterval(interval);
  }, [ytSettings]);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background elements aligned with HomePage */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-transparent rounded-full blur-[140px] pointer-events-none animate-drift-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-900/30 via-emerald-900/20 to-transparent rounded-full blur-[140px] pointer-events-none animate-drift-slower" />

      {/* Styles for dynamic drift animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drift {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-45%, -55%) rotate(180deg) scale(1.15); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        .animate-drift-slow {
          animation: drift 30s infinite alternate ease-in-out;
        }
        .animate-drift-slower {
          animation: drift 40s infinite alternate-reverse ease-in-out;
        }
      `}} />

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full relative z-10">
        
        {/* LEFT COLUMN: Streamer Profile & Goal status */}
        <div className="space-y-6 flex flex-col justify-start">
          
          <div className="bg-black/20 border border-white/10 backdrop-blur-md rounded-[2rem] p-5 relative overflow-hidden transition-all duration-300 hover:bg-black/30 hover:border-white/20 flex flex-col justify-between glass-card">
            
            {/* Streamer Profile Section */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative w-16 h-16 bg-white/5 border border-white/10 shadow-lg rounded-full overflow-hidden p-0.5 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-black/50 relative">
                  <img 
                    src={profileImageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop"} 
                    alt="Logo Dota Play Brasil" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-left flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white tracking-tight truncate">{settings?.channel_name || 'Dota Play Brasil'}</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono mt-0.5">Sistema de Apoio Oficial</p>
              </div>
              
              {/* Live Indicator Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 border border-white/10 backdrop-blur-sm rounded-full shadow-lg shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLive ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                </span>
                <span className={`text-[8px] font-black uppercase tracking-wider font-mono ${isLive ? 'text-red-500' : 'text-gray-400'}`}>
                  {isLive ? 'Ao Vivo' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Separator line */}
            <div className="border-t border-white/10 my-4 relative z-10" />

            {/* Goal Progress Section */}
            <div className="relative z-10 space-y-3 pb-1">
              {goal && goal.enabled ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Progresso da Meta
                    </div>
                    <span className="text-[8px] text-gray-500 font-mono tracking-wider uppercase">{goal.title}</span>
                  </div>

                  <div className="flex items-end justify-between pt-0.5">
                    <div className="space-y-0.5">
                      <span className="text-2xl font-black font-mono tracking-tighter text-white">
                        {Math.round((goal.current / goal.target) * 100)}%
                      </span>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black font-mono">Completo</p>
                    </div>
                    <div className="text-right font-mono space-y-0.5">
                      <span className="text-xs text-gray-300 font-bold">R$ {goal.current}</span>
                      <span className="text-[9px] text-gray-500 block">de R$ {goal.target}</span>
                    </div>
                  </div>

                  {/* Glowing progress line */}
                  <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden relative border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full relative shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }} 
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-1 space-y-1">
                  <Heart className="w-5 h-5 text-gray-500 mx-auto" />
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">DotaPlay Live Stream</h3>
                  <p className="text-[9px] text-gray-500 leading-normal">Seu apoio ajuda a manter o canal online com lives diárias.</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: The Form / QR Code Payment */}
        <div className="space-y-6">
          
          {paymentQrCode ? (
            /* Capsule 4: Pix QR Code Widget */
            <div className="bg-black/20 border border-white/10 backdrop-blur-md rounded-[2rem] p-6 space-y-6 relative transition-all duration-300 glass-card hover:bg-black/30 hover:border-white/20">
              
              {paymentStatus === 'approved' ? (
                <div className="flex flex-col items-center text-center space-y-4 py-8">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                    <CheckCircle className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight uppercase font-mono">Doação Recebida!</h2>
                  <p className="text-gray-400 text-xs leading-relaxed max-w-[260px]">
                    Muito obrigado, <span className="text-cyan-400 font-bold">{donorName}</span>! Seu apoio foi computado e o alerta foi enviado para o streaming.
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
                    className="bg-gradient-gaming shadow-glow text-white font-extrabold rounded-full px-6 py-2.5 border-none text-[10px] tracking-widest uppercase transition-all duration-200"
                  >
                    Novo Envio
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-5">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">QR CODE DE PAGAMENTO</h3>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">Leia no app do seu banco</p>
                  </div>
                  
                  <div className="bg-white border border-white/20 p-4 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={`data:image/png;base64,${paymentQrCode}`} 
                      alt="Pix QR Code" 
                      className="w-40 h-40 rounded-xl relative z-10"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-semibold animate-pulse font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[10px] tracking-wider">AGUARDANDO CONFIRMAÇÃO...</span>
                  </div>

                  <div className="w-full space-y-1.5">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider px-1">Pix Copia e Cola</label>
                    <div className="flex gap-2">
                      <Input 
                        value={paymentCopyPaste || ''} 
                        readOnly 
                        className="bg-black/50 border-white/10 text-white text-xs rounded-xl h-11 font-mono"
                      />
                      <Button onClick={copyToClipboard} size="icon" className="bg-gradient-gaming shadow-glow text-white rounded-xl h-11 w-11 shrink-0 border-none transition-all hover:scale-105">
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
                    className="text-gray-500 hover:text-white hover:bg-white/5 text-xs mt-2"
                  >
                    Voltar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Capsule 3: Form Card */
            <div className="bg-black/20 border border-white/10 backdrop-blur-md rounded-[2rem] p-6 space-y-5 relative transition-all duration-300 hover:bg-black/30 hover:border-white/20 glass-card">
              
              {/* Nome de usuário */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest px-1 font-mono">Seu nome de usuário</label>
                <Input
                  placeholder="Ex: GamerPro"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="bg-black/50 border-white/10 text-white placeholder-gray-600 rounded-2xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 h-11 px-4 text-xs shadow-inner"
                />
              </div>

              {/* Abas Enviar Mensagem / Gravar Áudio - Pill style */}
              <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner">
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
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 font-mono ${
                    messageType === 'text' 
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/30' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Mensagem
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
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 font-mono ${
                    messageType === 'audio' 
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/30' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Áudio
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
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 shadow-inner resize-none font-mono"
                    />
                    <div className="absolute right-3.5 bottom-3 text-gray-500 text-[9px] font-bold font-mono">
                      {message.length}/200
                    </div>
                  </div>

                  {/* Seleção de Voz - Pill type select */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest px-1 font-mono">Voz para o Alerta</label>
                    
                    {/* Custom select trigger button */}
                    <button
                      type="button"
                      onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                      className="w-full bg-black/50 hover:bg-black/70 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white flex items-center justify-between transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner font-mono"
                    >
                      <span className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-extrabold text-white">
                          {voiceId === 'br_001' ? 'Voz padrão' : 
                           voiceId === 'pt_male_bueno' ? 'Galvão Bueno' :
                           voiceId === 'bp_female_ivete' ? 'Ivete Sangalo' :
                           voiceId === 'bp_female_ludmilla' ? 'Ludmilla' :
                           settings?.fish_voices?.find(v => v.id === voiceId)?.name || 'Voz padrão'}
                        </span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${showVoiceMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Custom select dropdown */}
                    {showVoiceMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowVoiceMenu(false)} />
                        
                        <div className="absolute left-0 right-0 z-50 mt-2 bg-neutral-900 border border-white/10 rounded-[1.8rem] p-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto space-y-1 scrollbar-none animate-in fade-in-50 slide-in-from-top-1 duration-150 backdrop-blur-xl">
                          {[
                            { id: 'br_001', name: 'Voz padrão', description: 'Tradicional' },
                            { id: 'pt_male_bueno', name: 'Galvão Bueno', description: 'Narrador' },
                            { id: 'bp_female_ivete', name: 'Ivete Sangalo', description: 'Alegria do Carnaval' },
                            { id: 'bp_female_ludmilla', name: 'Ludmilla', description: 'Estilo' },
                            ...(settings?.fish_voices?.map(v => ({ id: v.id, name: v.name, description: 'Personalizada' })) || [])
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
                                  
                                  const currentAmt = getAmountNumber();
                                  const requiredMin = minVal || 3.00;
                                  if (currentAmt < requiredMin) {
                                    setAmount(requiredMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-[1.2rem] transition-all text-left font-mono ${
                                  isSelected 
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                                    : 'hover:bg-white/5 border border-transparent text-gray-400 hover:text-white'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs">{voice.name}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                      isCustomVoice 
                                        ? 'bg-purple-500/20 text-purple-400' 
                                        : 'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                      Min: R$ {minVal?.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500">{voice.description}</p>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
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
                <div className="flex flex-col items-center p-4 bg-black/40 border border-white/10 rounded-[1.8rem] space-y-3.5 shadow-inner">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-mono">Grave um áudio (máx. 15s)</p>

                  <div className="flex items-center gap-3">
                    {!isRecording ? (
                      <Button 
                        type="button" 
                        onClick={startRecording}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 text-white rounded-full p-3 h-12 w-12 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] border-none transition-all duration-200"
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={stopRecording}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 h-12 w-12 flex items-center justify-center animate-pulse border border-white/20 shadow-glow"
                      >
                        <div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,1)]" />
                      </Button>
                    )}
                  </div>

                  {audioUrl && (
                    <div className="w-full flex flex-col items-center space-y-2">
                      <p className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 font-mono">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Áudio pronto para envio
                      </p>
                      <audio src={audioUrl} controls className="w-full max-w-xs h-8 bg-black/50 border border-white/10 rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              {/* Valor da Doação */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest px-1 font-mono">Valor da doação</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-black text-base">R$</span>
                  <Input
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="bg-black/50 border-white/10 text-white pl-11 pr-4 py-5 text-base font-black rounded-2xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 shadow-inner font-mono"
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-medium px-1 font-mono">
                  Valor mínimo: R$ {
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
                className="w-full bg-gradient-gaming shadow-glow hover:scale-[1.02] text-white font-extrabold text-[10px] py-5 rounded-2xl transition-all flex items-center justify-center gap-2 border-none tracking-widest uppercase hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] duration-300 font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "CONTINUAR"
                )}
              </Button>

              <p className="text-[9px] text-gray-500 text-center leading-normal px-1 font-mono">
                Ao continuar, você concorda com os <a href="#" className="underline hover:text-white transition-colors">Termos de Uso</a>.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
