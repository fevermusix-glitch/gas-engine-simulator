import React from 'react';
import {
  Sparkles,
  Flame,
  X,
  Gauge,
  Activity,
  CheckCircle2,
  ChevronRight,
  RotateCw,
  Compass,
  Zap,
} from 'lucide-react';
import { EngineConfig, EngineTelemetry } from '../types/engine';

interface V8TributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: EngineConfig;
  telemetry: EngineTelemetry;
  onApplyConfig: (newConfig: Partial<EngineConfig>, cameraPreset?: string) => void;
}

interface V8Preset {
  id: string;
  name: string;
  origin: string;
  tagline: string;
  crankshaftType: 'crossplane' | 'flatplane';
  displacement: string;
  boreMm: number;
  strokeMm: number;
  compressionRatio: number;
  rodLengthMm: number;
  vAngleDeg: number;
  firingOrder: string;
  bankSequence: string;
  soundDescription: string;
  description: string;
  highlightColor: string;
}

const V8_PRESETS: V8Preset[] = [
  {
    id: 'muscle_crossplane',
    name: 'American 6.2L Crossplane V8',
    origin: 'US Muscle / Small Block V8',
    tagline: '伝統の90°十字クランク・魂を震わせるドロドロ重低音',
    crankshaftType: 'crossplane',
    displacement: '6,162 cc (6.2L)',
    boreMm: 103.2,
    strokeMm: 92.0,
    compressionRatio: 10.7,
    rodLengthMm: 154.7,
    vAngleDeg: 90,
    firingOrder: '1 - 8 - 4 - 3 - 6 - 5 - 7 - 2',
    bankSequence: 'R → L → R → L → L → R → L → R',
    soundDescription: '片バンク連続点火(L-L/R-R)がもたらす独創の不均等マッスルビート',
    description:
      'アメリカンマッスルの象徴。90度クランクピン配置により1次慣性力と偶力をカウンターウェイトで完全消去。重厚で滑らかな低中速トルクと、独特の脈動エキゾーストノートを奏でます。',
    highlightColor: 'from-amber-500/20 to-orange-600/20 border-amber-500/50 text-amber-300',
  },
  {
    id: 'italian_flatplane',
    name: 'Italian 4.5L Flat-Plane V8',
    origin: 'Italian Supercar / GT Racing',
    tagline: '180°一文字クランク・9,000rpm超高回転スクリーム',
    crankshaftType: 'flatplane',
    displacement: '4,497 cc (4.5L)',
    boreMm: 94.0,
    strokeMm: 81.0,
    compressionRatio: 12.5,
    rodLengthMm: 140.0,
    vAngleDeg: 90,
    firingOrder: '1 - 5 - 4 - 8 - 7 - 2 - 6 - 3',
    bankSequence: 'R → L → R → L → R → L → R → L',
    soundDescription: '左右バンク完全交互点火が生む等間隔・高周波のエキゾーストスクリーム',
    description:
      'フェラーリやGTレーシングカーが採用する180°フラットプレーン。直列4気筒を2基並べた構造で、巨大なカウンターウェイトが不要なため超軽量・超高レスポンスを実現。突き抜ける高周波サウンドが特徴です。',
    highlightColor: 'from-rose-500/20 to-red-600/20 border-rose-500/50 text-rose-300',
  },
  {
    id: 'modern_hot_v',
    name: 'German 4.0L Bi-Turbo V8',
    origin: 'Modern Super Sport / Hot-V',
    tagline: '超高効率スクエア設計・最高峰の熱力学マネジメント',
    crankshaftType: 'crossplane',
    displacement: '3,982 cc (4.0L)',
    boreMm: 83.0,
    strokeMm: 92.0,
    compressionRatio: 10.5,
    rodLengthMm: 145.0,
    vAngleDeg: 90,
    firingOrder: '1 - 8 - 4 - 3 - 6 - 5 - 7 - 2',
    bankSequence: 'R → L → R → L → L → R → L → R',
    soundDescription: '緻密にチューニングされた低周波の野獣のごとき咆哮',
    description:
      '現代AMGや最新ハイパーカーが採用する高効率V8。90度バンクによる優れた動的剛性と、低回転から立ち上がる強大なフラットトルクを極限まで両立した最高峰の内燃機関です。',
    highlightColor: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-300',
  },
];

