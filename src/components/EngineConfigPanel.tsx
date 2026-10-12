import React, { useState } from 'react';
import { EngineConfig } from '../types/engine';
import { ENGINE_PRESETS } from '../data/enginePresets';
import {
  Trophy,
  Settings2,
  Check,
  Sparkles,
  Scale,
} from 'lucide-react';

interface EngineConfigPanelProps {
  config: EngineConfig;
  onUpdateConfig: (patch: Partial<EngineConfig>) => void;
  onOpenMaterialsModal: () => void;
  onOpenV8Tribute?: () => void;
  initialSubTab?: 'presets' | 'specs';
}

export const EngineConfigPanel: React.FC<EngineConfigPanelProps> = ({
  config,
  onUpdateConfig,
  onOpenMaterialsModal,
  onOpenV8Tribute,
  initialSubTab = 'specs',
}) => {
  const [subTab, setSubTab] = useState<'presets' | 'specs'>(initialSubTab);

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
      {/* Sub-tab Navigation Header: Exactly 2 tabs, grid-cols-2, no scrolling needed */}
      <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/70 p-1 gap-1">
        <button
          id="engine-tab-presets"
          type="button"
          onClick={() => setSubTab('presets')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            subTab === 'presets'
              ? 'bg-amber-950/60 border border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">名機プリセット</span>
          {activePreset && (
            <span className="hidden sm:inline-block ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {activePreset.shortName}
            </span>
          )}
        </button>

        <button
          id="engine-tab-specs"
          type="button"
          onClick={() => setSubTab('specs')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            subTab === 'specs'
              ? 'bg-sky-950/70 border border-sky-500/80 text-sky-300 shadow-md ring-1 ring-sky-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">形式・気筒数・ボア</span>
        </button>
      </div>

      {/* Sub-tab 1: Presets Catalog */}
      {subTab === 'presets' && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Honor the V8! Special Tribute Banner (Integrated from header) */}
          {onOpenV8Tribute && (
            <button
              id="presets-honor-v8-banner"
              type="button"
              onClick={onOpenV8Tribute}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-rose-950/60 to-slate-950/90 border border-amber-500/70 hover:border-amber-400 text-left flex items-center justify-between transition-all group shadow-md shadow-amber-950/40 active:scale-[0.99]"
              title="Honor the V8! 栄光のV8名機 特集 & クロスプレーン/フラットプレーン鑑賞"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <span>Honor the V8! 栄光のV8名機 特集</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-normal">
                      特別鑑賞
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    クロスプレーン（ドロドロ重低音）vs フラットプレーン（超高回転）の鑑賞＆名機ギャラリー
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 pl-2">
                鑑賞する ↗
              </span>
            </button>
          )}

          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>歴史的傑作・名機実機プリセット</span>
              </div>
              <p className="text-[11px] text-slate-400">
                実機スペック（ボア径・ストローク・バンク角・排気量）を忠実に完全再現
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

      {/* Sub-tab 2: Engine Specs & Cylinder Configuration */}
      {subTab === 'specs' && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Quick Preset Selector Carousel inside Specs */}
          <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>名機プリセット クイック適用</span>
              </span>
              <button
                type="button"
                onClick={() => setSubTab('presets')}
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
    </div>
  );
};
