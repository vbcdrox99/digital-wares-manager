import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function OpenDotaWidgetPage() {
  const [activeCard, setActiveCard] = useState<any>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';

    const channel = supabase.channel('ai-caster-events')
      .on('broadcast', { event: 'new-ai-card' }, (payload) => {
        setActiveCard(payload.payload);
        setImgError(false);

        // TTS via TikTok
        if (payload.payload.ttsVoice && payload.payload.description) {
          const textToSpeak = `${payload.payload.title}. ${payload.payload.description}`;
          fetch('https://ottsy.weilbyte.dev/api/generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak, voice: payload.payload.ttsVoice })
          }).then(res => res.json()).then(data => {
            if (data.success && data.data) {
              const audio = new Audio("data:audio/mp3;base64," + data.data);
              audio.volume = 1;
              audio.play().catch(() => {});
            }
          }).catch(console.error);
        }

        setTimeout(() => setActiveCard(null), 18000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

        @keyframes border-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(47,208,223,0.3), 0 0 20px rgba(47,208,223,0.15), 0 25px 60px -15px rgba(0,0,0,0.9); }
          50%       { box-shadow: 0 0 0 1px rgba(47,208,223,0.9), 0 0 40px rgba(47,208,223,0.4), 0 25px 60px -15px rgba(0,0,0,0.9); }
        }
        @keyframes badge-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ai-card-pulse { animation: border-pulse 2.5s ease-in-out infinite; }
        .google-badge {
          background: linear-gradient(90deg, #4285f4, #ea4335, #fbbc04, #34a853, #4285f4);
          background-size: 200% auto;
          animation: badge-shimmer 3s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <AnimatePresence>
        {activeCard && (
          <motion.div
            key={activeCard.title + activeCard.highlight}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="fixed bottom-10 right-10 w-[460px] bg-[#0a0a0a] border border-neutral-800 rounded-[28px] overflow-hidden z-50 ai-card-pulse"
          >
            {/* Top light streak */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Header: Avatar + Title + Badge */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              {activeCard.avatar && !imgError ? (
                <img
                  src={activeCard.avatar}
                  alt="avatar"
                  onError={() => setImgError(true)}
                  className="w-[52px] h-[52px] rounded-2xl object-cover border border-neutral-700 shrink-0"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-2xl bg-neutral-800 flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#2fd0df" opacity="0.7"/>
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="block text-[17px] font-black text-white uppercase tracking-tight leading-tight truncate">
                  {activeCard.title}
                </span>
                {activeCard.player_name && (
                  <span className="block text-[11px] text-neutral-500 font-semibold uppercase tracking-widest mt-0.5 truncate">
                    {activeCard.player_name}
                  </span>
                )}
              </div>

              {/* Google AI Badge */}
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">powered by</span>
                <span className="google-badge text-[11px] font-black tracking-wide">Google AI</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-neutral-800/80" />

            {/* Stats block */}
            <div className="px-5 py-4 flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-black text-[#2fd0df] tracking-tight leading-none">
                  {activeCard.highlight}
                </span>
              </div>
              <p className="text-[13px] text-neutral-300 font-medium leading-snug">
                {activeCard.description}
              </p>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2fd0df] animate-pulse" />
                <span className="text-[10px] text-neutral-600 font-semibold uppercase tracking-widest">Live · Dota 2 Analytics</span>
              </div>
              <span className="text-[10px] text-neutral-700 font-mono">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
