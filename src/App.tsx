import React, { useState, useEffect, useRef } from 'react';
import {
  EngineConfig,
  EngineControlState,
  EngineVisualOptions,
  EngineTelemetry,
  DEFAULT_STAGE_LIGHTING,
} from './types/engine';
import { EngineThermodynamics } from './physics/engineThermodynamics';
import { Engine3DView } from './components/Engine3DView';
import { CameraHUD } from './components/CameraHUD';
import { SpeedControlHUD } from './components/SpeedControlHUD';
import { EngineControls } from './components/EngineControls';
import { PerformanceGraphs } from './components/PerformanceGraphs';
import { FloatingGraphWindow } from './components/FloatingGraphWindow';
import { EngineConfigPanel } from './components/EngineConfigPanel';
import { ViewOptionsPanel } from './components/ViewOptionsPanel';
import { MaterialWeightsModal } from './components/MaterialWeightsModal';
import { V8TributeModal } from './components/V8TributeModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  Settings2,
  Eye,
  BarChart3,
  Sliders,
  Scale,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Flame,
  Shield,
  Trophy,
} from 'lucide-react';
import { ENGINE_PRESETS } from './data/enginePresets';

const STORAGE_KEY_CONFIG = 'engine_sim_config_v2';
const STORAGE_KEY_CONTROLS = 'engine_sim_controls_v2';
const STORAGE_KEY_VISUALS = 'engine_sim_visuals_v2';

const DEFAULT_CONFIG: EngineConfig = {
  layout: 'inline',
  cylinderCount: 4,
  vAngleDeg: 90,
  boreMm: 84,
  strokeMm: 90,
  compressionRatio: 10.5,
  rodLengthMm: 145,
  blockMaterial: 'aluminum',
};

const DEFAULT_CONTROLS: EngineControlState = {
  throttle: 25,
  fuelRatio: 1.0,
  targetFuelMg: 22,
  simulationSpeed: 0.8,
  isRunning: true,
  starterActive: false,
};

const DEFAULT_VISUALS: EngineVisualOptions = {
  isCutaway: true,
  showExplosion: false,
  showExhaust: false,
  showWaterJacket: false,
  showHeatmap: false,
  blockOpacity: 0.15,
  explosionEffect: 'realistic',
  explodedProgress: 0.0,
  explodedEasing: 'cubic',
  showCameraHUD: true,
  showCrankRotationMarker: true,
  shadingMode: 'standard',
  backgroundStyle: 'dark_studio',
  lighting: DEFAULT_STAGE_LIGHTING,
};

