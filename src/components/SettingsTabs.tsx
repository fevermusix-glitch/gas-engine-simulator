import React, { useState } from 'react';
import {
  EngineConfig,
  EngineVisualOptions,
  EngineLayout,
  ExplosionEffectType,
  ShadingMode,
  BackgroundStyle,
  StageLightingOptions,
  LightRotationPlane,
  ColorShiftMode,
  DEFAULT_STAGE_LIGHTING,
  MASTER_LIGHTING_PRESETS,
  LIGHT_ROTATION_PLANES,
  LIGHT_COLOR_PRESETS,
  COLOR_SHIFT_MODES,
  LIGHT_DISTANCE_PRESETS,
  LIGHT_INTENSITY_PRESETS,
} from '../types/engine';
import {
  Sliders,
  Eye,
  Settings2,
  Wrench,
  Flame,
  Layers,
  Sparkles,
  Info,
  Scale,
  Sun,
  Palette,
  Trophy,
  Check,
  Lightbulb,
  Wind,
  RotateCw,
  Compass,
  Disc,
} from 'lucide-react';
import { ENGINE_PRESETS, EnginePreset } from '../data/enginePresets';
import { EASING_OPTIONS } from '../utils/easing';

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

interface SettingsTabsProps {
  config: EngineConfig;
  onUpdateConfig: (patch: Partial<EngineConfig>) => void;
  visualOptions: EngineVisualOptions;
  onUpdateVisuals: (patch: Partial<EngineVisualOptions>) => void;
  onOpenMaterialsModal: () => void;
  onOpenV8Tribute?: () => void;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  config,
  onUpdateConfig,
  visualOptions,
  onUpdateVisuals,
  onOpenMaterialsModal,
  onOpenV8Tribute,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'specs' | 'visuals' | 'lighting' | 'explosions' | 'about'>('specs');

  // Determine which preset matches current config (if any)
  const activePreset = ENGINE_PRESETS.find((p) => {
    return (
      p.config.layout === config.layout &&
      p.config.cylinderCount === config.cylinderCount &&
      Math.abs((p.config.boreMm ?? 0) - config.boreMm) < 0.2 &&
      Math.abs((p.config.strokeMm ?? 0) - config.strokeMm) < 0.2 &&
      (config.layout !== 'v-type' || Math.abs((p.config.vAngleDeg ?? 0) - config.vAngleDeg) < 1)
    );
  });

  // Cylinder count options depending on layout
  const inlineCylinderCounts = [1, 2, 3, 4, 5, 6];
  const vCylinderCounts = [4, 6, 8, 10, 12];
  const boxerCylinderCounts = [2, 4, 6];

