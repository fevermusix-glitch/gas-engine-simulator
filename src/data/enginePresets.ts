import { EngineConfig } from '../types/engine';

export interface EnginePreset {
  id: string;
  name: string;
  shortName: string;
  category: 'supercar' | 'sports' | 'f1' | 'kei';
  categoryLabel: string;
  tagline: string;
  displacement: string;
  config: Partial<EngineConfig>;
  boreMm: number;
  strokeMm: number;
  boreStrokeRatio: number;
  cylinderCount: number;
  layout: 'inline' | 'v-type' | 'boxer';
  vAngleDeg: number;
  compressionRatio: number;
  rodLengthMm: number;
  blockMaterial: 'aluminum' | 'cast_iron';
  famousVehicles: string;
  wikipediaUrl?: string;
  description: string;
  highlightSpecs: string[];
}

export const ENGINE_PRESETS: EnginePreset[] = [
  {
    id: 'toyota_4ageu',
    name: 'トヨタ 4A-GEU型 1,587 cc 直列4気筒DOHC',
    shortName: 'トヨタ 4A-GEU',
    category: 'sports',
    categoryLabel: 'AE86名機 直4 DOHC',
    tagline: 'ハチロク(AE86)やAW11 MR2に搭載された伝説の軽量・高回転型直4 DOHC 16バルブ',
    displacement: '1,587 cc (1.6L)',
    boreMm: 81.0,
    strokeMm: 77.0,
    boreStrokeRatio: 1.05,
    cylinderCount: 4,
    layout: 'inline',
    vAngleDeg: 0,
    compressionRatio: 9.4,
    rodLengthMm: 122,
    blockMaterial: 'cast_iron',
    famousVehicles: 'スプリンタートレノ / カローラレビン (AE86), MR2 (AW11), セリカ 1600GT (AA63)',
    description:
      'トヨタとヤマハ発動機が共同開発した1.6L直列4気筒DOHC 16バルブエンジン。ボア81.0mm×ストローク77.0mmのショートストローク設計とT-VIS（可変吸気）により、低速トルクと7,600rpmまで突き抜ける高回転フィールを両立。「ハチロク」の愛称で親しまれるAE86トレノ/レビンに搭載され、世界中にファンを持つ不朽の名機です。',
    highlightSpecs: ['ボア: 81.0mm', 'ストローク: 77.0mm (ショート)', '直列4気筒 DOHC 16V', '排気量: 1,587cc', '鋳鉄ブロック'],
    config: {
      layout: 'inline',
      cylinderCount: 4,
      vAngleDeg: 0,
      boreMm: 81.0,
      strokeMm: 77.0,
      compressionRatio: 9.4,
      rodLengthMm: 122,
      blockMaterial: 'cast_iron',
    },
  },
  {
    id: 'nissan_rb26dett',
    name: '日産 RB26DETT型 2,568 cc 直列6気筒',
    shortName: '日産 RB26DETT',
    category: 'sports',
    categoryLabel: 'GT-R伝説 直6 ツインターボ',
    tagline: '全日本ツーリングカー選手権(JTC)29戦29連勝無敗の神話を築いたGT-Rの心臓部',
    displacement: '2,568 cc (2.6L)',
    boreMm: 86.0,
    strokeMm: 73.7,
    boreStrokeRatio: 1.17,
    cylinderCount: 6,
    layout: 'inline',
    vAngleDeg: 0,
    compressionRatio: 8.5,
    rodLengthMm: 121.5,
    blockMaterial: 'cast_iron',
    famousVehicles: 'スカイラインGT-R (BNR32 / BCNR33 / BNR34), ステージア 260RS オーテック',
    description:
      '全日本ツーリングカー選手権(JTC)グループAを完全に支配するために専用開発された直列6気筒2.6L DOHC 24バルブツインターボエンジン。過給係数1.7に合致させた2,568cc（ボア86.0mm×ストローク73.7mmの高回転ショートストローク設計）、超高剛性鋳鉄ブロック、6連独立スロットルを備え、最高峰の直6サウンドと驚異的なチューニング耐久性を誇ります。',
    highlightSpecs: ['ボア: 86.0mm', 'ストローク: 73.7mm (ショート)', '直列6気筒 DOHC 24V', '排気量: 2,568cc', '高剛性鋳鉄ブロック'],
    config: {
      layout: 'inline',
      cylinderCount: 6,
      vAngleDeg: 0,
      boreMm: 86.0,
      strokeMm: 73.7,
      compressionRatio: 8.5,
      rodLengthMm: 121.5,
      blockMaterial: 'cast_iron',
    },
  },
  {
    id: 'subaru_ej20',
    name: 'スバル EJ20型 2,000 cc 水平対向4気筒ターボ',
    shortName: 'スバル EJ20 Spec.C',
    category: 'sports',
    categoryLabel: 'WRC黄金期 水平対向4気筒',
    tagline: '280 PS / 6,400 rpm、43.0 kg-m / 4,400 rpm（インプレッサセダン WRX STI Spec C）',
    displacement: '1,994 cc (2.0L)',
    boreMm: 92.0,
    strokeMm: 75.0,
    boreStrokeRatio: 1.23,
    cylinderCount: 4,
    layout: 'boxer',
    vAngleDeg: 180,
    compressionRatio: 8.0,
    rodLengthMm: 130.5,
    blockMaterial: 'aluminum',
    famousVehicles: 'インプレッサセダン WRX STI Spec C (GDB / GRB / GVB / VAB), レガシィ RS (BC5)',
    description:
      'スバルのモータースポーツ黄金期を支えた2.0L水平対向4気筒DOHC 16バルブツインスクロールターボエンジン。ボア92.0mm×ストローク75.0mmのビッグボア・ショートストローク設計により、最高出力280 PS / 6,400 rpm、最大トルク43.0 kg-m (422 N·m) / 4,400 rpmを発揮。低重心なシンメトリカルAWDと等長等爆エキゾーストによる研ぎ澄まされたレスポンスで、WRCマニュファクチャラーズ3連覇をはじめ幾多の勝利を刻んだ水平対向（ボクサー）の金字塔です。',
    highlightSpecs: ['ボア: 92.0mm', 'ストローク: 75.0mm (ビッグボア)', '水平対向4気筒 (Boxer-4)', '280 PS / 43.0 kg-m', '高剛性アルミブロック'],
    config: {
      layout: 'boxer',
      cylinderCount: 4,
      vAngleDeg: 180,
      boreMm: 92.0,
      strokeMm: 75.0,
      compressionRatio: 8.0,
      rodLengthMm: 130.5,
      blockMaterial: 'aluminum',
    },
  },
  {
    id: 'm120_73',
    name: 'メルセデス・ベンツ M120 7.3L V12',
    shortName: 'MB M120 7.3L',
    category: 'supercar',
    categoryLabel: 'スーパーカー V12',
    tagline: 'パガーニ・ゾンダを支えたAMG至高の自然吸気7.3L V12',
    displacement: '7,291 cc (7.3L)',
    boreMm: 91.5,
    strokeMm: 92.4,
    boreStrokeRatio: 0.99,
    cylinderCount: 12,
    layout: 'v-type',
    vAngleDeg: 60,
    compressionRatio: 10.5,
    rodLengthMm: 145,
    blockMaterial: 'aluminum',
    famousVehicles: 'パガーニ・ゾンダ (Zonda S 7.3 / F / Cinque), メルセデス SL73 AMG (R129)',
    description:
      'メルセデス・ベンツとAMGが誇る最高峰V12エンジン。AMGにより7.3Lまでボアアップ（ボア91.5mm×ストローク92.4mm）され、パガーニ・ゾンダに搭載。大排気量自然吸気の圧倒的トルクと、官能的なシンフォニックサウンドを奏でます。',
    highlightSpecs: ['ボア: 91.5mm', 'ストローク: 92.4mm', '60°バンク V12', '排気量: 7,291cc'],
    config: {
      layout: 'v-type',
      cylinderCount: 12,
      vAngleDeg: 60,
      boreMm: 91.5,
      strokeMm: 92.4,
      compressionRatio: 10.5,
      rodLengthMm: 145,
      blockMaterial: 'aluminum',
    },
  },
  {
    id: 'honda_ra121e',
    name: 'ホンダ RA121E 3,497cc V12',
    shortName: 'ホンダ RA121E F1',
    category: 'f1',
    categoryLabel: '1991年 F1世界王者',
    tagline: 'セナが駆り世界を制した伝説の14,000rpm超ショートストロークF1 V12',
    displacement: '3,497 cc (3.5L)',
    boreMm: 86.5,
    strokeMm: 49.6,
    boreStrokeRatio: 1.74,
    cylinderCount: 12,
    layout: 'v-type',
    vAngleDeg: 60,
    compressionRatio: 13.0,
    rodLengthMm: 110,
    blockMaterial: 'aluminum',
    famousVehicles: 'マクラーレン・ホンダ MP4/6 (アイルトン・セナ / ゲルハルト・ベルガー 1991年)',
    description:
      '1991年のF1世界選手権でアイルトン・セナがドライバーズおよびコンストラクターズのダブルタイトルを獲得した伝説のNA 3.5L V12。ボア86.5mmに対しストロークわずか49.6mmという極限の超ショートストローク設計により、14,000rpm超の超高回転と甲高い「ホンダミュージック」を響かせました。',
    highlightSpecs: ['ボア: 86.5mm', 'ストローク: 49.6mm (極限ショート)', '60°バンク V12', '排気量: 3,497cc'],
    config: {
      layout: 'v-type',
      cylinderCount: 12,
      vAngleDeg: 60,
      boreMm: 86.5,
      strokeMm: 49.6,
      compressionRatio: 13.0,
      rodLengthMm: 110,
      blockMaterial: 'aluminum',
    },
  },
  {
    id: 'kei_660_i3',
    name: '軽自動車 660cc 直列3気筒',
    shortName: '軽660cc 直3',
    category: 'kei',
    categoryLabel: '日本軽規格 高効率直3',
    tagline: '日本を支える高効率ロングストローク直列3気筒 (スズキR06A / ダイハツKF規格)',
    displacement: '658 cc (0.66L)',
    boreMm: 64.0,
    strokeMm: 68.2,
    boreStrokeRatio: 0.94,
    cylinderCount: 3,
    layout: 'inline',
    vAngleDeg: 0,
    compressionRatio: 11.5,
    rodLengthMm: 105,
    blockMaterial: 'aluminum',
    famousVehicles: 'スズキ アルト / ハスラー / ジムニー, ダイハツ タント / ムーヴ, ホンダ N-BOX',
    description:
      '日本の軽自動車規格（660cc以下）に最適化された現代の代表的直列3気筒エンジン（スズキR06A/ダイハツKF等）。ボア64.0mm×ストローク68.2mmのロングストローク設計により、街乗り実用域での豊かなトルク、低燃費、軽量コンパクト性を高次元で両立しています。',
    highlightSpecs: ['ボア: 64.0mm', 'ストローク: 68.2mm (ロング)', '直列3気筒 (I3)', '排気量: 658cc'],
    config: {
      layout: 'inline',
      cylinderCount: 3,
      vAngleDeg: 0,
      boreMm: 64.0,
      strokeMm: 68.2,
      compressionRatio: 11.5,
      rodLengthMm: 105,
      blockMaterial: 'aluminum',
    },
  },
];