export default function App() {
  // 1. Engine Configuration State with persistent localStorage support across phone sleep/reloads
  const [config, setConfig] = useState<EngineConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load saved config', e);
    }
    return DEFAULT_CONFIG;
  });

  // 2. Engine Dynamic Controls State with persistent localStorage support
  const [controls, setControls] = useState<EngineControlState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTROLS);
      if (saved) return { ...DEFAULT_CONTROLS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load saved controls', e);
    }
    return DEFAULT_CONTROLS;
  });

  // 3. Engine Visuals State with persistent localStorage support (shadingMode, backgroundStyle, etc.)
  const [visualOptions, setVisualOptions] = useState<EngineVisualOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISUALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_VISUALS,
          ...parsed,
          lighting: {
            ...DEFAULT_STAGE_LIGHTING,
            ...(parsed.lighting || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to load saved visuals', e);
    }
    return DEFAULT_VISUALS;
  });

  // Persist states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      // ignore quota errors
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTROLS, JSON.stringify(controls));
    } catch (e) {
      // ignore quota errors
    }
  }, [controls]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VISUALS, JSON.stringify(visualOptions));
    } catch (e) {
      // ignore quota errors
    }
  }, [visualOptions]);

  // Mobile Sleep / Auto-screen-off & Tab visibility lifecycle handler
  useEffect(() => {
    const handleSleepAndWake = () => {
      if (document.visibilityState === 'hidden') {
        // Phone screen turned off or browser went to background: instant flush to localStorage
        try {
          localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
          localStorage.setItem(STORAGE_KEY_CONTROLS, JSON.stringify(controls));
          localStorage.setItem(STORAGE_KEY_VISUALS, JSON.stringify(visualOptions));
        } catch (e) {
          // ignore
        }
      } else if (document.visibilityState === 'visible') {
        // Phone screen turned back on: reset delta-time clock so physics engine doesn't jump
        lastTimeRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleSleepAndWake);
    window.addEventListener('pagehide', handleSleepAndWake);
    window.addEventListener('beforeunload', handleSleepAndWake);

    return () => {
      document.removeEventListener('visibilitychange', handleSleepAndWake);
      window.removeEventListener('pagehide', handleSleepAndWake);
      window.removeEventListener('beforeunload', handleSleepAndWake);
    };
  }, [config, controls, visualOptions]);

  // Camera HUD external action trigger
  const [cameraAction, setCameraAction] = useState<string | null>(null);

  // Modals & Panels UI State
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [isV8ModalOpen, setIsV8ModalOpen] = useState(false);
  const [isFloatingGraphOpen, setIsFloatingGraphOpen] = useState(false);
  const [activeBottomPanel, setActiveBottomPanel] = useState<'controls' | 'graphs' | 'engine' | 'view'>('controls');
  const [engineSubTab, setEngineSubTab] = useState<'presets' | 'specs'>('specs');
  const [viewSubTab, setViewSubTab] = useState<'combustion' | 'visuals' | 'lighting'>('combustion');
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  // Physics engine instance
  const thermoRef = useRef<EngineThermodynamics>(new EngineThermodynamics());
  const lastTimeRef = useRef<number>(performance.now());

  // Real-time FPS Measurement (常に最上部バーに表示)
  const [fps, setFps] = useState<number>(60);
  const fpsFramesRef = useRef<number>(0);
  const fpsLastSampleRef = useRef<number>(performance.now());

  // Telemetry state
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(() =>
    thermoRef.current.update(0.016, config, controls)
  );

  // Physics and Animation update loop with high-precision FPS sampling
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      // Sample FPS over ~400ms window for stable visual readout
      fpsFramesRef.current++;
      const timeSinceLastSample = currentTime - fpsLastSampleRef.current;
      if (timeSinceLastSample >= 400) {
        const calculatedFps = Math.round((fpsFramesRef.current * 1000) / timeSinceLastSample);
        setFps(calculatedFps);
        fpsFramesRef.current = 0;
        fpsLastSampleRef.current = currentTime;
      }

      const newTelemetry = thermoRef.current.update(dt, config, controls);
      setTelemetry(newTelemetry);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [config, controls]);

  const handleUpdateConfig = (patch: Partial<EngineConfig>) => {
    // Detect layout or cylinder count changes
    const isLayoutChanged = patch.layout !== undefined && patch.layout !== config.layout;
    const isCylinderChanged = patch.cylinderCount !== undefined && patch.cylinderCount !== config.cylinderCount;

    // Reset to default clean state whenever layout or cylinder count is changed
    // User request: ピストンクランク露出・エキマニ非表示・ウォータージャケットなし・ヒートマップなし・爆発なしを初期表示とする
    if (isLayoutChanged || isCylinderChanged) {
      setVisualOptions((prev) => ({
        ...prev,
        isCutaway: true,
        showExhaust: false,
        showWaterJacket: false,
        showHeatmap: false,
        showExplosion: false,
        explodedProgress: 0.0,
        blockOpacity: 0.15,
        explosionEffect: 'realistic',
        showCameraHUD: true,
        showCrankRotationMarker: true,
      }));
    }

    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateControls = (patch: Partial<EngineControlState>) => {
    setControls((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateVisuals = (patch: Partial<EngineVisualOptions>) => {
    setVisualOptions((prev) => ({ ...prev, ...patch }));
  };

  // Determine active preset (4A-GEU, RB26DETT, M120, RA121E, Kei 660, etc.)
  const activePreset = ENGINE_PRESETS.find((p) => {
    return (
      p.config.layout === config.layout &&
      p.config.cylinderCount === config.cylinderCount &&
      Math.abs((p.config.boreMm ?? 0) - config.boreMm) < 0.2 &&
      Math.abs((p.config.strokeMm ?? 0) - config.strokeMm) < 0.2 &&
      (config.layout !== 'v-type' || Math.abs((p.config.vAngleDeg ?? 0) - config.vAngleDeg) < 1)
    );
  });

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col select-none touch-none"
      style={{ WebkitTouchCallout: 'none' }}
    >
      {/* Top Header Bar - Ultra-slim layout optimized for mobile screen estate */}
      <header className="relative z-20 flex items-center justify-between px-2.5 sm:px-5 py-1.5 sm:py-2 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
        {/* Title and Engine Specs Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-sky-950 shrink-0">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight sm:tracking-wide truncate">
                <span className="hidden sm:inline">ガソリン</span>エンジンシミュレーター
              </h1>
              {activePreset ? (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/70 shrink-0">
                  <Trophy className="w-2.5 h-2.5 text-amber-400" />
                  <span>{activePreset.shortName}</span>
                </span>
              ) : (
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  config.layout === 'v-type' && config.cylinderCount === 8
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-950'
                    : 'bg-sky-950 text-sky-400 border-sky-800'
                }`}>
                  {config.layout === 'inline'
                    ? `直列 ${config.cylinderCount} 気筒`
                    : config.layout === 'v-type'
                    ? config.cylinderCount === 8
                      ? `V8 ${config.crankshaftType === 'flatplane' ? 'Flat-plane' : 'Cross-plane'}`
                      : `V型 ${config.cylinderCount} 気筒 (${config.vAngleDeg}°)`
                    : `水平対向 ${config.cylinderCount} 気筒`}
                </span>
              )}
            </div>
            {/* Telemetry (Displacement, RPM, Torque, Power) - Streamlined single line for mobile */}
            <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 sm:gap-1.5 font-mono whitespace-nowrap leading-tight mt-0.5">
              <span className="text-slate-300 font-semibold">{telemetry.displacementCc}cc</span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-400 font-semibold">{telemetry.rpm}rpm</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">{telemetry.torqueNm}Nm</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">
                {telemetry.powerPs}PS<span className="hidden md:inline text-slate-400 font-normal"> (馬力)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Items & Always-On FPS Display */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Always-On FPS Display */}
          <div
            id="always-on-fps-counter"
            className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner font-mono text-[11px] sm:text-xs select-none"
            title="リアルタイム描画フレームレート (FPS)"
          >
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                fps >= 50
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : fps >= 30
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
              }`}
            />
            <span className="font-bold text-slate-100">{fps}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans font-medium">FPS</span>
          </div>

          {/* Quick Presets Menu Trigger (Trophy button - kept as requested) */}
          <button
            id="header-presets-quick-btn"
            onClick={() => {
              setActiveBottomPanel('engine');
              setEngineSubTab('presets');
              setIsPanelExpanded(true);
            }}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-600/60 text-xs font-bold transition active:scale-95 shadow-sm"
            title="名機実機プリセット (トヨタ4A-GEU, 日産RB26DETT, スバルEJ20, ベンツM120, ホンダRA121E, 軽660cc)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">名機プリセット</span>
          </button>

          {/* Floating Performance Graph Window Toggle Button */}
          <button
            id="header-floating-graph-btn"
            onClick={() => setIsFloatingGraphOpen((prev) => !prev)}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border text-xs font-semibold transition active:scale-95 ${
              isFloatingGraphOpen
                ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
            }`}
            title="リアルタイム性能グラフをポップアップ別窓表示 (ドラッグ移動・リサイズ可能)"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">グラフ窓</span>
          </button>

          {/* Material & Mass Inspector Button */}
          <button
            id="header-materials-btn"
            onClick={() => setIsMaterialsModalOpen(true)}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition active:scale-95"
            title="材質・重量解析"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">材質解析</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </header>

      {/* Main 3D Viewport Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D Canvas */}
        <Engine3DView
          config={config}
          visualOptions={visualOptions}
          telemetry={telemetry}
          cameraControlAction={cameraAction}
          onCameraActionHandled={() => setCameraAction(null)}
          onUpdateVisualOptions={handleUpdateVisuals}
          onOpenStageLighting={() => {
            setActiveBottomPanel('view');
            setViewSubTab('lighting');
            setIsPanelExpanded(true);
          }}
        />

        {/* Right-Side Floating Controls Column: Speed HUD on top, Camera HUD below */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
          {/* Speed Controller HUD (Always accessible, collapsible) */}
          <div className="pointer-events-auto">
            <SpeedControlHUD
              controls={controls}
              onUpdateControls={handleUpdateControls}
            />
          </div>

          {/* Camera Controls HUD */}
          {visualOptions.showCameraHUD && (
            <div className="pointer-events-auto">
              <CameraHUD
                onAction={(action) => setCameraAction(action)}
                isV8={config.layout === 'v-type' && config.cylinderCount === 8}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Floating Control Dock & Tabbed Drawers */}
      <div className="relative z-30 w-full max-w-4xl mx-auto px-3 pb-3 pointer-events-auto">
        {/* Dock Navigation Switcher Bar */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl mb-2">
          <div className="grid grid-cols-4 gap-1 flex-1 min-w-0">
            {/* 1. 操作・スロットル */}
            <button
              id="bottom-tab-controls"
              onClick={() => {
                setActiveBottomPanel('controls');
                setIsPanelExpanded(true);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeBottomPanel === 'controls' && isPanelExpanded
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">操作・スロットル</span>
                <span className="sm:hidden">操作</span>
              </span>
            </button>

            {/* 2. 性能グラフ＆PV線図 */}
            <button
              id="bottom-tab-graphs"
              onClick={() => {
                setActiveBottomPanel('graphs');
                setIsPanelExpanded(true);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeBottomPanel === 'graphs' && isPanelExpanded
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">性能グラフ＆PV線図</span>
                <span className="sm:hidden">性能グラフ</span>
              </span>
            </button>

            {/* 3. エンジン形式 (新設) */}
            <button
              id="bottom-tab-engine"
              onClick={() => {
                setActiveBottomPanel('engine');
                setIsPanelExpanded(true);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeBottomPanel === 'engine' && isPanelExpanded
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">エンジン形式</span>
                <span className="sm:hidden">形式</span>
              </span>
            </button>

            {/* 4. ビュー (新設) */}
            <button
              id="bottom-tab-view"
              onClick={() => {
                setActiveBottomPanel('view');
                setIsPanelExpanded(true);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeBottomPanel === 'view' && isPanelExpanded
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ビュー</span>
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            id="panel-expand-toggle-btn"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            title={isPanelExpanded ? 'パネルを折りたたむ' : 'パネルを展開する'}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
          >
            {isPanelExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Panel Content Body */}
        {isPanelExpanded && (
          <div className="max-h-[38vh] sm:max-h-[42vh] overflow-y-auto rounded-2xl scrollbar-thin scrollbar-thumb-slate-700">
            {activeBottomPanel === 'controls' && (
              <EngineControls
                controls={controls}
                onUpdateControls={handleUpdateControls}
                visualOptions={visualOptions}
                onUpdateVisuals={handleUpdateVisuals}
                onOpenMaterialsModal={() => setIsMaterialsModalOpen(true)}
              />
            )}

            {activeBottomPanel === 'graphs' && (
              <PerformanceGraphs
                telemetry={telemetry}
                config={config}
                onOpenFloating={() => setIsFloatingGraphOpen(true)}
              />
            )}

            {activeBottomPanel === 'engine' && (
              <EngineConfigPanel
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onOpenMaterialsModal={() => setIsMaterialsModalOpen(true)}
                onOpenV8Tribute={() => setIsV8ModalOpen(true)}
                initialSubTab={engineSubTab}
              />
            )}

            {activeBottomPanel === 'view' && (
              <ViewOptionsPanel
                visualOptions={visualOptions}
                onUpdateVisuals={handleUpdateVisuals}
                initialSubTab={viewSubTab}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Performance Graph Window (Draggable, Resizable, One-Button Close) */}
      <FloatingGraphWindow
        isOpen={isFloatingGraphOpen}
        onClose={() => setIsFloatingGraphOpen(false)}
        telemetry={telemetry}
        config={config}
      />

      {/* Materials & Mass Distribution Modal */}
      <MaterialWeightsModal
        config={config}
        isOpen={isMaterialsModalOpen}
        onClose={() => setIsMaterialsModalOpen(false)}
      />

      {/* V8 Tribute Showcase & Architecture Modal */}
      <V8TributeModal
        isOpen={isV8ModalOpen}
        onClose={() => setIsV8ModalOpen(false)}
        currentConfig={config}
        telemetry={telemetry}
        onApplyConfig={(newConfig, cameraPreset) => {
          handleUpdateConfig(newConfig);
          if (cameraPreset) {
            setCameraAction(cameraPreset);
          }
          if (!controls.isRunning) {
            setControls((prev) => ({ ...prev, isRunning: true }));
          }
        }}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