  return (
    <div className="flex flex-col w-full bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md text-slate-100 shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none">
        <button
          id="settings-tab-presets"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'presets'
              ? 'border-amber-500 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>名機・実機プリセット</span>
          {activePreset && (
            <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {activePreset.shortName}
            </span>
          )}
        </button>

        <button
          id="settings-tab-specs"
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'specs'
              ? 'border-sky-500 text-sky-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>形式・気筒数・ボア</span>
        </button>

        <button
          id="settings-tab-visuals"
          onClick={() => setActiveTab('visuals')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'visuals'
              ? 'border-sky-500 text-sky-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>3D透過・分解図・質感</span>
        </button>

        <button
          id="settings-tab-lighting"
          onClick={() => setActiveTab('lighting')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'lighting'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20 shadow-inner'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>3Dライティング・舞台照明</span>
          {visualOptions.lighting?.enabled && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          id="settings-tab-explosions"
          onClick={() => setActiveTab('explosions')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'explosions'
              ? 'border-sky-500 text-sky-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>燃焼・クランク可視化</span>
        </button>

        <button
          id="settings-tab-about"
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'about'
              ? 'border-sky-500 text-sky-400 bg-slate-900/80'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>仕様・使い方</span>
        </button>
      </div>

      {/* Tab 0: Presets Catalog (4A-GEU 1.6L, RB26DETT 2.6L, M120 7.3L, RA121E, Kei 660) */}
      {activeTab === 'presets' && (
        <div className="p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>歴史的傑作・名機実機プリセット</span>
              </div>
              <p className="text-[11px] text-slate-400">
                実機スペック（ボア径・ストローク・バンク角・排気量）をWikipedia等に基づき完全再現
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {ENGINE_PRESETS.map((preset) => {
              const isSelected = activePreset?.id === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{preset.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-300 font-semibold">
                          {preset.categoryLabel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold">
                          {preset.displacement}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{preset.tagline}</div>
                    </div>

                    <button
                      id={`apply-preset-${preset.id}-btn`}
                      onClick={() => onUpdateConfig(preset.config)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 border border-emerald-400 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>適用中</span>
                        </>
                      ) : (
                        <span>このエンジンをロード</span>
                      )}
                    </button>
                  </div>

                  {/* Spec Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">シリンダーボア径</span>
                      <span className="font-mono font-bold text-sky-300">{preset.boreMm} mm</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">ピストンストローク</span>
                      <span className="font-mono font-bold text-amber-300">{preset.strokeMm} mm</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">気筒形式 / バンク角</span>
                      <span className="font-bold text-slate-200">
                        {preset.layout === 'inline'
                          ? `直列${preset.cylinderCount}気筒`
                          : preset.layout === 'boxer'
                          ? `水平対向${preset.cylinderCount}気筒 (180° Boxer)`
                          : `V型${preset.cylinderCount}気筒 (${preset.vAngleDeg}°)`}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">ボア・ストローク比</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        {(preset.boreMm / preset.strokeMm).toFixed(2)}{' '}
                        <span className="text-[9px] font-normal text-slate-400">
                          {preset.boreMm > preset.strokeMm ? '(ショート)' : preset.boreMm < preset.strokeMm ? '(ロング)' : '(スクエア)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Description & Famous Vehicles */}
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">{preset.description}</p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">代表搭載:</span>
                    <span>{preset.famousVehicles}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Engine Specs & Cylinder Configuration */}
      {activeTab === 'specs' && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Quick Preset Selector Carousel inside Specs Tab */}
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>名機プリセット クイック適用</span>
              </span>
              <button
                onClick={() => setActiveTab('presets')}
                className="text-[10px] text-sky-400 hover:text-sky-300 hover:underline font-medium"
              >
                詳細スペック比較を見る →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {ENGINE_PRESETS.map((preset) => {
                const isSelected = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    id={`quick-preset-${preset.id}-btn`}
                    onClick={() => onUpdateConfig(preset.config)}
                    className={`py-1.5 px-2 rounded-lg border text-left flex flex-col transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/50'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] truncate">{preset.shortName}</span>
                    <span className="text-[9px] text-slate-400 font-mono truncate">{preset.displacement}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout Selector: Inline vs V-Type vs Boxer */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300">シリンダー配置 (レイアウト)</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="layout-inline-btn"
                onClick={() => {
                  onUpdateConfig({
                    layout: 'inline',
                    cylinderCount: config.cylinderCount > 6 ? 4 : config.cylinderCount,
                  });
                }}
                className={`py-2 px-2 rounded-xl border font-bold flex flex-col items-center gap-0.5 transition-all ${
                  config.layout === 'inline'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-md shadow-sky-950'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>直列 (Inline)</span>
                <span className="text-[10px] font-normal opacity-80">I1〜I6</span>
              </button>

              <button
                id="layout-vtype-btn"
                onClick={() => {
                  onUpdateConfig({
                    layout: 'v-type',
                    cylinderCount: config.cylinderCount < 4 ? 6 : config.cylinderCount,
                  });
                }}
                className={`py-2 px-2 rounded-xl border font-bold flex flex-col items-center gap-0.5 transition-all ${
                  config.layout === 'v-type'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-md shadow-sky-950'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>V型 (V-Type)</span>
                <span className="text-[10px] font-normal opacity-80">V4〜V12</span>
              </button>

              <button
                id="layout-boxer-btn"
                onClick={() => {
                  onUpdateConfig({
                    layout: 'boxer',
                    cylinderCount: [2, 4, 6].includes(config.cylinderCount) ? config.cylinderCount : 4,
                  });
                }}
                className={`py-2 px-2 rounded-xl border font-bold flex flex-col items-center gap-0.5 transition-all ${
                  config.layout === 'boxer'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-md shadow-sky-950'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>水平対向 (Boxer)</span>
                <span className="text-[10px] font-normal opacity-80">F2〜F6 (180°)</span>
              </button>
            </div>
          </div>

          {/* Cylinder Count Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">気筒数 (Cylinders)</span>
              <span className="font-bold text-sky-400">
                {config.layout === 'inline'
                  ? `直列 ${config.cylinderCount} 気筒`
                  : config.layout === 'v-type'
                  ? `V型 ${config.cylinderCount} 気筒`
                  : `水平対向 ${config.cylinderCount} 気筒 (Flat-${config.cylinderCount})`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(config.layout === 'inline'
                ? inlineCylinderCounts
                : config.layout === 'v-type'
                ? vCylinderCounts
                : boxerCylinderCounts
              ).map((count) => (
                <button
                  key={count}
                  onClick={() => onUpdateConfig({ cylinderCount: count })}
                  className={`flex-1 min-w-[42px] py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    config.cylinderCount === count
                      ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {config.layout === 'inline' ? `I${count}` : config.layout === 'v-type' ? `V${count}` : `F${count}`}
                </button>
              ))}
            </div>
          </div>

          {/* V-Bank Angle (For V-Type) */}
          {config.layout === 'v-type' && (
            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Vバンク挟み角</span>
                <span className="font-mono text-sky-400">{config.vAngleDeg}°</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[60, 75, 90].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => onUpdateConfig({ vAngleDeg: angle })}
                    className={`py-1 rounded-lg border text-xs font-medium transition ${
                      config.vAngleDeg === angle
                        ? 'bg-sky-950 border-sky-500 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {angle}° {angle === 90 ? '(標準V8)' : angle === 60 ? '(標準V6)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* V8 Special Architecture: Crossplane vs Flatplane Crankshaft */}
          {config.layout === 'v-type' && config.cylinderCount === 8 && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/40 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>V8 クランク形式 (Crankshaft Type)</span>
                </div>
                {onOpenV8Tribute && (
                  <button
                    id="settings-open-v8-tribute-btn"
                    onClick={onOpenV8Tribute}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 transition"
                  >
                    V8名機 特集を見る
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="v8-crank-crossplane-btn"
                  onClick={() => onUpdateConfig({ crankshaftType: 'crossplane' })}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                    config.crankshaftType !== 'flatplane'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-amber-700/50'
                  }`}
                >
                  <span className="font-bold text-xs">90° 十字 (Crossplane)</span>
                  <span className="text-[10px] opacity-80 leading-tight">
                    重低音ドロドロ脈動音・1次完全バランス
                  </span>
                </button>

                <button
                  id="v8-crank-flatplane-btn"
                  onClick={() => onUpdateConfig({ crankshaftType: 'flatplane' })}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                    config.crankshaftType === 'flatplane'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-amber-700/50'
                  }`}
                >
                  <span className="font-bold text-xs">180° 平面 (Flatplane)</span>
                  <span className="text-[10px] opacity-80 leading-tight">
                    フェラーリ/GT3・超高回転スクリーム
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Bore and Stroke Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">シリンダーボア径</span>
                <span className="font-mono text-slate-200">{config.boreMm} mm</span>
              </div>
              <input
                type="range"
                min="50"
                max="165"
                step="0.5"
                value={config.boreMm}
                onChange={(e) => onUpdateConfig({ boreMm: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>50mm (軽・小排気量)</span>
                <span>165mm (巨大航空機)</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-400">ピストンストローク</span>
                <span className="font-mono text-slate-200">{config.strokeMm} mm</span>
              </div>
              <input
                type="range"
                min="40"
                max="170"
                step="0.5"
                value={config.strokeMm}
                onChange={(e) => onUpdateConfig({ strokeMm: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>40mm (F1超ショート)</span>
                <span>170mm (大排気量ロング)</span>
              </div>
            </div>
          </div>

          {/* Block Material Choice & Material Weights Inspection Button */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ブロック材質:</span>
              <button
                onClick={() =>
                  onUpdateConfig({
                    blockMaterial: config.blockMaterial === 'aluminum' ? 'cast_iron' : 'aluminum',
                  })
                }
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                {config.blockMaterial === 'aluminum' ? 'アルミ合金 (軽量)' : '鋳鉄 (高剛性)'}
              </button>
            </div>

            <button
              id="open-material-analysis-btn"
              onClick={onOpenMaterialsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-semibold text-xs transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>材質・重量分布解析</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Visuals, Cutaway, Exploded, Opacity, Water Jacket, Exhaust */}
      {activeTab === 'visuals' && (
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

            {/* Quick Step Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '格納 (0%)', val: 0.0 },
                { label: '中間展開 (50%)', val: 0.5 },
                { label: '完全分離 (100%)', val: 1.0 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => onUpdateVisuals({ explodedProgress: btn.val })}
                  className={`py-1 px-1.5 text-[11px] rounded font-medium transition ${
                    Math.abs(visualOptions.explodedProgress - btn.val) < 0.05
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Easing Function Selection */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">分離アニメーション・イージング関数</span>
                <span className="text-[10px] text-purple-400 font-mono">
                  {visualOptions.explodedEasing || 'cubic'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                {EASING_OPTIONS.map((opt) => {
                  const currentEasing = visualOptions.explodedEasing || 'cubic';
                  const isSelected = currentEasing === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onUpdateVisuals({ explodedEasing: opt.id })}
                      title={opt.desc}
                      className={`py-1 px-1.5 text-[10px] rounded border text-center transition font-medium truncate ${
                        isSelected
                          ? 'bg-purple-900/70 border-purple-500 text-purple-200 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Active Easing Description */}
              <p className="text-[10px] text-slate-400 leading-tight">
                {EASING_OPTIONS.find((o) => o.id === (visualOptions.explodedEasing || 'cubic'))?.desc}
              </p>

              {/* Physical Separation Components Indicator */}
              <div className="flex flex-wrap gap-1 mt-0.5 text-[9px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400">
                  ↓ クランクシャフト降下
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400">
                  ↑ ピストン冠面ボア軸分離
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400">
                  ↕ コンロッド中間浮遊
                </span>
              </div>
            </div>
          </div>

          {/* Component Visibility Toggles */}
          <div className="grid grid-cols-2 gap-2">
            {/* Cutaway vs Cover */}
            <button
              onClick={() => onUpdateVisuals({ isCutaway: !visualOptions.isCutaway })}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                visualOptions.isCutaway
                  ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold">カットオフ可視化</span>
              <span className="text-[10px] text-slate-400">
                {visualOptions.isCutaway ? 'ピストン・クランク露出' : 'エンジンカバー装着'}
              </span>
            </button>

            {/* Exhaust Pipes Toggle */}
            <button
              id="toggle-exhaust-btn"
              onClick={() => onUpdateVisuals({ showExhaust: !visualOptions.showExhaust })}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                visualOptions.showExhaust
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold">エキゾーストパイプ</span>
              <span className="text-[10px] text-slate-400">
                {visualOptions.showExhaust ? '排気マニホールド表示中' : '非表示'}
              </span>
            </button>

            {/* Water Jacket Toggle */}
            <button
              id="toggle-waterjacket-btn"
              onClick={() => onUpdateVisuals({ showWaterJacket: !visualOptions.showWaterJacket })}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                visualOptions.showWaterJacket
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold">ウォータージャケット</span>
              <span className="text-[10px] text-slate-400">
                {visualOptions.showWaterJacket ? '冷却水流路を可視化' : '非表示'}
              </span>
            </button>

            {/* Heatmap Toggle */}
            <button
              onClick={() => onUpdateVisuals({ showHeatmap: !visualOptions.showHeatmap })}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                visualOptions.showHeatmap
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold">温度ヒートマップ</span>
              <span className="text-[10px] text-slate-400">
                {visualOptions.showHeatmap ? '大げさな高コントラスト熱分布表示中' : '非表示 (実機金属マテリアル)'}
              </span>
            </button>

            {/* Explosion Effect Toggle in Visuals Tab */}
            <button
              id="toggle-explosion-visuals-btn"
              onClick={() => onUpdateVisuals({ showExplosion: visualOptions.showExplosion === false })}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                visualOptions.showExplosion !== false
                  ? 'bg-orange-950/60 border-orange-500 text-orange-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold">燃焼・爆発エフェクト</span>
              <span className="text-[10px] text-slate-400">
                {visualOptions.showExplosion !== false ? 'シリンダー燃焼炎を表示中' : '爆発非表示 (機構のみ観察)'}
              </span>
            </button>
          </div>

          {/* Shading Mode (Texture & Surface Rendering) */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span>3Dテクスチャ & 質感表現 (シェーディング)</span>
              </span>
              <span className="text-[11px] font-mono text-sky-400">
                {visualOptions.shadingMode === 'exaggerated_metallic'
                  ? '✨ 大げさなメタリック'
                  : visualOptions.shadingMode === 'toon'
                  ? '🎨 トゥーンシェード'
                  : visualOptions.shadingMode === 'wireframe'
                  ? '📐 ワイヤフレーム'
                  : '⚙️ 標準メタル'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                {
                  id: 'standard' as ShadingMode,
                  name: '標準メタル',
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

          {/* Quick jump to 3D Lighting Tab */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/30 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>3Dステージ・ライティング & スモーク演出</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                クランクシャフト周回回転光、光の三原色RGB、時間色変化、スモークマシンなど高度な舞台照明
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('lighting')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              ライティング設定へ →
            </button>
          </div>
        </div>
      )}

      {/* Tab: 3D Stage Lighting & Smoke Overhaul */}
      {activeTab === 'lighting' && (() => {
        const lighting = visualOptions.lighting || DEFAULT_STAGE_LIGHTING;
        const currentRgb = hexToRgb(lighting.color || '#ffffff');

        const updateLighting = (patch: Partial<StageLightingOptions>) => {
          onUpdateVisuals({
            lighting: {
              ...lighting,
              ...patch,
            },
          });
        };

        return (
          <div className="p-3.5 space-y-3.5 text-xs">
            {/* 1. Master On/Off & Multi-light Rig Controls */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>3Dステージ・ライティング</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  クランクシャフトを中心軸とした立体周回照明・光の三原色・舞台スモーク演出
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="stage-lighting-master-toggle"
                  onClick={() => updateLighting({ enabled: !lighting.enabled })}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition flex items-center gap-1.5 ${
                    lighting.enabled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${lighting.enabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{lighting.enabled ? 'ライティング ON' : 'ライティング OFF'}</span>
                </button>
              </div>
            </div>

            {/* 2. Master Lighting Presets (総合マスタープリセット) */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>総合マスター・ライティングプリセット</span>
                </span>
                <span className="text-[10px] text-slate-400">移動・色・強度・距離・スモークを一括反映</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MASTER_LIGHTING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateLighting({ ...preset.options, enabled: true })}
                    className="p-2.5 rounded-xl border border-slate-800 hover:border-amber-500/60 bg-slate-900/80 hover:bg-slate-800/90 text-left transition flex flex-col gap-1 group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300 text-xs">
                        {preset.name}
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

            {/* 3. Orbit Plane & Rotation Dynamics (クランクシャフト周回・回転面) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>クランクシャフト回転プレーン & 周回制御</span>
                </span>
                <span className="text-[10px] font-mono text-sky-400">
                  {lighting.plane === 'horizontal' && '水平 360°'}
                  {lighting.plane === 'vertical' && '垂直 360°'}
                  {lighting.plane === 'tilt_pos45' && '+45° 傾斜'}
                  {lighting.plane === 'tilt_neg45' && '-45° 傾斜'}
                </span>
              </div>

              {/* 4 Orbit Planes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LIGHT_ROTATION_PLANES.map((plane) => {
                  const isSelected = (lighting.plane || 'horizontal') === plane.id;
                  return (
                    <button
                      key={plane.id}
                      type="button"
                      onClick={() => updateLighting({ plane: plane.id, enabled: true })}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                        isSelected
                          ? 'bg-sky-950/70 border-sky-500 text-sky-200 shadow-md ring-1 ring-sky-500/50'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="font-bold text-xs">{plane.name}</span>
                      <span className="text-[9px] text-slate-400">{plane.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Auto-rotation & Speed & Manual Angle Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                {/* Auto-rotate Toggle & Speed */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-amber-400" />
                      <span>自動回転</span>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.2"
                      max="3.5"
                      step="0.1"
                      value={lighting.rotationSpeed || 1.0}
                      onChange={(e) => updateLighting({ rotationSpeed: parseFloat(e.target.value) })}
                      disabled={!lighting.autoRotate}
                      className="flex-1 accent-amber-500 disabled:opacity-40 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="w-12 text-right font-mono text-slate-300 text-[10px]">
                      {(lighting.rotationSpeed || 1.0).toFixed(1)}x
                    </span>
                  </div>
                </div>

                {/* Manual Rotation Angle */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">手動オフセット角度</span>
                    <span className="font-mono text-slate-300 text-[10px]">
                      {(lighting.manualAngleDeg || 0).toFixed(0)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={lighting.manualAngleDeg || 0}
                    onChange={(e) => updateLighting({ manualAngleDeg: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 text-[9px] text-slate-400">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => updateLighting({ manualAngleDeg: deg })}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Light Distance & Intensity (クランクシャフトからの距離 & 強度) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Distance */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">ライト距離 (クランク軸基準)</span>
                  <span className="font-mono text-amber-400 text-[11px]">
                    {(lighting.distance || 6.2).toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="16.0"
                  step="0.2"
                  value={lighting.distance || 6.2}
                  onChange={(e) => updateLighting({ distance: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
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

              {/* Intensity */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">ライト強度 (ルクス/照度)</span>
                  <span className="font-mono text-amber-400 text-[11px]">
                    {(lighting.intensity || 3.0).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.2"
                  value={lighting.intensity || 3.0}
                  onChange={(e) => updateLighting({ intensity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
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

            {/* 5. Lighting Colors & Three Primary Colors (RGB & Color Wheel) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-pink-400" />
                  <span>ライティングカラー & 光の三原色（RGB）</span>
                </span>
                <span className="font-mono text-[11px] text-pink-300">
                  {lighting.color || '#ffffff'}
                </span>
              </div>

              {/* Color Wheel & RGB Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                {/* Color Wheel Picker */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                  <input
                    type="color"
                    value={lighting.color || '#ffffff'}
                    onChange={(e) => updateLighting({ color: e.target.value, colorShiftMode: 'none', enabled: true })}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="カラーホイールで自由色を選択"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-slate-200">カラーホイール</span>
                    <span className="text-[10px] text-slate-400">クリックして色相・彩度を選択</span>
                  </div>
                </div>

                {/* Primary Colors RGB Individual Sliders */}
                <div className="sm:col-span-2 flex flex-col gap-1.5 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                  {/* Red */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-red-400 font-bold">R</span>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={currentRgb.r}
                      onChange={(e) => {
                        const newHex = rgbToHex(parseInt(e.target.value), currentRgb.g, currentRgb.b);
                        updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                      }}
                      className="flex-1 accent-red-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono text-slate-300">{currentRgb.r}</span>
                  </div>

                  {/* Green */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-green-400 font-bold">G</span>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={currentRgb.g}
                      onChange={(e) => {
                        const newHex = rgbToHex(currentRgb.r, parseInt(e.target.value), currentRgb.b);
                        updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                      }}
                      className="flex-1 accent-green-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono text-slate-300">{currentRgb.g}</span>
                  </div>

                  {/* Blue */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-blue-400 font-bold">B</span>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={currentRgb.b}
                      onChange={(e) => {
                        const newHex = rgbToHex(currentRgb.r, currentRgb.g, parseInt(e.target.value));
                        updateLighting({ color: newHex, colorShiftMode: 'none', enabled: true });
                      }}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono text-slate-300">{currentRgb.b}</span>
                  </div>
                </div>
              </div>

              {/* Curated Preset Colors */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">見栄えがするプリセット色パレット</span>
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

            {/* 6. Time-based Color Shift (舞台照明・時間カラー変化) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>舞台照明・時間経過カラーシフト（色の動的変化）</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono">
                  {COLOR_SHIFT_MODES.find((m) => m.id === (lighting.colorShiftMode || 'none'))?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {COLOR_SHIFT_MODES.map((mode) => {
                  const isSelected = (lighting.colorShiftMode || 'none') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateLighting({ colorShiftMode: mode.id, enabled: true })}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                        isSelected
                          ? 'bg-purple-950/70 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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

            {/* 7. Smoke Machine (スモークマシン・空間全体のライティング) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>スモークマシン演出 (空間全体の拡散光 & 光芒)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    舞台照明の煙霧により空間全体がライト光で輝き、浮遊微粒子と光条ビーム（ライトコーン）が出現
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateLighting({ smokeEnabled: !lighting.smokeEnabled, enabled: true })}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition ${
                    lighting.smokeEnabled
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lighting.smokeEnabled ? 'スモーク ON' : 'スモーク OFF'}
                </button>
              </div>

              {lighting.smokeEnabled && (
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-300">スモーク濃度 (煙霧密度)</span>
                  <input
                    type="range"
                    min="0.008"
                    max="0.065"
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

            {/* 8. Multiple Light Sources & Light Position Gizmo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Multi-light toggle */}
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

              {/* Beacon & Beam Gizmo toggle */}
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
                  <span>光源位置ビーコン & 光線ビーム</span>
                  <span>{lighting.showLightGizmo ? '表示中' : '非表示'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  光源の現在位置を示す光球マーカーと、クランクシャフトへ照射される光線コーンを表示
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tab 3: Explosion Mode & Crankshaft Visibility */}
      {activeTab === 'explosions' && (
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

          {/* Combustion Explosion Effect Choice */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300">爆発エフェクトスタイル</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="explosion-metaball-btn"
                onClick={() => onUpdateVisuals({ explosionEffect: 'metaball' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  visualOptions.explosionEffect === 'metaball'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  メタボール球体 (発光体)
                </div>
                <div className="text-[10px] text-slate-400">
                  クリーンで視認性の高いプラズマエネルギー球体の膨張
                </div>
              </button>

              <button
                id="explosion-realistic-btn"
                onClick={() => onUpdateVisuals({ explosionEffect: 'realistic' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                  visualOptions.explosionEffect === 'realistic'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
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
              {visualOptions.showCameraHUD ? '有効' : '非表示'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: About, Mobile Tips & PWA Info */}
      {activeTab === 'about' && (
        <div className="p-3.5 space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-bold text-sky-400 mb-1">📱 スマホ完全対応ジェスチャー操作</h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li><strong>1本指ドラッグ:</strong> エンジン3Dモデルを自由に回転</li>
              <li><strong>2本指ピンチイン/アウト:</strong> 直感的な拡大・縮小</li>
              <li><strong>2本指スライド:</strong> カメラのパン移動（平行移動）</li>
              <li><strong>長押しコンテキストメニュー無効化:</strong> 誤操作を防ぎ快適にシミュレート</li>
            </ul>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-bold text-emerald-400 mb-1">🔬 リアルタイム熱力学物理エンジン</h3>
            <p className="text-[11px] text-slate-400">
              4ストローク（吸気・圧縮・燃焼・排気）の720°クランクサイクルを完全連動計算。
              ポリトロープ圧縮・等容燃焼・断熱膨張からなるオットーサイクルの指圧線図（P-V Diagram）や、
              スロットル開度・空燃比（A/F）による燃焼効率・トルク・出力・熱効率（ηth）を瞬時に演算しています。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
