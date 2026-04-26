import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Timer, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type FocusState = 'idle' | 'running' | 'paused' | 'punishment' | 'recovery' | 'finished';

const PRESET_TIMES = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

function AngryFace() {
  return (
    <div className="flex flex-col items-center animate-shake">
      <div className="w-48 h-48 rounded-full bg-[#1a0010] border-4 border-red-700 flex items-center justify-center relative">
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, #2a0018 0%, #0a0008 100%)' }} />
        <div className="relative z-10 flex flex-col items-center gap-3 w-full px-6">
          <div className="flex gap-8">
            <div className="relative">
              <div className="eye-blink-angry w-10 h-10 bg-red-500 rounded-full flex items-center justify-center overflow-hidden">
                <div className="w-5 h-5 bg-black rounded-full eye-shift" />
                <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-[#ff9999]/30 rounded-full" />
              </div>
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <div className="w-10 h-1.5 bg-red-600 rounded" style={{ transform: 'rotate(-15deg)', transformOrigin: 'right' }} />
              </div>
            </div>
            <div className="relative">
              <div className="eye-blink-angry w-10 h-10 bg-red-500 rounded-full flex items-center justify-center overflow-hidden">
                <div className="w-5 h-5 bg-black rounded-full eye-shift" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff9999]/30 rounded-full" />
              </div>
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <div className="w-10 h-1.5 bg-red-600 rounded" style={{ transform: 'rotate(15deg)', transformOrigin: 'left' }} />
              </div>
            </div>
          </div>
          <div className="w-16 h-3 bg-red-600 rounded-full" style={{ borderRadius: '0 0 20px 20px', background: 'linear-gradient(180deg, #dc2626, #991b1b)' }} />
        </div>
      </div>
    </div>
  );
}

