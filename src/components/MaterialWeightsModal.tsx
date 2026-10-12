import React from 'react';
import { EngineConfig } from '../types/engine';
import { calculateMaterialProperties } from '../physics/materialData';
import { Layers, ShieldCheck, Scale, Cpu, X } from 'lucide-react';

interface MaterialWeightsModalProps {
  config: EngineConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialWeightsModal: React.FC<MaterialWeightsModalProps> = ({
  config,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const {
    properties,
    totalWeightKg,
    reciprocatingMassKg,
    rotatingMassKg,
    stationaryMassKg,
  } = calculateMaterialProperties(config);

  const recipPercent = ((reciprocatingMassKg / totalWeightKg) * 100).toFixed(1);
  const rotPercent = ((rotatingMassKg / totalWeightKg) * 100).toFixed(1);
  const statPercent = ((stationaryMassKg / totalWeightKg) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                エンジン構成部品 材質プロパティ & 重量分布解析
              </h2>
              <p className="text-xs text-slate-400">
                {config.layout === 'inline'
                  ? `直列 ${config.cylinderCount} 気筒`
                  : config.layout === 'v-type'
                  ? `V型 ${config.cylinderCount} 気筒 (${config.vAngleDeg}°)`
                  : `水平対向 ${config.cylinderCount} 気筒 (Boxer)`} / ボア {config.boreMm}mm × ストローク {config.strokeMm}mm
              </p>
            </div>
          </div>
          <button
            id="close-material-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mass Summary Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-b border-slate-800 bg-slate-950/30">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400">エンジン総乾燥重量</div>
            <div className="text-xl font-bold font-mono text-sky-400">{totalWeightKg} <span className="text-xs text-slate-400 font-normal">kg</span></div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-900/30">
            <div className="text-[11px] text-amber-400/80">往復運動質量 (ピストン等)</div>
            <div className="text-xl font-bold font-mono text-amber-400">{reciprocatingMassKg} <span className="text-xs text-slate-400 font-normal">kg ({recipPercent}%)</span></div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/30">
            <div className="text-[11px] text-emerald-400/80">回転運動質量 (クランク等)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{rotatingMassKg} <span className="text-xs text-slate-400 font-normal">kg ({rotPercent}%)</span></div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-indigo-900/30">
            <div className="text-[11px] text-indigo-400/80">静止構造質量 (ブロック等)</div>
            <div className="text-xl font-bold font-mono text-indigo-400">{stationaryMassKg} <span className="text-xs text-slate-400 font-normal">kg ({statPercent}%)</span></div>
          </div>
        </div>

        {/* Visual Mass Distribution Ratio Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex flex-col gap-1 text-xs">
          <span className="text-slate-400 font-medium">質量比率分布 (Mass Distribution Ratio)</span>
          <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
            <div
              style={{ width: `${recipPercent}%` }}
              className="h-full bg-amber-500 hover:opacity-90 transition-all"
              title={`往復運動: ${recipPercent}%`}
            />
            <div
              style={{ width: `${rotPercent}%` }}
              className="h-full bg-emerald-500 hover:opacity-90 transition-all"
              title={`回転運動: ${rotPercent}%`}
            />
            <div
              style={{ width: `${statPercent}%` }}
              className="h-full bg-indigo-500 hover:opacity-90 transition-all"
              title={`静止構造: ${statPercent}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span className="text-amber-400">■ 往復運動 {recipPercent}%</span>
            <span className="text-emerald-400">■ 回転運動 {rotPercent}%</span>
            <span className="text-indigo-400">■ 構造部品 {statPercent}%</span>
          </div>
        </div>

        {/* Detailed Material Properties Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">構成部品</th>
                  <th className="py-2.5 px-3">採用材料 & 規格</th>
                  <th className="py-2.5 px-2 text-right">密度 (g/cm³)</th>
                  <th className="py-2.5 px-2 text-right">降伏強度 (MPa)</th>
                  <th className="py-2.5 px-2 text-right">熱伝導率 (W/mK)</th>
                  <th className="py-2.5 px-2 text-right">耐熱温度</th>
                  <th className="py-2.5 px-3 text-right">単体重量</th>
                  <th className="py-2.5 px-3 text-right">合計重量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {properties.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2 px-3 font-semibold text-sky-300">
                      {item.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-mono">{item.materialName}</td>
                    <td className="py-2 px-2 text-right font-mono">{item.densityGPerCm3}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-400">{item.yieldStrengthMpa}</td>
                    <td className="py-2 px-2 text-right font-mono text-amber-300">{item.thermalConductivityWPerMk}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-400">{item.maxOperatingTempC} °C</td>
                    <td className="py-2 px-3 text-right font-mono">{item.unitWeightKg} kg</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">{item.totalWeightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
