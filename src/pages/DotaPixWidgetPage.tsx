import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from 'react-router-dom';

interface DonationAlert {
  id: string;
  donor_name: string;
  message_type: 'text' | 'audio';
  message: string | null;
  audio_url: string | null;
  amount: number;
  voice_id: string | null;
}

const formatAmountForTTS = (amount: number) => {
  const intPart = Math.floor(amount);
  const cents = Math.round((amount - intPart) * 100);
  if (cents === 0) {
    return `${intPart} reais`;
  }
  return `${intPart} reais e ${cents} centavos`;
};

export default function DotaPixWidgetPage() {
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const queueRef = useRef<DonationAlert[]>([]);
  const isProcessingRef = useRef(false);
  const [searchParams] = useSearchParams();
  const testMode = searchParams.get('test') === 'true';

  // Dynamic sound generator using Web Audio API (so no external asset is required!)
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime note 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      // Chime note 2 (slightly delayed)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc2.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.2); // C6
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 100);

    } catch (e) {
      console.error("Audio API error:", e);
    }
  };

  const processQueue = async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    isProcessingRef.current = true;

    const alert = queueRef.current[0];
    setCurrentAlert(alert);
    setIsVisible(true);
    playAlertSound();

    // Wait for pop-in animation (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Play Voice/TTS
    if (alert.message_type === 'audio' && alert.audio_url) {
      // Play recorded audio
      try {
        const audio = new Audio(alert.audio_url);
        audio.volume = 1.0;
        await audio.play();
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            audio.pause();
            audio.src = ''; // Release resource
            resolve();
          }, 15000); // Enforce max 15 seconds limit for safety
          
          audio.onended = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          audio.onerror = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        });
      } catch (err) {
        console.error("Error playing audio url:", err);
      }
    } else if (alert.message_type === 'text' && alert.message) {
      let playedTTS = false;
      const tikTokVoices = ['pt_male_bueno', 'bp_female_ivete', 'bp_female_ludmilla', 'br_001'];
      const isTikTok = tikTokVoices.includes(alert.voice_id || '');
      const isStandard = alert.voice_id === 'standard' || !alert.voice_id;

      // 1. Try Fish Audio if it's a custom Fish voice (any voice ID that is not TikTok and not Standard)
      if (alert.voice_id && !isTikTok && !isStandard) {
        try {
          console.log("Fish Audio - Loading settings from Supabase...");
          const { data: settings } = await supabase
            .from('dotapix_settings')
            .select('fish_audio_key')
            .maybeSingle();

          const apiKey = settings?.fish_audio_key;
          const referenceId = alert.voice_id; // The voice ID stored is the actual model ID!

          console.log("Fish Audio - Settings loaded:", {
            hasKey: !!apiKey,
            referenceId,
            voiceSelected: alert.voice_id
          });

          if (apiKey && referenceId) {
            const payload = {
              text: `${alert.donor_name} enviou ${formatAmountForTTS(alert.amount)}. ${alert.message}`,
              reference_id: referenceId,
              format: 'mp3'
            };

            try {
              console.log("Fish Audio - Requesting via Edge Function proxy...");
              const { data, error } = await supabase.functions.invoke('fish-tts', {
                body: { payload, apiKey }
              });

              if (error) {
                console.error("Fish Audio - Edge Function Error:", error);
                throw error;
              }

              if (data && data.success && data.audioBase64) {
                console.log("Fish Audio - Audio received successfully, playing...");
                const audioUrl = "data:audio/mp3;base64," + data.audioBase64;
                const audio = new Audio(audioUrl);
                audio.volume = 1.0;
                await audio.play();
                await new Promise<void>((resolve) => {
                  const timeoutId = setTimeout(() => {
                    audio.pause();
                    audio.src = '';
                    resolve();
                  }, 15000); // 15 seconds cutoff
                  
                  audio.onended = () => {
                    clearTimeout(timeoutId);
                    resolve();
                  };
                  audio.onerror = (e) => {
                    console.error("Fish Audio - Playback error:", e);
                    clearTimeout(timeoutId);
                    resolve();
                  };
                });
                playedTTS = true;
              } else {
                console.warn("Fish Audio - Failed to get audio from Edge Function.", data);
              }
            } catch (err) {
              console.warn("Fish Audio - Endpoints failed. Falling back to next TTS service.", err);
            }
          } else {
            console.warn("Fish Audio - Missing API Key in dotapix_settings.");
          }
        } catch (err) {
          console.error("Failed to generate Fish Audio speech, trying fallback:", err);
        }
      }

      // 2. Try TikTok TTS if a TikTok voice is selected and not played yet
      if (!playedTTS && isTikTok) {
        try {
          const response = await fetch('https://ottsy.weilbyte.dev/api/generation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: `${alert.donor_name} enviou ${formatAmountForTTS(alert.amount)}. ${alert.message}`,
              voice: alert.voice_id
            })
          });
          const data = await response.json();
          if (data.success && data.data) {
            const audio = new Audio("data:audio/mp3;base64," + data.data);
            audio.volume = 1.0;
            await audio.play();
            await new Promise<void>((resolve) => {
              const timeoutId = setTimeout(() => {
                audio.pause();
                audio.src = '';
                resolve();
              }, 15000); // 15 seconds cutoff
              
              audio.onended = () => {
                clearTimeout(timeoutId);
                resolve();
              };
              audio.onerror = () => {
                clearTimeout(timeoutId);
                resolve();
              };
            });
            playedTTS = true;
          } else {
            console.warn("TikTok TTS API returned success: false, falling back to browser TTS.", data.error);
          }
        } catch (err) {
          console.error("Failed to fetch or play TikTok TTS, falling back to browser TTS:", err);
        }
      }

      // 3. Speak via browser TTS as fallback or if voice is standard
      if (!playedTTS) {
        try {
          await new Promise<void>((resolve) => {
            const textToSpeak = `${alert.donor_name} enviou ${formatAmountForTTS(alert.amount)}. ${alert.message}`;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'pt-BR';

            // Select voices and configuration
            const voices = window.speechSynthesis.getVoices();
            if (alert.voice_id === 'male') {
              const maleVoice = voices.find(v => v.lang.startsWith('pt') && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('masculina')));
              if (maleVoice) utterance.voice = maleVoice;
              utterance.pitch = 0.9;
            } else if (alert.voice_id === 'robot') {
              utterance.pitch = 0.5;
              utterance.rate = 0.75;
            } else if (alert.voice_id === 'fast') {
              utterance.rate = 1.5;
            }

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);

            // Safeguard timeout
            setTimeout(resolve, 10000);
          });
        } catch (err) {
          console.error("Speech Synthesis error:", err);
        }
      }
    }

    // Wait and pop-out
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 800)); // wait exit transition

    // Update database that it was played
    if (!testMode) {
      await supabase.rpc('mark_donation_played', { donation_id: alert.id });
    }

    // Dequeue and loop
    queueRef.current.shift();
    setCurrentAlert(null);
    isProcessingRef.current = false;
    processQueue();
  };

  const [hasInteracted, setHasInteracted] = useState(!!(window as any).obsstudio);

  // Inject Inter font on mount
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!hasInteracted) return;

    // Fetch initial unplayed paid donations
    const fetchInitial = async () => {
      if (testMode) return;
      const { data, error } = await supabase
        .from('dotapix_donations')
        .select('*')
        .eq('is_paid', true)
        .eq('played_on_stream', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        queueRef.current.push(...data.map(item => ({
          id: item.id,
          donor_name: item.donor_name,
          message_type: item.message_type as 'text' | 'audio',
          message: item.message,
          audio_url: item.audio_url,
          amount: Number(item.amount),
          voice_id: item.voice_id
        })));
        processQueue();
      }
    };

    fetchInitial();

    // Set body background to transparent for OBS Studio
    const prevBg = document.body.style.background;
    const prevBgColor = document.body.style.backgroundColor;
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    // 2. Realtime listener for incoming paid donations
    const channel = supabase
      .channel('dotapix_live_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dotapix_donations'
        },
        (payload) => {
          // If a donation is updated to paid (or inserted paid) and not played yet
          const donation = payload.new as any;
          if (donation && donation.is_paid === true && donation.played_on_stream === false) {
            // Avoid duplicate additions
            if (!queueRef.current.some(item => item.id === donation.id) && currentAlert?.id !== donation.id) {
              queueRef.current.push({
                id: donation.id,
                donor_name: donation.donor_name,
                message_type: donation.message_type,
                message: donation.message,
                audio_url: donation.audio_url,
                amount: Number(donation.amount),
                voice_id: donation.voice_id
              });
              processQueue();
            }
          }
        }
      )
      .subscribe();

    // 3. Test alerts listener (custom channel for manual test buttons)
    const testChannel = supabase
      .channel('dotapix_test_alerts')
      .on('broadcast', { event: 'test-alert' }, ({ payload }) => {
        queueRef.current.push({
          id: 'test_' + Date.now(),
          donor_name: payload.donor_name || 'Inscrito DotaPlay',
          message_type: payload.message_type || 'text',
          message: payload.message || 'Esta é uma mensagem de teste do DotaPix!',
          audio_url: payload.audio_url,
          amount: payload.amount || 10.00,
          voice_id: payload.voice_id || 'standard'
        });
        processQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(testChannel);
      document.body.style.background = prevBg;
      document.body.style.backgroundColor = prevBgColor;
    };
  }, [testMode, hasInteracted]);
  if (!hasInteracted) {
    return (
      <div className="w-screen h-screen bg-transparent flex flex-col items-center justify-center font-['Inter']">
        <button 
          onClick={() => setHasInteracted(true)}
          className="bg-[#34c759] hover:bg-[#32d74b] text-black font-black py-4 px-8 rounded-full shadow-[0_0_30px_rgba(52,199,89,0.3)] border-2 border-white/20 transition-all transform hover:scale-105"
        >
          ATIVAR WIDGET<br/>
          <span className="text-sm font-medium opacity-80">(Necessário para permitir áudio no navegador)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center select-none" style={{ fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        @keyframes equalize-tall { 0%, 100% { height: 8px; } 50% { height: 36px; } }
        @keyframes equalize-mid { 0%, 100% { height: 14px; } 50% { height: 26px; } }
        @keyframes equalize-short { 0%, 100% { height: 6px; } 50% { height: 18px; } }
        
        .eq-bar-1 { animation: equalize-tall 0.7s ease-in-out infinite; }
        .eq-bar-2 { animation: equalize-mid 0.5s ease-in-out infinite 0.1s; }
        .eq-bar-3 { animation: equalize-short 0.8s ease-in-out infinite 0.2s; }
        .eq-bar-4 { animation: equalize-tall 0.6s ease-in-out infinite 0.15s; }
        .eq-bar-5 { animation: equalize-mid 0.9s ease-in-out infinite 0.05s; }
        .eq-bar-6 { animation: equalize-short 0.55s ease-in-out infinite 0.25s; }
        .eq-bar-7 { animation: equalize-tall 0.75s ease-in-out infinite 0.1s; }

        @keyframes border-glow-alert {
          0%, 100% { border-color: rgba(52, 199, 89, 0.3); box-shadow: 0 0 15px rgba(52, 199, 89, 0.15); }
          50% { border-color: rgba(52, 199, 89, 0.8); box-shadow: 0 0 30px rgba(52, 199, 89, 0.6); }
        }
        @keyframes border-glow-audio {
          0%, 100% { border-color: rgba(10, 132, 255, 0.3); box-shadow: 0 0 15px rgba(10, 132, 255, 0.15); }
          50% { border-color: rgba(10, 132, 255, 0.8); box-shadow: 0 0 30px rgba(10, 132, 255, 0.6); }
        }
        .glow-alert-active {
          animation: border-glow-alert 2s ease-in-out infinite;
        }
        .glow-audio-active {
          animation: border-glow-audio 2s ease-in-out infinite;
        }
      `}</style>

      {/* Alert Card Container */}
      <div 
        className={`flex flex-col gap-3 transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] transform ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100 blur-none' 
            : 'opacity-0 -translate-y-16 scale-90 blur-sm pointer-events-none'
        }`}
      >
        {currentAlert && (
          <>
            {/* BOX 1: Donor Name & Amount */}
            <div className="w-[450px] min-h-[72px] bg-black border border-neutral-800/80 rounded-[2rem] py-3.5 px-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden flex items-center justify-between glow-alert-active">
              {/* Subtle light reflect at the top */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular Avatar Badge */}
                <div className="w-10 h-10 rounded-full p-[1.5px] bg-[#1c1c1e] shrink-0">
                  <div className="w-full h-full bg-black overflow-hidden rounded-full">
                    <img 
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop" 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="font-black text-xl text-white tracking-tight truncate max-w-[220px]">
                  {currentAlert.donor_name}
                </span>
              </div>

              {/* Amount Pill */}
              <span className="text-xl font-black text-[#34c759] bg-[#34c759]/10 border border-[#34c759]/20 px-4 py-1.5 rounded-full shrink-0 shadow-[0_0_15px_rgba(52,199,89,0.15)]">
                R$ {currentAlert.amount.toFixed(2)}
              </span>
            </div>

            {/* BOX 2: Message Content or Audio Equalizer Wave */}
            <div className={`w-[450px] min-h-[96px] bg-black border border-neutral-800/80 rounded-[2rem] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden flex items-center justify-center ${currentAlert.message_type === 'audio' ? 'glow-audio-active' : ''}`}>
              {/* Subtle light reflect at the top */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

              {currentAlert.message_type === 'audio' ? (
                /* Equalizer Animation */
                <div className="flex flex-col items-center justify-center gap-3 w-full py-1">
                  <div className="flex items-end justify-center gap-1.5 h-9">
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-1" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-2" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-3" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-4" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-5" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-6" />
                    <span className="w-1.5 bg-gradient-to-t from-[#ff3b30] via-[#ffcc00] to-[#34c759] rounded-full eq-bar-7" />
                  </div>
                  <span className="text-xs font-black tracking-widest text-[#0a84ff] uppercase animate-pulse">
                    Reproduzindo Mensagem de Voz
                  </span>
                </div>
              ) : (
                /* Text Message */
                <p className="text-lg font-bold text-neutral-200 text-center leading-relaxed italic px-2">
                  "{currentAlert.message}"
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
