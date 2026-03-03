import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Timer as TimerIcon, Clock } from 'lucide-react';

export default function TimerPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  
  // Timer state
  const [time, setTime] = useState(120);
  const [isRunning, setIsRunning] = useState(false);

  // Stopwatch state
  const [swTime, setSwTime] = useState(0);
  const [swIsRunning, setSwIsRunning] = useState(false);
  const [swCountdown, setSwCountdown] = useState(0);
  const [swIsCountingDown, setSwIsCountingDown] = useState(false);

  useEffect(() => {
    let interval: any;
    if (mode === 'timer') {
      if (isRunning && time > 0) {
        interval = setInterval(() => {
          setTime(t => t - 1);
        }, 1000);
      } else if (time === 0 && isRunning) {
        setIsRunning(false);
        playBeep();
        if (navigator.vibrate) {
          try { navigator.vibrate([200, 100, 200, 100, 400]); } catch (e) {}
        }
      }
    } else {
      if (swIsCountingDown && swCountdown > 0) {
        interval = setInterval(() => {
          setSwCountdown(c => c - 1);
        }, 1000);
      } else if (swIsCountingDown && swCountdown === 0) {
        setSwIsCountingDown(false);
        setSwIsRunning(true);
        playBeep();
        if (navigator.vibrate) {
          try { navigator.vibrate([200]); } catch (e) {}
        }
      } else if (swIsRunning) {
        interval = setInterval(() => {
          setSwTime(t => t + 1);
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [mode, isRunning, time, swIsRunning, swIsCountingDown, swCountdown]);

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playObj = (freq: number, t: number, type: any) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + t + 0.3);
        osc.stop(ctx.currentTime + t + 0.3);
      };
      playObj(800, 0, 'sine');
      playObj(1000, 0.2, 'sine');
      playObj(1200, 0.4, 'sine');
    } catch (e) { console.error(e); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isRunning && time === 0) setTime(120);
    setIsRunning(!isRunning);
  };

  const toggleStopwatch = () => {
    if (!swIsRunning && !swIsCountingDown) {
      if (swTime === 0) {
        setSwCountdown(10);
        setSwIsCountingDown(true);
      } else {
        setSwIsRunning(true);
      }
    } else if (swIsCountingDown) {
      setSwIsCountingDown(false);
    } else {
      setSwIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      <button onClick={onClose} className="absolute top-6 right-6 p-3 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors">
        <X className="w-8 h-8" />
      </button>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-full mb-12 border border-white/10">
        <button 
          onClick={() => setMode('timer')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${mode === 'timer' ? 'bg-emerald-400 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <TimerIcon className="w-5 h-5" /> Temporizador
        </button>
        <button 
          onClick={() => setMode('stopwatch')} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${mode === 'stopwatch' ? 'bg-emerald-400 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <Clock className="w-5 h-5" /> Cronómetro
        </button>
      </div>
      
      {mode === 'timer' ? (
        <>
          <div className="text-8xl font-bold tabular-nums text-center mb-12 text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] tracking-tight">
            {formatTime(time)}
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-12">
            <button onClick={() => setTime(Math.max(0, time - 30))} className="bg-white/10 text-white rounded-2xl px-6 py-4 font-semibold hover:bg-white/20 text-lg transition-colors">-30s</button>
            <button 
              onClick={toggleTimer} 
              className={`w-24 h-24 rounded-full flex items-center justify-center text-black shadow-lg transition-transform active:scale-95 ${isRunning ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-emerald-400 shadow-emerald-400/30'}`}
            >
              {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
            </button>
            <button onClick={() => setTime(time + 30)} className="bg-white/10 text-white rounded-2xl px-6 py-4 font-semibold hover:bg-white/20 text-lg transition-colors">+30s</button>
          </div>
          
          <button 
            onClick={() => { setTime(120); setIsRunning(false); }}
            className="px-8 py-3 bg-transparent border-2 border-gray-600 text-gray-300 rounded-xl text-lg font-medium hover:bg-white/5 transition-colors"
          >
            Reiniciar (2:00)
          </button>
        </>
      ) : (
        <>
          <div className="text-8xl font-bold tabular-nums text-center mb-12 text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] tracking-tight relative">
            {swIsCountingDown ? (
              <span className="text-yellow-400 text-7xl">Prep: {swCountdown}s</span>
            ) : (
              formatTime(swTime)
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-12">
            <button 
              onClick={toggleStopwatch} 
              className={`w-24 h-24 rounded-full flex items-center justify-center text-black shadow-lg transition-transform active:scale-95 ${(swIsRunning || swIsCountingDown) ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-emerald-400 shadow-emerald-400/30'}`}
            >
              {(swIsRunning || swIsCountingDown) ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
            </button>
          </div>
          
          <button 
            onClick={() => { setSwTime(0); setSwIsRunning(false); setSwIsCountingDown(false); }}
            className="px-8 py-3 bg-transparent border-2 border-gray-600 text-gray-300 rounded-xl text-lg font-medium hover:bg-white/5 transition-colors"
          >
            Reiniciar (0:00)
          </button>
        </>
      )}
    </div>
  );
}
