import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Crosshair,
  Compass,
  Flame,
} from 'lucide-react';

interface CameraHUDProps {
  onAction: (action: string) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  isV8?: boolean;
}

export const CameraHUD: React.FC<CameraHUDProps> = ({
  onAction,
  isV8,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="flex flex-col items-end pointer-events-auto select-none">
      {/* Collapsed State: Icon-only button */}
      {!isExpanded ? (
        <button
          id="camera-hud-expand-btn"
          onClick={() => setIsExpanded(true)}
          title="カメラ操作UIを展開"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/85 hover:bg-slate-800 text-sm text-slate-200 border border-slate-700/80 backdrop-blur-md shadow-xl transition-all active:scale-95"
        >
          <span>📹</span>
        </button>
      ) : (
        /* Main HUD Controls (Integrated header above D-pad with collapse toggle) */
        <div className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl transition-all w-44">
          {/* Integrated Header with Collapse Button directly above the D-pad */}
          <div className="flex items-center justify-between w-full pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">カメラ操作</span>
            </div>
            <button
              id="camera-hud-collapse-btn"
              onClick={() => setIsExpanded(false)}
              title="カメラ操作UIを折りたたむ"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition"
            >
              <span>折り畳む</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Directional Pad (Tilt & Pan) */}
          <div className="relative w-24 h-24 flex items-center justify-center bg-slate-950/70 rounded-full border border-slate-800 p-1 shadow-inner">
            {/* Center Reset */}
            <button
              id="camera-reset-center-btn"
              onClick={() => onAction('preset_iso')}
              title="視点を初期位置に戻す"
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-10 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Up (Tilt Up) */}
            <button
              id="camera-tilt-up-btn"
              onClick={() => onAction('rotate_up')}
              title="上から見下ろす"
              className="absolute top-1 w-7 h-6 flex items-center justify-center text-slate-400 hover:text-sky-400 active:scale-90 transition-all"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Down (Tilt Down) */}
            <button
              id="camera-tilt-down-btn"
              onClick={() => onAction('rotate_down')}
              title="下から見上げる"
              className="absolute bottom-1 w-7 h-6 flex items-center justify-center text-slate-400 hover:text-sky-400 active:scale-90 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Left (Rotate Left) */}
            <button
              id="camera-rotate-left-btn"
              onClick={() => onAction('rotate_left')}
              title="左回転"
              className="absolute left-1 w-6 h-7 flex items-center justify-center text-slate-400 hover:text-sky-400 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Right (Rotate Right) */}
            <button
              id="camera-rotate-right-btn"
              onClick={() => onAction('rotate_right')}
              title="右回転"
              className="absolute right-1 w-6 h-7 flex items-center justify-center text-slate-400 hover:text-sky-400 active:scale-90 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1.5 w-full justify-center">
            <button
              id="camera-zoom-in-btn"
              onClick={() => onAction('zoom_in')}
              title="ズームイン"
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>拡大</span>
            </button>
            <button
              id="camera-zoom-out-btn"
              onClick={() => onAction('zoom_out')}
              title="ズームアウト"
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
              <span>縮小</span>
            </button>
          </div>

          {/* Presets Drawer Toggle */}
          <button
            id="camera-presets-toggle-btn"
            onClick={() => setShowPresets(!showPresets)}
            className="w-full py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-[11px] text-sky-300 flex items-center justify-center gap-1 transition"
          >
            <Compass className="w-3 h-3" />
            <span>{showPresets ? 'アングルを閉じる' : '視点プリセット'}</span>
          </button>

          {/* Quick Camera Preset Angles */}
          {showPresets && (
            <div className="grid grid-cols-2 gap-1 w-full pt-1 border-t border-slate-800">
              <button
                id="camera-preset-iso-btn"
                onClick={() => onAction('preset_iso')}
                className="py-1 px-1 text-[10px] rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-center font-medium transition"
              >
                斜め俯瞰
              </button>
              <button
                id="camera-preset-front-btn"
                onClick={() => onAction('preset_front')}
                className="py-1 px-1 text-[10px] rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-center font-medium transition"
              >
                正面 (軸)
              </button>
              <button
                id="camera-preset-side-btn"
                onClick={() => onAction('preset_side')}
                className="py-1 px-1 text-[10px] rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-center font-medium transition"
              >
                側面
              </button>
              <button
                id="camera-preset-top-btn"
                onClick={() => onAction('preset_top')}
                className="py-1 px-1 text-[10px] rounded bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-center font-medium transition"
              >
                真上
              </button>
              <button
                id="camera-preset-piston-btn"
                onClick={() => onAction('preset_piston')}
                className="col-span-2 py-1 px-1.5 text-[10px] rounded bg-sky-950/60 border border-sky-800/40 hover:bg-sky-600 hover:text-white text-sky-300 text-center font-medium transition flex items-center justify-center gap-1"
              >
                <Crosshair className="w-3 h-3" />
                ピストン接近
              </button>

              {/* V8 Special Showcase Angles */}
              {isV8 && (
                <>
                  <button
                    id="camera-preset-v8-valley-btn"
                    onClick={() => onAction('preset_v8_valley')}
                    title="V8バンクの谷間から交互燃焼を見下ろす"
                    className="col-span-1 py-1 px-1 text-[10px] rounded bg-amber-950/60 border border-amber-800/50 hover:bg-amber-600 hover:text-white text-amber-300 text-center font-semibold transition flex items-center justify-center gap-0.5"
                  >
                    <Flame className="w-3 h-3 text-amber-400" />
                    V8谷間視点
                  </button>
                  <button
                    id="camera-preset-v8-crank-btn"
                    onClick={() => onAction('preset_v8_crank')}
                    title="クランク軸正面から十字/平面の回転を視認"
                    className="col-span-1 py-1 px-1 text-[10px] rounded bg-orange-950/60 border border-orange-800/50 hover:bg-orange-600 hover:text-white text-orange-300 text-center font-semibold transition flex items-center justify-center gap-0.5"
                  >
                    <RotateCcw className="w-3 h-3 text-orange-400" />
                    クランク軸
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
