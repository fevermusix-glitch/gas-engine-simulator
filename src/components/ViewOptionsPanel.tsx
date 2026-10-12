import React, { useState, useEffect } from 'react';
import {
  EngineVisualOptions,
  ShadingMode,
  BackgroundStyle,
  LightRotationPlane,
  LIGHT_ROTATION_PLANES,
  LIGHT_DISTANCE_PRESETS,
  LIGHT_INTENSITY_PRESETS,
  LIGHT_COLOR_PRESETS,
  COLOR_SHIFT_PRESETS,
  MASTER_LIGHTING_PRESETS,
  DEFAULT_STAGE_LIGHTING,
} from '../types/engine';
import {
  Flame,
  Layers,
  Lightbulb,
  Sun,
  Eye,
  Info,
  Sparkles,
  Wind,
  RotateCw,
  Compass,
  Palette,
  Check,
  Disc,
  FolderOpen,
  Sliders,
} from 'lucide-react';
import { EASING_OPTIONS } from '../utils/easing';
import { LightingProfilesManager } from './LightingProfilesManager';

function hexToRgb(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ViewOptionsPanelProps {
  visualOptions: EngineVisualOptions;
  onUpdateVisuals: (patch: Partial<EngineVisualOptions>) => void;
  initialSubTab?: 'combustion' | 'visuals' | 'lighting';
}

export const ViewOptionsPanel: React.FC<ViewOptionsPanelProps> = ({
  visualOptions,
  onUpdateVisuals,
  initialSubTab = 'combustion',
}) => {
  const [subTab, setSubTab] = useState<'combustion' | 'visuals' | 'lighting' | 'about'>(initialSubTab);
  const [lightingSection, setLightingSection] = useState<'profiles' | 'tuning'>('profiles');

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const lighting = visualOptions.lighting || DEFAULT_STAGE_LIGHTING;
  const updateLighting = (patch: Partial<typeof lighting>) => {
    onUpdateVisuals({
      lighting: {
        ...lighting,
        ...patch,
      },
    });
  };

  const currentRgb = hexToRgb(lighting.color || '#ffffff');

  return (
    <div className="flex flex-col w-full bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md text-slate-100 shadow-xl">
      {/* Sub-tab Navigation Header: Exactly 3 tabs + 1 small info button, grid-cols-3, no horizontal scrolling */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/70 p-1 gap-1">
        <div className="grid grid-cols-3 flex-1 gap-1">
          {/* SubTab 1: 燃焼 */}
          <button
            id="view-tab-combustion"
            type="button"
            onClick={() => setSubTab('combustion')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              subTab === 'combustion'
                ? 'bg-orange-950/70 border border-orange-500/80 text-orange-300 shadow-md ring-1 ring-orange-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">燃焼</span>
          </button>

          {/* SubTab 2: 3D透過・分解図・質感 */}
          <button
            id="view-tab-visuals"
            type="button"
            onClick={() => setSubTab('visuals')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              subTab === 'visuals'
                ? 'bg-sky-950/70 border border-sky-500/80 text-sky-300 shadow-md ring-1 ring-sky-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">透過・分解・質感</span>
          </button>

          {/* SubTab 3: 3Dライティング・舞台照明 */}
          <button
            id="view-tab-lighting"
            type="button"
            onClick={() => setSubTab('lighting')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              subTab === 'lighting'
                ? 'bg-amber-950/60 border border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">舞台照明</span>
            {visualOptions.lighting?.enabled && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse hidden sm:inline-block ml-0.5" />
            )}
          </button>
        </div>

        {/* Compact Info Button */}
        <button
          id="view-tab-about-btn"
          type="button"
          onClick={() => setSubTab(subTab === 'about' ? 'combustion' : 'about')}
          title="仕様・使い方解説"
          className={`p-2 rounded-xl border text-xs font-semibold transition ${
            subTab === 'about'
              ? 'bg-slate-800 text-sky-300 border-sky-500/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub-tab 1: 燃焼 (旧: 燃焼・クランク可視化) */}
      {subTab === 'combustion' && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Explosion Master On/Off Switch */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>爆発エフェクト表示 (燃焼可視化)</span>
              </div>
              <div className="text-[10px] text-slate-400">
                点火時のスパークと火炎球体・エフェクトの表示をオン/オフ切り替え
              </div>
            </div>
            <button
              id="explosion-master-toggle-btn"
              onClick={() => onUpdateVisuals({ showExplosion: visualOptions.showExplosion === false })}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition ${
                visualOptions.showExplosion !== false
                  ? 'bg-orange-600 border-orange-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {visualOptions.showExplosion !== false ? '爆発表示 ON' : '爆発表示 OFF'}
            </button>
          </div>

          {/* Explosion Mode Selection */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <span className="font-semibold text-slate-300">燃焼・火炎エフェクト表現方式</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="explosion-effect-metaball-btn"
                onClick={() => onUpdateVisuals({ explosionEffect: 'metaball', showExplosion: true })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  (visualOptions.explosionEffect ?? 'realistic') === 'metaball'
                    ? 'bg-orange-950/80 border-orange-500 text-orange-200 shadow-md ring-1 ring-orange-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span>
                  メタボール・プラズマ球
                </div>
                <div className="text-[10px] text-slate-400">
                  滑らかな膨張・収縮アニメーションと過熱グロー
                </div>
              </button>

              <button
                id="explosion-effect-realistic-btn"
                onClick={() => onUpdateVisuals({ explosionEffect: 'realistic', showExplosion: true })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  (visualOptions.explosionEffect ?? 'realistic') === 'realistic'
                    ? 'bg-orange-950/80 border-orange-500 text-orange-200 shadow-md ring-1 ring-orange-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
                  本物の爆発・炎粒子
                </div>
                <div className="text-[10px] text-slate-400">
                  乱流炎面と火炎放射、加圧ショックウェーブの再現
                </div>
              </button>
            </div>
          </div>

          {/* Crankshaft Timing Marker */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">クランクシャフト回転タイミングディスク</div>
              <div className="text-[10px] text-slate-400">
                先端の角度目盛り盤とTDC（上死点）目印針を表示
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateVisuals({
                  showCrankRotationMarker: !visualOptions.showCrankRotationMarker,
                })
              }
              className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition ${
                visualOptions.showCrankRotationMarker
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {visualOptions.showCrankRotationMarker ? '表示中' : '非表示'}
            </button>
          </div>

          {/* Camera On-Screen HUD Toggle */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">画面上の3Dカメラ操作UI (パン・チルト・ズーム)</div>
              <div className="text-[10px] text-slate-400">
                右上フロートの矢印・拡大縮小ボタンの表示/非表示
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateVisuals({
                  showCameraHUD: !visualOptions.showCameraHUD,
                })
              }
              className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition ${
                visualOptions.showCameraHUD
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {visualOptions.showCameraHUD ? '表示中' : '非表示'}
            </button>
          </div>
        </div>
      )}

      {/* Sub-tab 2: 3D透過・分解図・質感 (旧: visuals) */}
      {subTab === 'visuals' && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Cylinder Block Opacity Slider */}
          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">シリンダーブロック透明度</span>
              <span className="font-mono text-sky-400">
                {Math.round((1 - visualOptions.blockOpacity) * 100)}% 透過 (不透明度 {Math.round(visualOptions.blockOpacity * 100)}%)
              </span>
            </div>
            <input
              id="block-opacity-slider"
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={visualOptions.blockOpacity}
              onChange={(e) => onUpdateVisuals({ blockOpacity: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded appearance-none accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>完全透明 (0%)</span>
              <span>半透明 (ガラス調)</span>
              <span>完全不透明 (100%)</span>
            </div>
          </div>

          {/* Exploded View Progress Slider & Easing Functions */}
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-purple-900/40 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-slate-200 text-xs">部品分解図 (Exploded View) 展開度</span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                {Math.round(visualOptions.explodedProgress * 100)}%
              </span>
            </div>

            <input
              id="exploded-progress-slider"
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={visualOptions.explodedProgress}
              onChange={(e) => onUpdateVisuals({ explodedProgress: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded appearance-none accent-purple-500 cursor-pointer"
            />

            {/* Quick Presets for Exploded View */}
            <div className="flex items-center justify-between gap-1.5">
              {[
                { label: '組立 (0%)', val: 0.0 },
                { label: '30%', val: 0.3 },
                { label: '50%', val: 0.5 },
                { label: '75%', val: 0.75 },
                { label: '全展開 (100%)', val: 1.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => onUpdateVisuals({ explodedProgress: p.val })}
                  className={`flex-1 py-1 rounded text-[10px] font-semibold transition ${
                    Math.abs(visualOptions.explodedProgress - p.val) < 0.05
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Easing Function Selection */}
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">展開補間カーブ (Easing Function)</span>
              <div className="grid grid-cols-5 gap-1">
                {EASING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateVisuals({ explodedEasing: opt.id })}
                    title={opt.desc}
                    className={`py-1 px-1 rounded text-[10px] font-medium border text-center transition ${
                      (visualOptions.explodedEasing ?? 'cubic') === opt.id
                        ? 'bg-purple-950 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Component Visibility Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Cutaway Mode */}
            <button
              onClick={() => onUpdateVisuals({ isCutaway: !visualOptions.isCutaway })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                visualOptions.isCutaway
                  ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>ピストン・クランク</span>
                <span>{visualOptions.isCutaway ? '露出' : 'カバー'}</span>
              </div>
              <span className="text-[10px] opacity-75">内部稼働部品の表示切替</span>
            </button>

            {/* Exhaust Pipes Toggle */}
            <button
              onClick={() => onUpdateVisuals({ showExhaust: !visualOptions.showExhaust })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                visualOptions.showExhaust
                  ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>エキゾースト管</span>
                <span>{visualOptions.showExhaust ? '表示' : '非表示'}</span>
              </div>
              <span className="text-[10px] opacity-75">排気マニホールド配管</span>
            </button>

            {/* Water Jacket Toggle */}
            <button
              onClick={() => onUpdateVisuals({ showWaterJacket: !visualOptions.showWaterJacket })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                visualOptions.showWaterJacket
                  ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>冷却水路 (Jacket)</span>
                <span>{visualOptions.showWaterJacket ? '表示' : '非表示'}</span>
              </div>
              <span className="text-[10px] opacity-75">シリンダー冷却ウォータージャケット</span>
            </button>

            {/* Thermal Heatmap Toggle */}
            <button
              onClick={() => onUpdateVisuals({ showHeatmap: !visualOptions.showHeatmap })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                visualOptions.showHeatmap
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>熱分布ヒートマップ</span>
                <span>{visualOptions.showHeatmap ? '表示' : '非表示'}</span>
              </div>
              <span className="text-[10px] opacity-75">温度勾配グラデーション可視化</span>
            </button>
          </div>

          {/* Shading / Material Styles */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <span className="font-semibold text-slate-300">3Dシェーダー質感 (レンダリングスタイル)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'standard' as ShadingMode,
                  name: 'スタンダード',
                  desc: '実機アルミ・鍛造鋼',
                  icon: '⚙️',
                },
                {
                  id: 'exaggerated_metallic' as ShadingMode,
                  name: '極大メタリック',
                  desc: 'ギラギラ鏡面クローム・レイトレ映込',
                  icon: '✨',
                },
                {
                  id: 'toon' as ShadingMode,
                  name: 'トゥーンシェード',
                  desc: '接合部黒主線・セル画調',
                  icon: '🎨',
                },
                {
                  id: 'wireframe' as ShadingMode,
                  name: 'ワイヤフレーム',
                  desc: '3D幾何メッシュ線画',
                  icon: '📐',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateVisuals({ shadingMode: m.id })}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                    visualOptions.shadingMode === m.id
                      ? 'bg-sky-950 border-sky-500 text-sky-200 shadow-md ring-1 ring-sky-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Style Switcher */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>3D背景スタジオ & ライティング環境</span>
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                {visualOptions.backgroundStyle === 'carbon_garage'
                  ? '🏁 カーボンガレージ'
                  : visualOptions.backgroundStyle === 'clean_white'
                  ? '⚪ CADクリーンホワイト'
                  : visualOptions.backgroundStyle === 'sunset_warm'
                  ? '🌅 サンセットウォーム'
                  : visualOptions.backgroundStyle === 'neon_cyber'
                  ? '⚡ ネオンサイバー'
                  : '🌙 ダークスタジオ'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'dark_studio' as BackgroundStyle, name: 'ダークスタジオ', icon: '🌙' },
                { id: 'carbon_garage' as BackgroundStyle, name: 'カーボンガレージ', icon: '🏁' },
                { id: 'clean_white' as BackgroundStyle, name: 'CADホワイト', icon: '⚪' },
                { id: 'sunset_warm' as BackgroundStyle, name: '夕暮れサンセット', icon: '🌅' },
                { id: 'neon_cyber' as BackgroundStyle, name: 'ネオンサイバー', icon: '⚡' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onUpdateVisuals({ backgroundStyle: bg.id })}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition ${
                    visualOptions.backgroundStyle === bg.id
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-base">{bg.icon}</span>
                  <span className="text-[10px] font-semibold">{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: 3Dライティング・舞台照明 (旧: lighting) */}
      {subTab === 'lighting' && (
        <div className="p-3.5 space-y-4 text-xs">
          {/* Master Enable Header */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 shadow-lg flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-amber-200 flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>3Dステージ・ライティング & 舞台照明演出</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                クランクシャフト軸基準の立体周回プレーン、RGB調光、スモークマシン、動的カラーシフト
              </p>
            </div>
            <button
              type="button"
              id="stage-lighting-master-toggle-btn"
              onClick={() => updateLighting({ enabled: !lighting.enabled })}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 ${
                lighting.enabled
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              {lighting.enabled ? '照明演出: ON' : '照明演出: OFF'}
            </button>
          </div>

          {/* Section Switcher: Profiles & JSON vs Manual Tuning */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 gap-1">
            <button
              type="button"
              id="lighting-mode-profiles-btn"
              onClick={() => setLightingSection('profiles')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                lightingSection === 'profiles'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>照明の保存・一覧呼び出し & JSON書き出し/読み込み</span>
            </button>
            <button
              type="button"
              id="lighting-mode-tuning-btn"
              onClick={() => setLightingSection('tuning')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                lightingSection === 'tuning'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>詳細パラメータ手動調光 (プレーン/RGB/スモーク)</span>
            </button>
          </div>

          {/* Sub-view 1: Profiles & JSON File I/O */}
          {lightingSection === 'profiles' && (
            <LightingProfilesManager
              currentLighting={lighting}
              currentBackgroundStyle={visualOptions.backgroundStyle}
              onApplyLighting={(newLighting, bg) => {
                onUpdateVisuals({
                  lighting: newLighting,
                  ...(bg ? { backgroundStyle: bg } : {}),
                });
              }}
            />
          )}

          {/* Sub-view 2: Detailed Manual Tuning Controls */}
          {lightingSection === 'tuning' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40">
                <span className="text-[11px] text-amber-200 font-medium">
                  現在の調光パラメータを調整中。調整後の状態は「保存・JSON」タブで名前を付けて保存やファイル書き出しができます。
                </span>
                <button
                  type="button"
                  onClick={() => setLightingSection('profiles')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shrink-0 ml-2 shadow-sm"
                >
                  保存・JSONへ ↗
                </button>
              </div>

              {/* Master Presets Quick Carousel */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/50 border border-amber-500/30">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>総合マスター・ライティングプリセット</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MASTER_LIGHTING_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    updateLighting({
                      ...preset.options,
                      enabled: true,
                    });
                  }}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-amber-500/50 text-left flex flex-col gap-1 transition active:scale-95"
                >
                  <div className="flex items-center justify-between font-bold text-xs text-slate-200">
                    <span className="flex items-center gap-1">
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </span>
                    <span className="w-3 h-3 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: preset.options.color || '#ffffff' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {preset.tagline || preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Orbit Plane Selection (クランク軸基準 4平面) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>立体周回プレーン (クランクシャフト軸基準)</span>
              </span>
              <span className="text-[11px] font-mono text-sky-300 font-bold">
                {LIGHT_ROTATION_PLANES.find((p) => p.id === lighting.plane)?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LIGHT_ROTATION_PLANES.map((plane) => (
                <button
                  key={plane.id}
                  type="button"
                  onClick={() => updateLighting({ plane: plane.id, enabled: true })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                    lighting.plane === plane.id
                      ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-md ring-1 ring-sky-500/50'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-bold text-xs">{plane.name}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{plane.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Rotation & Angles (自動周回速度 & 手動固定角度) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            {/* Auto-Rotation Speed */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>自動周回回転速度</span>
                </span>
                <button
                  type="button"
                  onClick={() => updateLighting({ autoRotate: !lighting.autoRotate, enabled: true })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    lighting.autoRotate
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {lighting.autoRotate ? '自動周回中' : '停止中 (手動固定)'}
                </button>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.5"
                step="0.1"
                value={lighting.rotationSpeed || 1.0}
                onChange={(e) => updateLighting({ rotationSpeed: parseFloat(e.target.value), enabled: true })}
                disabled={!lighting.autoRotate}
                className="w-full accent-amber-500 disabled:opacity-40 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 text-[10px]">
                {[
                  { label: '0.5x (緩慢)', val: 0.5 },
                  { label: '1.0x (標準)', val: 1.0 },
                  { label: '2.0x (高速)', val: 2.0 },
                  { label: '3.0x (疾走)', val: 3.0 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => updateLighting({ rotationSpeed: s.val, autoRotate: true, enabled: true })}
                    className={`px-1.5 py-0.5 rounded border transition ${
                      lighting.autoRotate && Math.abs((lighting.rotationSpeed || 1.0) - s.val) < 0.1
                        ? 'bg-amber-950 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Fixed Angle Offset */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Disc className="w-3.5 h-3.5 text-sky-400" />
                  <span>手動固定角度オフセット</span>
                </span>
                <span className="font-mono text-sky-300 font-bold">
                  {Math.round(lighting.manualAngleDeg || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={lighting.manualAngleDeg || 0}
                onChange={(e) => updateLighting({ manualAngleDeg: parseInt(e.target.value, 10), autoRotate: false, enabled: true })}
                className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 text-[10px]">
                {[0, 45, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => updateLighting({ manualAngleDeg: deg, autoRotate: false, enabled: true })}
                    className={`px-2 py-0.5 rounded border transition ${
                      Math.round(lighting.manualAngleDeg || 0) === deg
                        ? 'bg-sky-950 border-sky-500 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Distance & Intensity (光の距離・光量強度) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            {/* Distance Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">光源距離 (クランク中心から)</span>
                <span className="font-mono text-sky-300 font-bold">
                  {(lighting.distance || 6.2).toFixed(1)} m
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="16.0"
                step="0.2"
                value={lighting.distance || 6.2}
                onChange={(e) => updateLighting({ distance: parseFloat(e.target.value), enabled: true })}
                className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-1 pt-1">
                {LIGHT_DISTANCE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateLighting({ distance: p.distance })}
                    className={`py-1 px-1.5 rounded text-[10px] font-medium border text-center transition ${
                      Math.abs((lighting.distance || 6.2) - p.distance) < 0.4
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">光量・照度 (Intensity)</span>
                <span className="font-mono text-amber-300 font-bold">
                  {(lighting.intensity || 3.0).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={lighting.intensity || 3.0}
                onChange={(e) => updateLighting({ intensity: parseFloat(e.target.value), enabled: true })}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-2 gap-1 pt-1">
                {LIGHT_INTENSITY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateLighting({ intensity: p.intensity })}
                    className={`py-1 px-1.5 rounded text-[10px] font-medium border text-center transition ${
                      Math.abs((lighting.intensity || 3.0) - p.intensity) < 0.3
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Color Selection: RGB Sliders + Color Wheel + Presets */}
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>光の三原色 (RGB) & カラーホイール & 見栄えプリセット色</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-300">{lighting.color?.toUpperCase()}</span>
                <span
                  className="w-6 h-6 rounded-full border border-white/40 shadow-inner"
                  style={{ backgroundColor: lighting.color || '#ffffff' }}
                />
              </div>
            </div>

            {/* RGB Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              {/* Red */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-400">R (赤)</span>
                  <span className="font-mono text-rose-300">{currentRgb.r}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.r}
                  onChange={(e) => {
                    const newHex = rgbToHex(parseInt(e.target.value, 10), currentRgb.g, currentRgb.b);
                    updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Green */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400">G (緑)</span>
                  <span className="font-mono text-emerald-300">{currentRgb.g}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.g}
                  onChange={(e) => {
                    const newHex = rgbToHex(currentRgb.r, parseInt(e.target.value, 10), currentRgb.b);
                    updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Blue */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-sky-400">B (青)</span>
                  <span className="font-mono text-sky-300">{currentRgb.b}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.b}
                  onChange={(e) => {
                    const newHex = rgbToHex(currentRgb.r, currentRgb.g, parseInt(e.target.value, 10));
                    updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                  }}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Native Color Picker & Quick Color Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ワンクリック見栄えプリセット色:</span>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  <span>カラーホイールで選ぶ</span>
                  <input
                    type="color"
                    value={lighting.color || '#ffffff'}
                    onChange={(e) => updateLighting({ color: e.target.value, colorShiftMode: 'none', enabled: true })}
                    className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                {LIGHT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateLighting({ color: c.color, colorShiftMode: 'none', enabled: true })}
                    title={`${c.name} (${c.color})`}
                    className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition ${
                      lighting.color?.toLowerCase() === c.color.toLowerCase() && lighting.colorShiftMode === 'none'
                        ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/50'
                        : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-[9px] text-slate-300 truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Dynamic Color Shift Modes (時間経過による色彩変化演出) */}
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>舞台照明・動的カラーシフト (時間の経過で色彩が自動変化)</span>
              </span>
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                {COLOR_SHIFT_PRESETS.find((m) => m.id === lighting.colorShiftMode)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {COLOR_SHIFT_PRESETS.map((mode) => {
                const isSelected = lighting.colorShiftMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updateLighting({ colorShiftMode: mode.id, enabled: true })}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-xs">{mode.name}</span>
                    <span className="text-[9px] text-slate-400">{mode.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Shift Speed */}
            {lighting.colorShiftMode !== 'none' && (
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-300">カラー変化速度</span>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={lighting.colorShiftSpeed || 1.0}
                  onChange={(e) => updateLighting({ colorShiftSpeed: parseFloat(e.target.value) })}
                  className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="w-12 text-right font-mono text-slate-300 text-[10px]">
                  {(lighting.colorShiftSpeed || 1.0).toFixed(1)}x
                </span>
              </div>
            )}
          </div>

          {/* 6. Smoke Machine (スモークマシン・空間全体のライティング) */}
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>スモークマシン演出 (空間全体のライティング & 光芒)</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  空間に煙粒子と光芒コーンを漂わせ、ライトの軌跡と拡散光を立体化
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateLighting({ smokeEnabled: !lighting.smokeEnabled, enabled: true })}
                className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition active:scale-95 ${
                  lighting.smokeEnabled
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-md shadow-cyan-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {lighting.smokeEnabled ? 'スモーク ON' : 'スモーク OFF'}
              </button>
            </div>

            {lighting.smokeEnabled && (
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-300">スモーク濃度 (フォグ密度)</span>
                <input
                  type="range"
                  min="0.008"
                  max="0.08"
                  step="0.002"
                  value={lighting.smokeDensity || 0.032}
                  onChange={(e) => updateLighting({ smokeDensity: parseFloat(e.target.value) })}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="w-14 text-right font-mono text-cyan-300 text-[10px]">
                  {((lighting.smokeDensity || 0.032) * 1000).toFixed(0)} ppm
                </span>
              </div>
            )}
          </div>

          {/* 7. Multiple Light Sources & Light Position Gizmo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateLighting({ multiLightEnabled: !lighting.multiLightEnabled, enabled: true })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                lighting.multiLightEnabled
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>複数光源システム (3点照明)</span>
                <span>{lighting.multiLightEnabled ? '有効 (キー+リム+フィル)' : '単一主光源'}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                主光源の反対側から輪郭を際立たせるリムライト＋全体を包むフィルライトを連動照射
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateLighting({ showLightGizmo: !lighting.showLightGizmo, enabled: true })}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                lighting.showLightGizmo
                  ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>光源位置マーカー (光球ギズモ)</span>
                <span>{lighting.showLightGizmo ? '表示中' : '非表示'}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                3D空間内の現在のスポットライト位置を輝く小型光球として可視化
              </span>
            </button>
          </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 4: 仕様・使い方 (旧: about) */}
      {subTab === 'about' && (
        <div className="p-3.5 space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="font-bold text-sm text-slate-100 mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span>ガソリンエンジンシミュレーター 仕様・物理モデル解説</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              本シミュレーターは、オットーサイクル熱力学、クランクシャフト・ピストン運動機構、慣性力モーメント、および高精度3Dビジュアルレンダリングを統合したシミュレーションシステムです。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">■ エンジン形式・気筒配置</span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>直列 (Inline): 1気筒〜6気筒 (I1, I2, I3, I4, I5, I6)</li>
                <li>V型 (V-Type): 4気筒〜12気筒 (V4, V6, V8, V10, V12) 60°/75°/90°バンク角</li>
                <li>水平対向 (Boxer): 2気筒〜6気筒 (F2, F4, F6) 180°対向</li>
                <li>V8専用: 90°クロスプレーン (アメ車/重低音) vs 180°フラットプレーン (レーシング)</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="font-bold text-slate-200 block mb-1">■ 3Dカメラ・視点操作</span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>回転: 左ドラッグ / 1本指スワイプ</li>
                <li>ズーム: マウスホイール / ピンチイン・ピンチアウト</li>
                <li>移動: 右ドラッグ / 2本指スワイプ</li>
                <li>右上HUD: プリセット視点 (正面, クランク側面, 上部など) へワンタップ移動</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
