import React from 'react';
import {
  EngineControlState,
  EngineVisualOptions,
} from '../types/engine';
import {
  Play,
  Square,
  Flame,
  Gauge,
  Layers,
  Sparkles,
  Split,
  Eye,
} from 'lucide-react';

interface EngineControlsProps {
  controls: EngineControlState;
  onUpdateControls: (patch: Partial<EngineControlState>) => void;
  visualOptions: EngineVisualOptions;
  onUpdateVisuals: (patch: Partial<EngineVisualOptions>) => void;
  onOpenMaterialsModal: () => void;
}

export const EngineControls: React.FC<EngineControlsProps> = ({
  controls,
  onUpdateControls,
  visualOptions,
  onUpdateVisuals,
  onOpenMaterialsModal,
}) => {
  const { throttle, fuelRatio, simulationSpeed, isRunning } = controls;
  const { isCutaway, showHeatmap, explodedProgress, showExplosion = true } = visualOptions;

  return (
    <div className="flex flex-col gap-2.5 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-md text-slate-100 shadow-xl select-none">
      {/* Primary Action Buttons Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Ignition Start / Stop Button */}
        <button
          id="engine-ignition-btn"
          onClick={() => onUpdateControls({ isRunning: !isRunning })}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
            isRunning
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
          }`}
        >
          {isRunning ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? 'エンジン停止' : 'エンジン始動 (START)'}</span>
        </button>

        {/* 1-Click Cutaway vs Cover Toggle */}
        <button
          id="toggle-cutaway-btn"
          onClick={() => onUpdateVisuals({ isCutaway: !isCutaway })}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs border transition-all active:scale-95 ${
            isCutaway
              ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-sky-950'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isCutaway ? 'カットオフ表示中' : 'カバー装着状態'}</span>
        </button>

        {/* Combustion Explosion Toggle */}
        <button
          id="toggle-explosion-btn"
          onClick={() => onUpdateVisuals({ showExplosion: !showExplosion })}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs border transition-all active:scale-95 ${
            showExplosion
              ? 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-orange-950'
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{showExplosion ? '爆発エフェクト ON' : '爆発エフェクト OFF'}</span>
        </button>

        {/* 1-Click Exploded View Toggle */}
        <button
          id="toggle-explode-btn"
          onClick={() =>
            onUpdateVisuals({
              explodedProgress: explodedProgress > 0.05 ? 0.0 : 1.0,
            })
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs border transition-all active:scale-95 ${
            explodedProgress > 0.05
              ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-purple-950'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>{explodedProgress > 0.05 ? '分解図 格納' : '分解図 展開'}</span>
        </button>

        {/* Heatmap Toggle */}
        <button
          id="toggle-heatmap-btn"
          onClick={() => onUpdateVisuals({ showHeatmap: !showHeatmap })}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs border transition-all active:scale-95 ${
            showHeatmap
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-950'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{showHeatmap ? '熱分布 ON' : '熱分布 OFF'}</span>
        </button>
      </div>

      {/* Sliders Grid: Throttle & Fuel & Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
        {/* Throttle Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              スロットル開度
            </span>
            <span className="font-mono text-sky-400">{Math.round(throttle)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="throttle-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={throttle}
              onChange={(e) => onUpdateControls({ throttle: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <button
              onClick={() => onUpdateControls({ throttle: throttle > 50 ? 10 : 80 })}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              {throttle > 50 ? 'アイドリング' : '全開'}
            </button>
          </div>
        </div>

        {/* Fuel Ratio / AFR Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              燃料噴射比 (A/F)
            </span>
            <span className="font-mono text-amber-400">
              {(14.7 * fuelRatio).toFixed(1)}:1 ({fuelRatio < 0.95 ? '濃' : fuelRatio > 1.05 ? '薄' : '理論空燃比'})
            </span>
          </div>
          <input
            id="fuel-ratio-slider"
            type="range"
            min="0.8"
            max="1.3"
            step="0.02"
            value={fuelRatio}
            onChange={(e) => onUpdateControls({ fuelRatio: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Simulation Speed Slider & Presets */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              動作速度: {simulationSpeed < 0.01 ? simulationSpeed.toFixed(3) : simulationSpeed.toFixed(2)}x
            </span>
            <span className="font-mono text-emerald-400">
              {simulationSpeed <= 0.008
                ? '超微速 (0.005x)'
                : simulationSpeed <= 0.02
                ? '極低速 (0.01x)'
                : simulationSpeed === 0.05
                ? '超スロー (0.05x)'
                : simulationSpeed === 1.0
                ? '標準等速 (1.0x)'
                : `${simulationSpeed < 0.01 ? simulationSpeed.toFixed(3) : simulationSpeed.toFixed(2)}x`}
            </span>
          </div>
          
          <input
            id="sim-speed-slider"
            type="range"
            min="0.005"
            max="1.5"
            step="0.005"
            value={simulationSpeed}
            onChange={(e) => onUpdateControls({ simulationSpeed: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          {/* Speed Preset Quick Buttons: 0.005, 0.01, 0.05, 0.25, 0.5, 1.0 */}
          <div className="grid grid-cols-6 gap-1 mt-0.5">
            {[0.005, 0.01, 0.05, 0.25, 0.5, 1.0].map((spd) => (
              <button
                key={spd}
                id={`speed-preset-${spd}`}
                onClick={() => onUpdateControls({ simulationSpeed: spd })}
                className={`py-0.5 px-0.5 rounded text-[10px] sm:text-[11px] font-bold border transition-all text-center ${
                  Math.abs(simulationSpeed - spd) < (spd <= 0.01 ? 0.003 : 0.02)
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
