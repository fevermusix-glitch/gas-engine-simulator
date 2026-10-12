import React, { useState } from 'react';
import { EngineTelemetry, EngineConfig } from '../types/engine';
import {
  Activity,
  Gauge,
  Flame,
  Zap,
  TrendingUp,
  Thermometer,
  RotateCw,
  Waves,
  ExternalLink,
} from 'lucide-react';
import { LiveWaveformGraph } from './LiveWaveformGraph';

interface PerformanceGraphsProps {
  telemetry: EngineTelemetry;
  config: EngineConfig;
  isFloatingMode?: boolean;
  onOpenFloating?: () => void;
  onCloseFloating?: () => void;
}

export const PerformanceGraphs: React.FC<PerformanceGraphsProps> = ({
  telemetry,
  config,
  isFloatingMode = false,
  onOpenFloating,
  onCloseFloating,
}) => {
  const [activeGraphTab, setActiveGraphTab] = useState<'pv' | 'power_curve' | 'phase' | 'live_wave'>('live_wave');

  const {
    rpm,
    torqueNm,
    powerKw,
    powerPs,
    thermalEfficiencyPct,
    indicatedMeanEffPressureBar,
    airFuelRatio,
    fuelFlowLitersPerHour,
    exhaustTempCelsius,
    coolantTempCelsius,
    displacementCc,
    cylinders,
    pvData,
  } = telemetry;

  // PV Diagram calculation for SVG coordinate scaling
  const maxVol = Math.max(...pvData.map((d) => d.volumeCc), 100);
  const minVol = Math.min(...pvData.map((d) => d.volumeCc), 10);
  const maxP = Math.max(...pvData.map((d) => d.pressureBar), 10);

  const svgW = 320;
  const svgH = 170;
  const padL = 36;
  const padR = 15;
  const padT = 15;
  const padB = 25;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toSvgX = (v: number) => padL + ((v - minVol) / (maxVol - minVol)) * plotW;
  const toSvgY = (p: number) => padT + plotH - (p / maxP) * plotH;

  const pvPathString = pvData.length > 0
    ? pvData.reduce((acc, pt, idx) => {
        const x = toSvgX(pt.volumeCc);
        const y = toSvgY(pt.pressureBar);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '') + ' Z'
    : '';

  // Current operating point on PV diagram (Cylinder #0)
  const cyl0 = cylinders[0];
  const cyl0X = cyl0 ? toSvgX(pvData[0]?.volumeCc || minVol) : padL;
  const cyl0Y = cyl0 ? toSvgY(cyl0.pressureBar) : padT + plotH;

  return (
    <div className={`flex flex-col gap-2.5 w-full bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md text-slate-100 shadow-xl ${
      isFloatingMode ? 'p-2.5 bg-transparent border-0 shadow-none' : 'p-3.5'
    }`}>
      {/* Top Telemetry Gauges Grid & Secondary Strip (Hidden in Floating Pop-up Window) */}
      {!isFloatingMode && (
        <>
          {/* Top Telemetry Digital Gauges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* RPM */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-sky-950/70 border border-sky-800/40 flex items-center justify-center text-sky-400">
                <RotateCw className={`w-4 h-4 ${rpm > 500 ? 'animate-spin' : ''}`} style={{ animationDuration: `${Math.max(0.2, 6000 / Math.max(rpm, 100))}s` }} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">エンジン回転数</div>
                <div className="text-base font-bold font-mono text-sky-300">
                  {rpm} <span className="text-xs font-normal text-slate-400">rpm</span>
                </div>
              </div>
            </div>

            {/* Output Power */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-800/40 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">最高出力</div>
                <div className="text-base font-bold font-mono text-amber-300">
                  {powerPs} <span className="text-xs font-normal text-slate-400">PS ({powerKw}kW)</span>
                </div>
              </div>
            </div>

            {/* Torque */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">軸トルク</div>
                <div className="text-base font-bold font-mono text-emerald-300">
                  {torqueNm} <span className="text-xs font-normal text-slate-400">Nm</span>
                </div>
              </div>
            </div>

            {/* Thermal Efficiency */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-8 h-8 rounded-lg bg-rose-950/70 border border-rose-800/40 flex items-center justify-center text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">熱効率 (ηth)</div>
                <div className="text-base font-bold font-mono text-rose-300">
                  {thermalEfficiencyPct} <span className="text-xs font-normal text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Telemetry Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[11px] bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
            <div>
              <span className="text-slate-400 block">排気量</span>
              <span className="font-semibold text-slate-200">{displacementCc} cc</span>
            </div>
            <div>
              <span className="text-slate-400 block">図示平均有効圧 (IMEP)</span>
              <span className="font-semibold text-slate-200">{indicatedMeanEffPressureBar} bar</span>
            </div>
            <div>
              <span className="text-slate-400 block">空燃比 (A/F)</span>
              <span className="font-semibold text-sky-400">{airFuelRatio} : 1</span>
            </div>
            <div>
              <span className="text-slate-400 block">燃料消費量</span>
              <span className="font-semibold text-slate-200">{fuelFlowLitersPerHour} L/h</span>
            </div>
            <div>
              <span className="text-slate-400 block">排気温度</span>
              <span className="font-semibold text-amber-400">{exhaustTempCelsius} °C</span>
            </div>
            <div>
              <span className="text-slate-400 block">冷却水温度</span>
              <span className="font-semibold text-cyan-400">{coolantTempCelsius} °C</span>
            </div>
          </div>
        </>
      )}

      {/* Graph Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            id="tab-graph-live"
            onClick={() => setActiveGraphTab('live_wave')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeGraphTab === 'live_wave'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            <span>リアルタイム脈動波形 (Oscilloscope)</span>
          </button>
          <button
            id="tab-graph-pv"
            onClick={() => setActiveGraphTab('pv')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeGraphTab === 'pv'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>P-V 指圧線図</span>
          </button>
          <button
            id="tab-graph-power"
            onClick={() => setActiveGraphTab('power_curve')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeGraphTab === 'power_curve'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>出力・トルク曲線</span>
          </button>
          <button
            id="tab-graph-phase"
            onClick={() => setActiveGraphTab('phase')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeGraphTab === 'phase'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>気筒別4ストローク位相</span>
          </button>
        </div>

        {/* Floating Popup Trigger Button */}
        {!isFloatingMode && onOpenFloating && (
          <button
            id="btn-open-floating-graph"
            type="button"
            onClick={onOpenFloating}
            title="グラフを別ウィンドウにポップアップ表示 (ドラッグ移動・リサイズ可能、下部メニューを閉じても表示)"
            className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 hover:text-sky-100 text-xs font-medium transition flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ポップアップ別窓表示</span>
          </button>
        )}
      </div>

      {/* Tab 1: P-V Indicator Diagram */}
      {activeGraphTab === 'pv' && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-2/3 relative flex justify-center bg-slate-950/80 rounded-xl p-2 border border-slate-800">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[360px] h-auto">
              {/* Axes and Grid */}
              <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#334155" strokeWidth="1.5" />
              <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1.5" />
              <text x={padL - 4} y={padT + 8} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {Math.round(maxP)}b
              </text>
              <text x={padL - 4} y={padT + plotH} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                0
              </text>
              <text x={padL} y={padT + plotH + 16} textAnchor="start" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                TDC ({Math.round(minVol)}cc)
              </text>
              <text x={padL + plotW} y={padT + plotH + 16} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                BDC ({Math.round(maxVol)}cc)
              </text>

              {/* Otto Cycle Work Loop Area */}
              <path
                d={pvPathString}
                fill="rgba(14, 165, 233, 0.15)"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Operating Point Indicator (Cylinder #1) */}
              <circle cx={cyl0X} cy={cyl0Y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="w-full sm:w-1/3 text-xs space-y-1.5 text-slate-300">
            <div className="font-bold text-sky-400 border-b border-slate-800 pb-1">
              熱力学サイクル解析
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">圧縮比 (ε):</span>
              <span className="font-mono text-slate-200">{config.compressionRatio}:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">燃焼最高筒内圧:</span>
              <span className="font-mono text-rose-400">{Math.round(maxP)} bar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">サイクル囲み仕事 (W):</span>
              <span className="font-mono text-emerald-400">
                {Math.round(indicatedMeanEffPressureBar * (displacementCc / config.cylinderCount) * 0.1)} J
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              💡 スロットルを開くほど混合気充填効率が向上し、P-V線図の面積（1サイクルあたりの正味仕事）が拡大します。
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full RPM Power & Torque Curve */}
      {activeGraphTab === 'power_curve' && (
        <div className="flex flex-col gap-2.5 bg-slate-950/90 rounded-2xl p-3.5 border border-slate-800/80">
          <div className="flex items-center gap-12 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-500/50"></span>
              最高出力 (PS)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50"></span>
              最大トルク (Nm)
            </span>
          </div>

          {/* SVG Power Curve with Current Operating Vertical Line */}
          <div className="relative w-full h-36">
            <svg viewBox="0 0 400 120" className="w-full h-full">
              {/* Reference Grid lines */}
              <line x1="40" y1="15" x2="380" y2="15" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="55" x2="380" y2="55" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="95" x2="380" y2="95" stroke="#334155" />

              {/* Power Curve (Rises up to ~6500 rpm) */}
              <path
                d="M 40,95 Q 120,80 200,55 T 320,22 Q 360,32 380,50"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              {/* Torque Curve (Peaks at mid RPM ~4500 rpm) */}
              <path
                d="M 40,75 Q 120,40 220,32 Q 300,38 380,70"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Current RPM Indicator Line */}
              {(() => {
                const rpmRatio = Math.max(0, Math.min(1, rpm / 8000));
                const currentX = 40 + rpmRatio * 340;
                return (
                  <g>
                    <line x1={currentX} y1="10" x2={currentX} y2="100" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
                    <circle cx={currentX} cy="55" r="4" fill="#38bdf8" />
                  </g>
                );
              })()}

              {/* RPM labels */}
              <text x="40" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">1000</text>
              <text x="140" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">3000</text>
              <text x="240" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">5000</text>
              <text x="340" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">7000</text>
              <text x="380" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">8000</text>
            </svg>
          </div>
        </div>
      )}

      {/* Tab 3: 4-Stroke Cylinder Phase Tracker */}
      {activeGraphTab === 'phase' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cylinders.map((cyl) => {
              const phaseColors = {
                '吸気 (Intake)': 'bg-blue-900/60 border-blue-500 text-blue-300',
                '圧縮 (Compression)': 'bg-amber-900/60 border-amber-500 text-amber-300',
                '燃焼 (Power)': 'bg-rose-900/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-950',
                '排気 (Exhaust)': 'bg-orange-900/60 border-orange-500 text-orange-300',
              };

              return (
                <div
                  key={cyl.index}
                  className={`p-2 rounded-xl border transition-all ${phaseColors[cyl.strokePhase]}`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold"># {cyl.index + 1} 気筒 {cyl.bank !== 'center' ? `(${cyl.bank === 'left' ? 'L' : 'R'})` : ''}</span>
                    <span className="text-[10px] font-mono">{Math.round(cyl.angleDeg)}°</span>
                  </div>
                  <div className="text-sm font-semibold mt-1 flex items-center gap-1">
                    {cyl.isIgniting && <Flame className="w-4 h-4 text-amber-300 animate-pulse" />}
                    <span>{cyl.strokePhase}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-1 text-slate-300 font-mono">
                    <span>{cyl.pressureBar} bar</span>
                    <span>{cyl.tempCelsius} °C</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Realtime Waveform Oscilloscope */}
      {activeGraphTab === 'live_wave' && (
        <LiveWaveformGraph telemetry={telemetry} config={config} />
      )}
    </div>
  );
};