export const V8TributeModal: React.FC<V8TributeModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  telemetry,
  onApplyConfig,
}) => {
  if (!isOpen) return null;

  const isV8Current = currentConfig.layout === 'v-type' && currentConfig.cylinderCount === 8;
  const currentCrankType = currentConfig.crankshaftType || 'crossplane';

  // Real-time active firing cylinder (power stroke)
  const firingCylinder = telemetry.cylinders.find((c) => c.strokePhase.includes('燃焼'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl border border-amber-500/30 shadow-2xl shadow-amber-950/40 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Hall of Fame
                </span>
                <span className="text-xs text-slate-400">栄光の内燃機関</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                HONOR THE V8! <span className="text-amber-400 text-sm font-normal">栄光のV8エンジン</span>
              </h2>
            </div>
          </div>

          <button
            id="v8-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Hero Tribute Banner */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-950 border border-amber-500/30 overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-2">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                1914年の量産化から1世紀を超え、自動車工学の頂座に君臨し続ける<strong className="text-amber-300">「キング・オブ・エンジン」V8</strong>。
                90°バンクが実現する完全一次振動バランス、左右バンクをドラマチックに往復する点火パルス、そしてクロスプレーンの重低音からフラットプレーンの超高回転スクリームまで、V8の真髄をリアルタイム3Dシミュレーションで体感してください。
              </p>

              {/* Real-time Firing Status when V8 is running */}
              {isV8Current && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-xs">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-slate-400">現在稼働中:</span>
                    <span className="font-bold text-amber-400">
                      V8 {currentCrankType === 'flatplane' ? '180° 平面 (Flat-plane)' : '90° 十字 (Cross-plane)'}
                    </span>
                  </div>

                  {firingCylinder && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/60 text-xs text-amber-200 shadow-sm animate-pulse">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>
                        燃焼爆発中: <strong>気筒 #{firingCylinder.index + 1}</strong> (
                        {firingCylinder.index % 2 === 1 ? '右バンク' : '左バンク'})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* V8 Bank Visualizer: Cylinder Bank Layout & Firing Sequence */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-200">V8 左右バンク配置 & リアルタイム点火シークエンス</h3>
              </div>
              <span className="text-xs text-slate-400">
                形式: <strong className="text-amber-300">{currentCrankType === 'flatplane' ? 'フラットプレーン (180°)' : 'クロスプレーン (90°)'}</strong>
              </span>
            </div>

            {/* 8 Cylinders Diagram in V formation */}
            <div className="grid grid-cols-2 gap-3 py-2">
              {/* Left Bank */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
                  <span>左バンク (Left Bank: -45°)</span>
                  <span className="text-[11px] text-slate-400">#1, #3, #5, #7</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 2, 4, 6].map((cylIdx) => {
                    const cyl = telemetry.cylinders[cylIdx];
                    const isFiring = cyl && cyl.strokePhase.includes('燃焼');
                    return (
                      <div
                        key={cylIdx}
                        className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                          isFiring
                            ? 'bg-gradient-to-t from-orange-600 to-amber-400 border-amber-300 text-white font-black scale-105 shadow-lg shadow-orange-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] opacity-75">Cyl</span>
                        <span className="text-sm font-bold">{cylIdx + 1}</span>
                        <span className="text-[9px] font-mono mt-0.5">
                          {isFiring ? 'POWER' : cyl ? cyl.strokePhase.split(' ')[0] : 'Idle'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Bank */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
                  <span>右バンク (Right Bank: +45°)</span>
                  <span className="text-[11px] text-slate-400">#2, #4, #6, #8</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 5, 7].map((cylIdx) => {
                    const cyl = telemetry.cylinders[cylIdx];
                    const isFiring = cyl && cyl.strokePhase.includes('燃焼');
                    return (
                      <div
                        key={cylIdx}
                        className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                          isFiring
                            ? 'bg-gradient-to-t from-orange-600 to-amber-400 border-amber-300 text-white font-black scale-105 shadow-lg shadow-orange-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] opacity-75">Cyl</span>
                        <span className="text-sm font-bold">{cylIdx + 1}</span>
                        <span className="text-[9px] font-mono mt-0.5">
                          {isFiring ? 'POWER' : cyl ? cyl.strokePhase.split(' ')[0] : 'Idle'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Firing Order Flow */}
            <div className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400">点火順序 (Firing Order):</span>
              <span className="font-mono font-bold text-amber-300">
                {currentCrankType === 'flatplane'
                  ? '1 - 5 - 4 - 8 - 7 - 2 - 6 - 3 (左右完全交互)'
                  : '1 - 8 - 4 - 3 - 6 - 5 - 7 - 2 (名機クロスプレーン)'}
              </span>
            </div>
          </div>

          {/* 3 Legendary V8 Presets */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>V8 名機プリセット（1タップで即座に適用・鑑賞）</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {V8_PRESETS.map((preset) => {
                const isActive =
                  isV8Current &&
                  currentCrankType === preset.crankshaftType &&
                  currentConfig.boreMm === preset.boreMm;

                return (
                  <div
                    key={preset.id}
                    className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {preset.origin}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 適用中
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white">{preset.name}</h4>
                        <p className="text-[11px] text-amber-400/90 font-medium">{preset.tagline}</p>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">{preset.description}</p>

                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">排気量:</span>
                          <span className="text-slate-200 font-bold">{preset.displacement}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ボア×ストローク:</span>
                          <span className="text-slate-200">{preset.boreMm} × {preset.strokeMm} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">クランク形式:</span>
                          <span className="text-amber-300 font-bold">
                            {preset.crankshaftType === 'crossplane' ? '90° 十字 (Cross)' : '180° 平面 (Flat)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`apply-v8-${preset.id}-btn`}
                      onClick={() => {
                        onApplyConfig(
                          {
                            layout: 'v-type',
                            cylinderCount: 8,
                            vAngleDeg: preset.vAngleDeg,
                            crankshaftType: preset.crankshaftType,
                            boreMm: preset.boreMm,
                            strokeMm: preset.strokeMm,
                            compressionRatio: preset.compressionRatio,
                            rodLengthMm: preset.rodLengthMm,
                          },
                          'preset_v8_valley'
                        );
                        onClose();
                      }}
                      className="mt-4 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-950 flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>このV8を適用して鑑賞</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mechanical Deep Dive: Crossplane vs Flatplane */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>工学徹底解説: クロスプレーン vs フラットプレーンの違い</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-bold text-amber-300">90° 十字クランク (Cross-plane)</span>
                  <span className="text-[10px] text-slate-400">マッスル & AMG & レクサスF</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>• <strong>クランクピン角度:</strong> 4本のピンが90°ずつ直交し、正面から見ると「十」の字を描く。</li>
                  <li>• <strong>慣性力バランス:</strong> ピストンの1次慣性力偶力を大型カウンターウェイトで完全に相殺可能。極めて滑らか。</li>
                  <li>• <strong>排気脈動と音:</strong> 片バンク内で連続して点火（L-L, R-R）が起きるため、独特の不等間隔「ドロドロ」重低音を響かせる。</li>
                  <li>• <strong>用途:</strong> 高級サルーン、アメリカンマッスル、耐久トルク型レーサー。</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="font-bold text-rose-300">180° 平面クランク (Flat-plane)</span>
                  <span className="text-[10px] text-slate-400">フェラーリ & GT3 & シェルビーGT350</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>• <strong>クランクピン角度:</strong> ピンが0°-180°の同一平面上にあり、正面から見ると「一」の字に見える。</li>
                  <li>• <strong>軽量・高回転:</strong> 巨大なカウンターウェイトが不要でクランクが超軽量。9,000rpmまで一気に吹け上がる。</li>
                  <li>• <strong>排気脈動と音:</strong> 左右バンクが完全に交互に点火（R-L-R-L）。等間隔排気干渉による甲高い超高周波スクリーム。</li>
                  <li>• <strong>用途:</strong> スーパースポーツ、FIA GT3レーシングカー。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <span className="text-[11px] text-slate-400">
            3Dビュー内でカメラ操作HUDの「V8谷間視点」や「クランク軸」を選択すると、より詳細に機構を確認できます。
          </span>

          <button
            id="v8-modal-footer-close-btn"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