function HappyFace() {
  return (
    <div className="flex flex-col items-center animate-happy-bounce">
      <div className="w-48 h-48 rounded-full flex items-center justify-center relative" style={{ background: 'radial-gradient(circle, #064e3b 0%, #022c22 100%)', border: '4px solid #10b981' }}>
        <div className="relative z-10 flex flex-col items-center gap-3 w-full px-8">
          <div className="flex gap-8">
            <div className="eye-blink-happy w-9 h-9 bg-[#34d399] rounded-full flex items-center justify-center overflow-hidden">
              <div className="w-4 h-4 bg-[#022c22] rounded-full" />
              <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-white/40 rounded-full" />
            </div>
            <div className="eye-blink-happy w-9 h-9 bg-[#34d399] rounded-full flex items-center justify-center overflow-hidden">
              <div className="w-4 h-4 bg-[#022c22] rounded-full" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="w-14 h-7 border-b-4 border-[#34d399] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function FocusMode() {
  const { user, isGuest } = useAuth();
  const [state, setState] = useState<FocusState>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sound, setSound] = useState(true);
  const [punishmentMessage, setPunishmentMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const PUNISHMENT_MESSAGES = [
    "HEY! Get back here! Your focus session needs you!",
    "TAB SWITCHER DETECTED! Back to work, NOW!",
    "Was that really necessary?! FOCUS!",
    "Your future self is disappointed. BACK TO WORK!",
    "Every distraction is a vote against your goals!",
  ];

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === 'running') {
        setTabSwitches(n => n + 1);
        setState('punishment');
        clearTimer();
        setPunishmentMessage(PUNISHMENT_MESSAGES[Math.floor(Math.random() * PUNISHMENT_MESSAGES.length)]);
      }
      if (!document.hidden && state === 'punishment') {
        setState('recovery');
        setTimeout(() => setState('running'), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state, clearTimer]);

  useEffect(() => {
    if (state === 'running') {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearTimer();
            setState('finished');
            saveSession(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [state, clearTimer]);

  async function saveSession(completed: boolean) {
    if (isGuest) return;
    if (!user) return;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 60000) || 1;
    if (sessionId) {
      await supabase.from('focus_sessions').update({ completed, tab_switches: tabSwitches }).eq('id', sessionId);
    } else {
      await supabase.from('focus_sessions').insert({ user_id: user.id, duration_minutes: selectedMinutes, completed, tab_switches: tabSwitches });
    }
  }

  async function startSession() {
    setTimeLeft(selectedMinutes * 60);
    setTabSwitches(0);
    setState('running');
    startTimeRef.current = Date.now();
    if (!isGuest && user) {
      const { data } = await supabase.from('focus_sessions').insert({ user_id: user.id, duration_minutes: selectedMinutes, completed: false }).select().maybeSingle();
      if (data) setSessionId(data.id);
    }
  }

  function pauseSession() {
    setState(s => s === 'running' ? 'paused' : 'running');
  }

  function resetSession() {
    clearTimer();
    setState('idle');
    setTimeLeft(selectedMinutes * 60);
    setTabSwitches(0);
    setSessionId(null);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = selectedMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 120;

  if (state === 'punishment') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-6 animate-red-pulse">
        <div className="absolute inset-0 bg-[#050008]" />
        <div className="relative z-10 text-center">
          <AngryFace />
          <div className="mt-8 space-y-3">
            <p className="text-red-400 text-2xl font-black animate-shake">{punishmentMessage}</p>
            <p className="text-red-600/60 text-sm">Switch back to this tab to continue...</p>
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(tabSwitches)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-red-500" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'recovery') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-6" style={{ background: '#020f0a' }}>
        <HappyFace />
        <div className="text-center mt-4">
          <p className="text-[#34d399] text-2xl font-black">Welcome back!</p>
          <p className="text-green-400/60 text-sm mt-2">Resuming your focus session in 3 seconds...</p>
        </div>
      </div>
    );
  }

  if (state === 'finished') {
    return (
      <div className="flex-1 p-6 lg:p-8 flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-6 animate-bounce-in">
            <HappyFace />
          </div>
          <h2 className="text-4xl font-black text-white mb-3">Session Complete!</h2>
          <p className="text-white/50 mb-2">You focused for <span className="text-[#f5c518] font-bold">{selectedMinutes} minutes</span></p>
          {tabSwitches > 0 && <p className="text-orange-400/70 text-sm mb-6">Tab switches: {tabSwitches}</p>}
          {tabSwitches === 0 && <p className="text-[#34d399] text-sm mb-6 font-semibold">Perfect focus — no distractions!</p>}
          <div className="flex gap-3 justify-center">
            <button onClick={resetSession} className="btn-primary"><RotateCcw size={18} /> New Session</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Focus Mode</h1>
            <p className="text-white/40 text-sm mt-1">Deep work, no distractions</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSound(!sound)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {state === 'idle' && (
              <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>

        {state === 'idle' && showSettings && (
          <div className="card mb-6 animate-slide-up">
            <p className="text-white/60 text-sm font-medium mb-3">Session Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_TIMES.map(({ label, value }) => (
                <button key={value} onClick={() => { setSelectedMinutes(value); setTimeLeft(value * 60); }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${selectedMinutes === value ? 'bg-[#f5c518] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-white/40 text-xs mb-2">Custom (minutes)</p>
              <input
                type="range" min={5} max={120} step={5} value={selectedMinutes}
                onChange={e => { const v = Number(e.target.value); setSelectedMinutes(v); setTimeLeft(v * 60); }}
                className="w-full accent-[#f5c518]"
              />
              <p className="text-[#f5c518] text-sm font-bold mt-1">{selectedMinutes} min</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <svg width="280" height="280" className={state === 'running' ? 'animate-timer-pulse' : ''}>
              <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="140" cy="140" r="120" fill="none"
                stroke={state === 'paused' ? '#f97316' : '#f5c518'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * progress / 100)}
                transform="rotate(-90 140 140)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-white tabular-nums tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-white/40 text-sm mt-1 font-medium">
                {state === 'idle' ? 'ready' : state === 'running' ? 'focusing' : state === 'paused' ? 'paused' : ''}
              </div>
              {tabSwitches > 0 && (
                <div className="mt-2 flex items-center gap-1 text-orange-400 text-xs">
                  <span>{tabSwitches} tab switch{tabSwitches > 1 ? 'es' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {seconds <= 60 && state === 'running' && (
            <div className="glass rounded-xl px-4 py-2 border border-orange-500/30 animate-bounce-in">
              <p className="text-orange-400 text-sm font-medium text-center">Less than 60 seconds remaining!</p>
            </div>
          )}

          <div className="flex gap-4">
            {state === 'idle' ? (
              <button onClick={startSession} className="btn-primary text-lg px-10 py-4">
                <Play size={22} /> Start Focus
              </button>
            ) : (
              <>
                <button onClick={pauseSession} className="btn-secondary px-8 py-4">
                  {state === 'paused' ? <Play size={20} /> : <Pause size={20} />}
                  {state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => { resetSession(); saveSession(false); }} className="w-14 h-14 glass rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <RotateCcw size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { label: 'Tab switches', value: tabSwitches, color: tabSwitches > 0 ? '#ff5757' : '#34d399' },
            { label: 'Session length', value: `${selectedMinutes}m`, color: '#f5c518' },
            { label: 'Progress', value: `${Math.round(progress)}%`, color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-white/40 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="card mt-6">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Timer size={16} className="text-[#f5c518]" /> Focus Tips</h3>
          <div className="space-y-2">
            {[
              'Stay on this tab — switching triggers punishment mode',
              'Silence your phone and close social media',
              'Work on one task at a time',
              'Take a 5-min break after each session',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/50">
                <span className="text-[#f5c518] shrink-0 font-bold">{i + 1}.</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
