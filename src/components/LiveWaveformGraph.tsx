import React, { useEffect, useRef, useState } from 'react';
import { EngineTelemetry, EngineConfig } from '../types/engine';
import { Activity, Play, Pause, Waves, RefreshCw } from 'lucide-react';

interface LiveWaveformGraphProps {
  telemetry: EngineTelemetry;
  config: EngineConfig;
}

export const LiveWaveformGraph: React.FC<LiveWaveformGraphProps> = ({
  telemetry,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'stream' | 'crank_cycle'>('stream');
  const [displaySignal, setDisplaySignal] = useState<'pressure' | 'torque' | 'both'>('both');

  // Ring buffer for streaming waveform history
  const historyRef = useRef<
    Array<{
      time: number;
      rpm: number;
      cylPressures: number[];
      torque: number;
    }>
  >([]);

  // Timestamp and animation reference
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  // Accumulate telemetry data on each frame
  useEffect(() => {
    if (isPaused) return;

    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    const cylPressures = telemetry.cylinders.map((c) => c.pressureBar);
    const instantTorque = telemetry.torqueNm;

    historyRef.current.push({
      time: now,
      rpm: telemetry.rpm,
      cylPressures,
      torque: instantTorque,
    });

    // Keep last 240 samples (~4 seconds at 60fps)
    if (historyRef.current.length > 240) {
      historyRef.current.shift();
    }
  }, [telemetry, isPaused]);

  // Canvas Waveform Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark oscilloscope canvas background
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, width, height);

      // Draw Oscilloscope Grid Lines
      ctx.strokeStyle = '#0f2942';
      ctx.lineWidth = 1;
      const gridCountX = 10;
      const gridCountY = 6;

      for (let i = 0; i <= gridCountX; i++) {
        const x = (width / gridCountX) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let j = 0; j <= gridCountY; j++) {
        const y = (height / gridCountY) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.75);
      ctx.lineTo(width, height * 0.75);
      ctx.stroke();

      const history = historyRef.current;
      const cylColors = [
        '#38bdf8', // Cyl 1: Sky Blue
        '#f59e0b', // Cyl 2: Amber
        '#10b981', // Cyl 3: Emerald
        '#f43f5e', // Cyl 4: Rose
        '#a855f7', // Cyl 5: Purple
        '#06b6d4', // Cyl 6: Cyan
        '#ec4899', // Cyl 7: Pink
        '#84cc16', // Cyl 8: Lime
      ];

      if (viewMode === 'stream') {
        // --- Mode A: Realtime Rolling Oscilloscope Stream (うねうね波形) ---
        if (history.length > 2) {
          const maxSamples = 240;
          const stepX = width / maxSamples;

          // 1. Draw Individual Cylinder Pressures (うねうね脈動波)
          if (displaySignal === 'pressure' || displaySignal === 'both') {
            const numCyls = config.cylinderCount;
            for (let cIdx = 0; cIdx < numCyls; cIdx++) {
              ctx.strokeStyle = cylColors[cIdx % cylColors.length];
              ctx.lineWidth = 2;
              ctx.shadowColor = cylColors[cIdx % cylColors.length];
              ctx.shadowBlur = 6;
              ctx.beginPath();

              history.forEach((sample, idx) => {
                const x = width - (history.length - 1 - idx) * stepX;
                const press = sample.cylPressures[cIdx] || 1;
                // Max pressure scale ~65 bar
                const normalizedY = Math.min(1, Math.max(0, press / 65));
                const y = height * 0.82 - normalizedY * (height * 0.72);

                if (idx === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              });
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }

          // 2. Draw Total Dynamic Torque Pulsation (合成トルク脈動のうねり波)
          if (displaySignal === 'torque' || displaySignal === 'both') {
            ctx.strokeStyle = '#eab308'; // Glowing Gold
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 8;
            ctx.beginPath();

            history.forEach((sample, idx) => {
              const x = width - (history.length - 1 - idx) * stepX;
              // Add dynamic live ripple wave based on engine RPM and stroke harmonics
              const rippleHarmonic =
                Math.sin((sample.time * 0.012 * sample.rpm) / 60) * (sample.torque * 0.12);
              const totalVal = Math.max(0, sample.torque + rippleHarmonic);
              const normalizedT = Math.min(1, totalVal / 450);
              const y = height * 0.82 - normalizedT * (height * 0.65);

              if (idx === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      } else {
        // --- Mode B: 0° - 720° 4-Stroke Crank Angle Live Envelope (クランク角波形) ---
        const crankAngle = telemetry.crankAngleDeg;
        const pts = 180;
        const step = (width - 40) / pts;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let i = 0; i <= pts; i++) {
          const deg = (i / pts) * 720;
          const x = 20 + i * step;

          // Compute instantaneous synthetic cylinder pressure envelope wave
          let sumP = 0;
          telemetry.cylinders.forEach((cyl) => {
            const relDeg = (deg - cyl.angleDeg + 720) % 720;
            // Combustion peak near 360°-380°
            if (relDeg >= 330 && relDeg <= 460) {
              const peakDist = Math.abs(relDeg - 375);
              sumP += cyl.pressureBar * Math.exp(-(peakDist * peakDist) / 900);
            } else {
              sumP += 1.2 + Math.sin((relDeg * Math.PI) / 360) * 0.8;
            }
          });

          const normY = Math.min(1, Math.max(0, sumP / (telemetry.cylinders.length * 40)));
          const y = height * 0.82 - normY * (height * 0.7);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current Crank Angle cursor line
        const cursorX = 20 + ((crankAngle % 720) / 720) * (width - 40);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, 10);
        ctx.lineTo(cursorX, height - 20);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.round(crankAngle % 720)}°`, cursorX + 4, 25);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [telemetry, viewMode, displaySignal, config.cylinderCount]);

  return (
    <div className="flex flex-col gap-2 bg-slate-950/90 rounded-xl p-3 border border-slate-800">
      {/* Waveform Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Waves className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>リアルタイム筒内圧脈動＆トルクオシロスコープ</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          {/* Signal Selection */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setDisplaySignal('both')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                displaySignal === 'both'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              合成 (圧力+トルク)
            </button>
            <button
              type="button"
              onClick={() => setDisplaySignal('pressure')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                displaySignal === 'pressure'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              筒内圧のみ
            </button>
            <button
              type="button"
              onClick={() => setDisplaySignal('torque')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                displaySignal === 'torque'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              トルク脈動
            </button>
          </div>

          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'stream' ? 'crank_cycle' : 'stream'))}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-medium transition flex items-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
            <span>{viewMode === 'stream' ? 'ストリーム波形' : '720°位相エンベロープ'}</span>
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className={`p-1 rounded-lg border transition ${
              isPaused
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title={isPaused ? '波形更新を再開' : '波形を一時停止 (フリーズ)'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Realtime Canvas Display */}
      <div className="relative w-full rounded-lg overflow-hidden border border-slate-800 shadow-inner bg-black">
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          className="w-full h-auto block"
        />

        {/* Legend Overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none">
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            筒内圧 (各気筒)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            トルク脈動 (Nm)
          </span>
        </div>

        {/* Live Status Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>LIVE TELEMETRY</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>💡 回転数とスロットル開度に応じて振幅・周波数がリアルタイムにうねうねと躍動します</span>
        <span className="font-mono text-slate-300">
          Max P: {Math.round(Math.max(...telemetry.cylinders.map((c) => c.pressureBar), 1))} bar
        </span>
      </div>
    </div>
  );
};
