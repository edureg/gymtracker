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
    <div className="fixed bottom-[90px] right-6 bg-slate-900/95 border border-white/10 rounded-2xl p-4 backdrop-blur-md z-[101] shadow-2xl w-[240px]">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-3">
          <button 
            onClick={() => setMode('timer')} 
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${mode === 'timer' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <TimerIcon className="w-4 h-4" /> Timer
          </button>
          <button 
            onClick={() => setMode('stopwatch')} 
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${mode === 'stopwatch' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Clock className="w-4 h-4" /> Crono
          </button>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      
      {mode === 'timer' ? (
        <>
          <div className="text-4xl font-bold tabular-nums text-center mb-4 text-white drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
            {formatTime(time)}
          </div>
          
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => setTime(Math.max(0, time - 30))} className="bg-white/10 text-white rounded-lg px-3 py-2 font-semibold hover:bg-white/20">-30s</button>
            <button 
              onClick={toggleTimer} 
              className={`w-11 h-11 rounded-full flex items-center justify-center text-black ${isRunning ? 'bg-red-500 text-white' : 'bg-emerald-400'}`}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={() => setTime(time + 30)} className="bg-white/10 text-white rounded-lg px-3 py-2 font-semibold hover:bg-white/20">+30s</button>
          </div>
          
          <button 
            onClick={() => { setTime(120); setIsRunning(false); }}
            className="w-full bg-transparent border border-gray-500 text-gray-400 py-1.5 rounded-xl text-sm hover:bg-white/5"
          >
            Reiniciar (2:00)
          </button>
        </>
      ) : (
        <>
          <div className="text-4xl font-bold tabular-nums text-center mb-4 text-white drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] relative">
            {swIsCountingDown ? (
              <span className="text-yellow-400 text-3xl">Prep: {swCountdown}s</span>
            ) : (
              formatTime(swTime)
            )}
          </div>
          
          <div className="flex justify-center gap-3 mb-3">
            <button 
              onClick={toggleStopwatch} 
              className={`w-11 h-11 rounded-full flex items-center justify-center text-black ${(swIsRunning || swIsCountingDown) ? 'bg-red-500 text-white' : 'bg-emerald-400'}`}
            >
              {(swIsRunning || swIsCountingDown) ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
          </div>
          
          <button 
            onClick={() => { setSwTime(0); setSwIsRunning(false); setSwIsCountingDown(false); }}
            className="w-full bg-transparent border border-gray-500 text-gray-400 py-1.5 rounded-xl text-sm hover:bg-white/5"
          >
            Reiniciar (0:00)
          </button>
        </>
      )}
    </div>
  );
}
