import React, { useState } from 'react';
import {
  Play,
  Pause,
  Gauge,
  ChevronDown,
  ChevronUp,
  StepForward,
  RotateCcw,
} from 'lucide-react';
import { EngineControlState } from '../types/engine';

interface SpeedControlHUDProps {
  controls: EngineControlState;
  onUpdateControls: (updates: Partial<EngineControlState>) => void;
  onStepFrame?: () => void;
}

export const SpeedControlHUD: React.FC<SpeedControlHUDProps> = ({
  controls,
  onUpdateControls,
  onStepFrame,
}) => {
  // Folded / expanded state (default expanded for instant usability, collapsible with 1 click)
  const [isExpanded, setIsExpanded] = useState(true);

  const speed = controls.simulationSpeed;
  const isRunning = controls.isRunning;

  const presets = [
    { label: '0.005x', value: 0.005, title: '0.005x (超微速スロー・バルブ/ピストンの精密観察)' },
    { label: '0.01x', value: 0.01, title: '0.01x (極低速・燃焼行程/バルブ運動の詳細観察)' },
    { label: '0.05x', value: 0.05, title: '0.05x (超スロー)' },
    { label: '0.25x', value: 0.25, title: '0.25x (1/4スロー)' },
    { label: '0.5x', value: 0.5, title: '0.5x (半速)' },
    { label: '1.0x', value: 1.0, title: '1.0x (標準等速)' },
  ];

  return (
    <div className="flex flex-col items-end pointer-events-auto select-none">
      {/* Collapsed State: Sleek pill bar */}
      {!isExpanded ? (
        <div
          id="speed-hud-collapsed"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 backdrop-blur-md shadow-xl transition-all"
        >
          {/* Play / Pause toggle */}
          <button
            id="speed-hud-collapsed-play-btn"
            onClick={() => onUpdateControls({ isRunning: !isRunning })}
            title={isRunning ? '一時停止' : '再生'}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition active:scale-95 ${
              isRunning
                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Speed Indicator */}
          <button
            id="speed-hud-expand-btn-text"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white group"
            title="クリックして速度コントロールを展開"
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono font-bold text-emerald-400">
              {speed < 0.01 ? speed.toFixed(3) : speed.toFixed(2)}x
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {speed <= 0.008 ? '(超微速)' : speed <= 0.02 ? '(極低速)' : speed <= 0.1 ? '(超低速)' : speed < 1.0 ? '(スロー)' : '(標準)'}
            </span>
          </button>

          {/* Expand Chevron */}
          <button
            id="speed-hud-expand-btn"
            onClick={() => setIsExpanded(true)}
            title="速度変更UIを展開する"
            className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded State: Compact, intuitive floating controller card */
        <div
          id="speed-hud-expanded"
          className="w-68 sm:w-72 p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl transition-all space-y-2.5"
        >
          {/* Header with Title and Collapse Button */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <Gauge className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-slate-200">動作速度コントローラー</span>
            </div>

            <button
              id="speed-hud-collapse-btn"
              onClick={() => setIsExpanded(false)}
              title="速度UIを折りたたむ (最小化)"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition"
            >
              <span>折り畳む</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Playback Controls: Play/Pause, Speed Badge, Frame Step */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                id="speed-hud-play-toggle"
                onClick={() => onUpdateControls({ isRunning: !isRunning })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-md ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>一時停止</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>再生開始</span>
                  </>
                )}
              </button>

              {/* Reset to 1.0x */}
              <button
                id="speed-hud-reset-speed-btn"
                onClick={() => onUpdateControls({ simulationSpeed: 1.0 })}
                title="速度を標準(1.0x)に戻す"
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Speed Badge */}
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-right">
              <div className="font-mono text-xs font-bold text-emerald-400">
                {speed < 0.01 ? speed.toFixed(3) : speed.toFixed(2)}x
              </div>
              <div className="text-[9px] text-slate-400 leading-none">
                {speed <= 0.008
                  ? '超微速 (0.005x)'
                  : speed <= 0.02
                  ? '極低速 (詳細観察)'
                  : speed <= 0.08
                  ? '超スロー'
                  : speed <= 0.4
                  ? 'スロー'
                  : speed >= 1.2
                  ? 'ハイスピード'
                  : '標準速度'}
              </div>
            </div>
          </div>

          {/* Speed Slider (Range from 0.005x to 1.50x) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>0.005x (超微速)</span>
              <span>0.5x</span>
              <span>1.0x (等速)</span>
              <span>1.5x</span>
            </div>
            <input
              id="speed-hud-slider"
              type="range"
              min="0.005"
              max="1.5"
              step="0.005"
              value={speed}
              onChange={(e) => onUpdateControls({ simulationSpeed: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
          </div>

          {/* Quick Preset Buttons (including 0.005x and 0.01x) */}
          <div className="grid grid-cols-6 gap-1 pt-0.5">
            {presets.map((preset) => {
              const isSelected = Math.abs(speed - preset.value) < (preset.value <= 0.01 ? 0.003 : 0.01);
              return (
                <button
                  key={preset.value}
                  id={`speed-hud-preset-${preset.value}`}
                  onClick={() => onUpdateControls({ simulationSpeed: preset.value })}
                  title={preset.title}
                  className={`py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all active:scale-95 text-center ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm shadow-emerald-950'
                      : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
