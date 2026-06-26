import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Clock, Sparkles, QrCode } from "lucide-react";

interface GoalData {
  title: string;
  target: number;
  current: number;
  startDate: string;
  endDate: string | null;
  enabled: boolean;
  command: string;
}

export default function DotaPixGoalWidgetPage() {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [mode, setMode] = useState<'goal' | 'promo'>('goal');
  const [ytSettings, setYtSettings] = useState<{ key: string; channelId: string; enabled: boolean } | null>(null);

  // Inject Inter font on mount
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Set body transparent for OBS Studio
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Toggle between Goal progress (45s) and Call-to-action (15s)
  useEffect(() => {
    let timeoutId: any;
    
    const tick = () => {
      setMode(prev => {
        const nextMode = prev === 'goal' ? 'promo' : 'goal';
        const delay = nextMode === 'goal' ? 45000 : 15000;
        timeoutId = setTimeout(tick, delay);
        return nextMode;
      });
    };
    
    timeoutId = setTimeout(tick, 45000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const getRemainingTime = (endDateStr: string | null) => {
    if (!endDateStr) return null;
    const diff = new Date(endDateStr).getTime() - Date.now();
    if (diff <= 0) return 'Encerrada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const fetchGoalData = async () => {
    try {
      // 1. Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('dotapix_settings')
        .select('*')
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (!settingsData || !settingsData.goal_enabled) {
        setGoal(null);
        return;
      }

      // 2. Sum donations since start date
      const { data: donationsData, error: donationsError } = await supabase
        .from('dotapix_donations')
        .select('amount')
        .eq('is_paid', true)
        .gte('created_at', settingsData.goal_start_date);

      if (donationsError) throw donationsError;

      const totalRaised = (donationsData || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const initialValue = Number(settingsData.goal_initial_value) || 0;

      setGoal({
        title: settingsData.goal_title || 'Meta da Live',
        target: Number(settingsData.goal_target) || 500,
        current: totalRaised + initialValue,
        startDate: settingsData.goal_start_date,
        endDate: settingsData.goal_end_date,
        enabled: settingsData.goal_enabled,
        command: settingsData.goal_command || '!pix'
      });

      setYtSettings({
        key: settingsData.youtube_api_key || '',
        channelId: settingsData.youtube_channel_id || '',
        enabled: !!settingsData.youtube_integration_enabled
      });
    } catch (err) {
      console.error("Error loading goal data:", err);
    }
  };

  useEffect(() => {
    if (!goal || !goal.endDate) {
      setTimeLeft(null);
      return;
    }
    
    const updateTime = () => {
      setTimeLeft(getRemainingTime(goal.endDate));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [goal]);

  // YouTube live chat polling effect
  useEffect(() => {
    if (!ytSettings || !ytSettings.enabled || !ytSettings.key || !ytSettings.channelId) return;

    let activeChatId: string | null = null;
    let nextPageToken: string | null = null;
    let isPolling = false;
    let pollInterval: any = null;
    let checkLiveInterval: any = null;

    const findActiveChatId = async () => {
      try {
        console.log("YouTube - Checking if live stream is active...");
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytSettings.channelId}&type=video&eventType=live&key=${ytSettings.key}`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) throw new Error("Search API failed");
        const searchData = await searchRes.json();
        
        if (searchData.items && searchData.items.length > 0) {
          const videoId = searchData.items[0].id.videoId;
          console.log("YouTube - Live stream found! Video ID:", videoId);

          const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${ytSettings.key}`;
          const videoRes = await fetch(videoUrl);
          if (!videoRes.ok) throw new Error("Video Details API failed");
          const videoData = await videoRes.json();

          if (videoData.items && videoData.items.length > 0) {
            const chatID = videoData.items[0].liveStreamingDetails?.activeLiveChatId;
            if (chatID && chatID !== activeChatId) {
              activeChatId = chatID;
              nextPageToken = null;
              console.log("YouTube - Active Live Chat ID obtained:", activeChatId);
              startPolling();
            }
          }
        } else {
          console.log("YouTube - Stream is offline.");
          stopPolling();
        }
      } catch (err) {
        console.error("YouTube - Error finding live stream:", err);
      }
    };

    const pollMessages = async () => {
      if (!activeChatId || isPolling) return;
      isPolling = true;
      try {
        const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${activeChatId}&part=snippet,authorDetails&key=${ytSettings.key}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 403 || res.status === 404) {
            activeChatId = null;
            stopPolling();
          }
          throw new Error("Chat Messages API failed");
        }
        const data = await res.json();
        nextPageToken = data.nextPageToken;

        if (data.items && data.items.length > 0) {
          console.log("YouTube - Fetched messages:", data.items.length);
          for (const item of data.items) {
            const superChatDetails = item.snippet?.superChatDetails;
            if (superChatDetails) {
              const amountMicros = Number(superChatDetails.amountMicros);
              const amount = amountMicros / 1000000;
              const donorName = item.authorDetails?.displayName || 'Doador YouTube';
              const userComment = superChatDetails.userComment || '';
              const messageId = item.id;

              console.log("YouTube - Super Chat Detected!", { donorName, amount, userComment, messageId });

              const { error } = await supabase
                .from('dotapix_donations')
                .insert({
                  donor_name: donorName,
                  message_type: 'text',
                  message: userComment || 'Enviou um Super Chat!',
                  amount: amount,
                  is_paid: true,
                  played_on_stream: false,
                  source: 'youtube',
                  external_id: messageId
                });

              if (error) {
                if (error.code === '23505') {
                  console.log("YouTube - Super Chat already processed.");
                } else {
                  console.error("YouTube - Error inserting Super Chat:", error);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("YouTube - Polling error:", err);
      } finally {
        isPolling = false;
      }
    };

    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(pollMessages, 8000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    findActiveChatId();
    checkLiveInterval = setInterval(findActiveChatId, 60000);

    return () => {
      stopPolling();
      if (checkLiveInterval) clearInterval(checkLiveInterval);
    };
  }, [ytSettings]);

  const celebrationTimeoutRef = React.useRef<any>(null);
  const [celebrating, setCelebrating] = useState(false);

  const triggerCelebration = () => {
    setCelebrating(true);
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current);
    }
    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebrating(false);
      celebrationTimeoutRef.current = null;
    }, 10000);
  };

  useEffect(() => {
    fetchGoalData();

    // Subscribe to donations updates (to update goal dynamically)
    const donationsChannel = supabase
      .channel('dotapix_goal_donations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dotapix_donations'
        },
        (payload) => {
          fetchGoalData();
          // Trigger celebration on a paid donation insert/update
          if (payload.new && (payload.new as any).is_paid === true) {
            triggerCelebration();
          }
        }
      )
      .subscribe();

    // Subscribe to test alerts broadcast channel
    const testAlertsChannel = supabase
      .channel('dotapix_test_alerts')
      .on('broadcast', { event: 'test-alert' }, () => {
        triggerCelebration();
      })
      .subscribe();

    // Subscribe to settings changes (in case target or title is updated)
    const settingsChannel = supabase
      .channel('dotapix_goal_settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dotapix_settings'
        },
        () => {
          fetchGoalData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationsChannel);
      supabase.removeChannel(testAlertsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  if (!goal) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-cyan-400 font-bold uppercase tracking-wider text-sm bg-transparent">
        {/* Render nothing or simple message if no goal active */}
      </div>
    );
  }

  const percentage = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4 bg-transparent select-none" style={{ fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        @keyframes float-money {
          0% { transform: translateY(60px) scale(0.6) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-60px) scale(1.1) rotate(360deg); opacity: 0; }
        }
        @keyframes move-stripes {
          0% { background-position: 24px 0; }
          100% { background-position: 0 0; }
        }
        .money-particle {
          position: absolute;
          animation: float-money 4s ease-in-out infinite;
          pointer-events: none;
          font-size: 1.5rem;
          z-index: 30;
        }
      `}</style>

        {/* Outer container: Dota 2 HUD themed glassmorphic card */}
        <div 
          className={`w-[540px] h-[116px] py-3 px-6 relative overflow-hidden flex flex-col justify-center transition-all duration-300 rounded-[2rem] border`}
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.7) 100%)',
            borderColor: celebrating ? '#fbbf24' : 'rgba(251, 191, 36, 0.25)',
            boxShadow: celebrating 
              ? '0 16px 45px rgba(0, 0, 0, 0.9), 0 0 35px rgba(251, 191, 36, 0.4), inset 0 0 10px rgba(251, 191, 36, 0.15)'
              : '0 16px 40px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 25px rgba(251, 191, 36, 0.05)',
            transform: celebrating ? 'scale(1.03)' : 'scale(1)',
            backdropFilter: 'blur(16px)'
          }}
        >

        {/* Celebration Particles Overlay */}
        {celebrating && (
          <>
            <div className="money-particle" style={{ left: '10%', animationDelay: '0s' }}>💸</div>
            <div className="money-particle" style={{ left: '30%', animationDelay: '1.2s' }}>💰</div>
            <div className="money-particle" style={{ left: '50%', animationDelay: '0.4s' }}>💵</div>
            <div className="money-particle" style={{ left: '70%', animationDelay: '2s' }}>💸</div>
            <div className="money-particle" style={{ left: '85%', animationDelay: '0.8s' }}>💰</div>
          </>
        )}

        {/* MODE 1: Goal Progress */}
        <div className={`flex flex-col gap-2 w-full min-h-[80px] justify-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
          mode === 'goal' 
            ? 'opacity-100 scale-100 translate-x-0 blur-none' 
            : 'opacity-0 scale-90 -translate-x-8 blur-sm absolute inset-x-6 pointer-events-none'
        }`}>
          {/* Top row: Title and status */}
          <div className="flex justify-between items-center relative z-10 px-0.5 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span 
                className="text-lg font-black uppercase tracking-wider truncate"
                style={{
                  color: '#f8fafc',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
                }}
              >
                {goal.title}
              </span>
            </div>
            {timeLeft ? (
              <span 
                className="text-xs font-extrabold flex items-center gap-1 shrink-0 px-3.5 py-1 rounded-full"
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)'
                }}
              >
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="tracking-wider">{timeLeft}</span>
              </span>
            ) : (
              <span 
                className="text-xs font-extrabold shrink-0 px-3.5 py-1 rounded-full tracking-wider"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}
              >
                META DA LIVE
              </span>
            )}
          </div>

          {/* Goal Bar: Thin with animated fill and handle */}
          <div 
            className="w-full relative my-1.5 rounded-full shrink-0 flex items-center"
            style={{ 
              height: '14px', 
              background: 'rgba(2, 6, 23, 0.95)',
              border: '1px solid rgba(248, 250, 252, 0.08)',
              boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* The fill mask that grows with percentage */}
            <div 
              className="absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out overflow-hidden rounded-full"
              style={{ 
                width: `${percentage}%`
              }}
            >
              {/* The full-width gradient that stays fixed relative to the container */}
              <div 
                className="absolute left-0 top-0 bottom-0"
                style={{ 
                  width: '492px', // Matches the width of the track
                  background: 'linear-gradient(90deg, #f43f5e 0%, #fbbf24 50%, #10b981 100%)',
                  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* "Filling" animation overlay: a subtle moving shimmer/stripe */}
                <div 
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
                    backgroundSize: '24px 24px',
                    animation: 'move-stripes 1.5s linear infinite'
                  }}
                />
              </div>
            </div>

            {/* The handle (Bolinha) exactly like the image */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-1000 ease-out z-20"
              style={{ 
                width: '24px',
                height: '24px',
                left: `calc(${percentage}% - 12px)`,
                background: '#0f172a',
                border: '2px solid #fbbf24',
                boxShadow: '0 0 12px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {/* Green gem core */}
              <div 
                className="rounded-full"
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981, inset 0 1px 2px rgba(255, 255, 255, 0.8)'
                }}
              />
            </div>
          </div>

          {/* Bottom row: Current value, Target and percentage */}
          <div className="flex justify-between items-center relative z-10 font-extrabold text-sm tracking-wide mt-0.5 px-0.5 shrink-0">
            <span 
              className="text-xl font-black tracking-tight"
              style={{
                color: '#f8fafc',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
              }}
            >
              R$ <span style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}>{goal.current.toFixed(2)}</span>
            </span>

            <div 
              className="text-center font-black text-xs px-3.5 py-1 rounded-full"
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: '#fbbf24',
                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)'
              }}
            >
              {percentage.toFixed(0)}%
            </div>

            <span 
              className="text-xl font-black tracking-tight"
              style={{
                color: '#f8fafc',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
              }}
            >
              R$ <span style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}>{goal.target.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* MODE 2: Call-To-Action (Promo) */}
        <div className={`flex items-center w-full min-h-[80px] justify-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
          mode === 'promo' 
            ? 'opacity-100 scale-100 translate-x-0 blur-none' 
            : 'opacity-0 scale-90 translate-x-8 blur-sm absolute inset-x-6 pointer-events-none'
        }`}>
          {/* Middle text area - Gaming Styled */}
          <div className="w-full text-center space-y-3 flex flex-col items-center justify-center">
            <span 
              className="text-sm font-black tracking-widest uppercase"
              style={{
                color: '#e2e8f0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 1)'
              }}
            >
              {timeLeft && timeLeft !== 'Encerrada' ? `A meta encerra em ${timeLeft}` : 'A meta está ativa'}
            </span>
            <p 
              className="text-2xl font-black leading-snug flex items-center justify-center"
              style={{
                color: '#ffffff',
                textShadow: '0 2px 6px rgba(0, 0, 0, 1)'
              }}
            >
              Caso queira ajudar digite 
              <span 
                className="px-4 py-1.5 rounded-lg font-mono text-3xl font-black ml-3 animate-pulse"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '2px solid rgba(251, 191, 36, 0.6)',
                  color: '#fbbf24',
                  textShadow: '0 0 15px rgba(251, 191, 36, 0.6)',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25), inset 0 2px 4px rgba(251, 191, 36, 0.1)'
                }}
              >
                {goal.command}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

