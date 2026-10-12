import { ExplodedEasingType } from '../types/engine';

/**
 * Mathematical easing functions for smooth mechanical transitions during exploded-view animations.
 * Maps progress t (0.0 to 1.0) into eased separation displacement with physical velocity curves.
 */
export const EXPLODED_EASING_FUNCTIONS: Record<ExplodedEasingType, (t: number) => number> = {
  // Cubic S-curve: Balanced acceleration and gentle deceleration (Optimal for complex mechanisms)
  cubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Quartic Out: Swift initial separation followed by a feather-light landing
  quart: (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  },

  // Quintic S-curve: High-inertia mechanical expansion with profound smoothness
  quint: (t: number): number => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  },

  // Elastic: High-performance mechanical rebound (slight overshoot with damped settling)
  elastic: (t: number): number => {
    if (t === 0) return 0;
    if (t >= 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Linear: 1:1 direct progression without acceleration
  linear: (t: number): number => t,
};

export const EASING_OPTIONS: { id: ExplodedEasingType; label: string; shortLabel: string; desc: string }[] = [
  {
    id: 'cubic',
    label: '滑らかなS字加減速 (Cubic S-Curve)',
    shortLabel: 'Cubic',
    desc: '機械部品の自然な展開と収束を実現する業界標準のイージングカーブ',
  },
  {
    id: 'quart',
    label: 'クイック分離＆ソフト着地 (Quartic Out)',
    shortLabel: 'Quart Out',
    desc: '操作直後に素早く部品が離れ、終端付近で優しく停止する軽快な遷移',
  },
  {
    id: 'quint',
    label: '重厚感S字 (Quintic Extreme)',
    shortLabel: 'Quintic',
    desc: '重量級エンジンブロックやフライホイールの慣性を感じさせるドラマチックな加減速',
  },
  {
    id: 'elastic',
    label: 'メカニカル反動 (Elastic Damped)',
    shortLabel: 'Elastic',
    desc: '完全展開時に微細なダンピング余韻を伴い、機械の躍動感を演出',
  },
  {
    id: 'linear',
    label: '直線的等速 (Linear)',
    shortLabel: 'Linear',
    desc: 'スライダー位置と完全一致する等速運動',
  },
];
