export type LightRotationPlane = 'horizontal' | 'vertical' | 'tilt_pos45' | 'tilt_neg45';

export type LightColorShiftMode =
  | 'none'
  | 'rainbow'
  | 'cyber_pulse'
  | 'sunset_glow'
  | 'racing_shift'
  | 'deep_ocean';

export type ColorShiftMode = LightColorShiftMode;

export interface StageLightingOptions {
  enabled: boolean;
  plane: LightRotationPlane;
  autoRotate: boolean;
  rotationSpeed: number; // 0.1 to 3.0 (default 1.0)
  manualAngleDeg: number; // 0 to 360
  distance: number; // 2.0 to 16.0 meters (default 6.5)
  intensity: number; // 0.0 to 8.0 (default 3.0)
  color: string; // HEX color code e.g. '#ffffff'
  colorShiftMode: LightColorShiftMode;
  colorShiftSpeed: number; // 0.2 to 3.0 (default 1.0)
  smokeEnabled: boolean; // Stage smoke machine toggle
  smokeDensity: number; // 0.005 to 0.08 (default 0.032)
  multiLightEnabled: boolean; // Multiple light sources (key + rim + fill)
  showLightGizmo: boolean; // Visual light position beacon & beam cone
}

export interface LightingDistancePreset {
  id: string;
  name: string;
  distance: number;
  intensity: number;
  description: string;
}

export interface LightingColorPreset {
  id: string;
  name: string;
  color: string;
  category: 'natural' | 'neon' | 'racing';
}

export interface ColorShiftPreset {
  id: LightColorShiftMode;
  name: string;
  description: string;
  previewColors: string[];
}

export interface MasterLightingPreset {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description?: string;
  options: Partial<StageLightingOptions>;
}

export const LIGHT_ROTATION_PLANES: { id: LightRotationPlane; name: string; shortName: string; desc: string }[] = [
  {
    id: 'horizontal',
    name: '水平旋回 (Horizontal 360°)',
    shortName: '水平',
    desc: 'クランクシャフト周囲を水平XZ平面上で360度ダイナミックに旋回',
  },
  {
    id: 'vertical',
    name: '垂直旋回 (Vertical 360°)',
    shortName: '垂直',
    desc: 'シリンダー頂点からオイルパン下部までエンジン正面を縦に360度旋回',
  },
  {
    id: 'tilt_pos45',
    name: '傾斜 +45° 旋回 (+45° Orbit)',
    shortName: '+45°',
    desc: '斜め上空45度からピストンとクランクピンを美しく照らす傾斜軌道',
  },
  {
    id: 'tilt_neg45',
    name: '傾斜 -45° 旋回 (-45° Orbit)',
    shortName: '-45°',
    desc: '対角線上の-45度傾斜軌道でエッジと曲面の反射を極大化',
  },
];

// 見栄えがするライト距離＆ライト強度のプリセット
export const LIGHT_DISTANCE_PRESETS: LightingDistancePreset[] = [
  {
    id: 'macro_close',
    name: 'マクロ接写・高輝度',
    distance: 3.2,
    intensity: 4.8,
    description: '近距離から強力なスポット光を当て、金属の切削痕やピストンリングの質感を鮮烈に強調',
  },
  {
    id: 'studio_standard',
    name: 'スタジオ標準・適正光',
    distance: 6.2,
    intensity: 3.0,
    description: '陰影と反射が最も美しく調和する自動車デザインスタジオ標準のライト距離と光量',
  },
  {
    id: 'dramatic_shadow',
    name: 'ドラマチック・陰影強調',
    distance: 9.5,
    intensity: 5.5,
    description: '離れた位置から鋭い指向性ライトを照射し、深い影と強いハイライトラインを生む',
  },
  {
    id: 'arena_wide',
    name: '広角アリーナ・全体照光',
    distance: 13.5,
    intensity: 3.2,
    description: '遠距離から包み込むように均一に照らし、エンジン全貌をクリアに観察可能',
  },
];

export interface LightingIntensityPreset {
  id: string;
  name: string;
  intensity: number;
  description: string;
}

export const LIGHT_INTENSITY_PRESETS: LightingIntensityPreset[] = [
  { id: 'subtle_mood', name: '微光ムード (1.5)', intensity: 1.5, description: '控えめな陰影' },
  { id: 'standard_spot', name: '標準スポット (3.0)', intensity: 3.0, description: '標準的な明るさ' },
  { id: 'high_specular', name: '高輝度鏡面 (5.2)', intensity: 5.2, description: '鮮烈な金属反射' },
  { id: 'blazing_beam', name: '白熱ハイライト (7.5)', intensity: 7.5, description: '極限のスポット照光' },
];

// 見栄えがするプリセット色
export const LIGHT_COLOR_PRESETS: LightingColorPreset[] = [
  { id: 'pure_white', name: 'ピュアホワイト (5500K)', color: '#ffffff', category: 'natural' },
  { id: 'warm_halogen', name: 'ウォームハロゲン (3200K)', color: '#ffd28f', category: 'natural' },
  { id: 'race_amber', name: 'レースアンバー (Gold)', color: '#ffaa00', category: 'racing' },
  { id: 'neon_cyan', name: 'ネオンシアン (Cyan)', color: '#00f0ff', category: 'neon' },
  { id: 'laser_magenta', name: 'レーザーマゼンタ (Pink)', color: '#ff007f', category: 'neon' },
  { id: 'emerald_green', name: 'アシッドエメラルド (Green)', color: '#00ff77', category: 'neon' },
  { id: 'electric_blue', name: 'エレクトリックブルー (Blue)', color: '#1a75ff', category: 'racing' },
  { id: 'racing_red', name: 'レーシングレッド (Red)', color: '#ff1744', category: 'racing' },
  { id: 'deep_violet', name: 'ディープバイオレット (UV)', color: '#a855f7', category: 'neon' },
];

// 舞台照明の時間色変化プリセット
export const COLOR_SHIFT_PRESETS: ColorShiftPreset[] = [
  {
    id: 'none',
    name: '固定色 (Static)',
    description: '指定したカラーを維持します',
    previewColors: ['#ffffff'],
  },
  {
    id: 'rainbow',
    name: 'レインボーサイクル (Rainbow)',
    description: '全色相（360°）を滑らかにループしてライブステージのように幻想的に変化',
    previewColors: ['#ff0055', '#ffaa00', '#00ff88', '#00e5ff', '#9900ff'],
  },
  {
    id: 'cyber_pulse',
    name: 'サイバーパルス (Cyberpunk)',
    description: 'ネオンシアンとネオンマゼンタが波打つように交互にクロスフェード',
    previewColors: ['#00f0ff', '#8b00ff', '#ff007f'],
  },
  {
    id: 'sunset_glow',
    name: 'サンセットグロー (Sunset)',
    description: '黄金色の夕暮れアンバーから深紅のトワイライトへとドラマチックに移ろう',
    previewColors: ['#ffaa00', '#ff5500', '#d6004b'],
  },
  {
    id: 'racing_shift',
    name: 'レーシングシフト (Telemetry)',
    description: 'ピュアホワイトからエメラルド、そして高回転レッドゾーンへと脈動',
    previewColors: ['#ffffff', '#00ff88', '#ff1744'],
  },
  {
    id: 'deep_ocean',
    name: 'ディープオーシャン (Ocean)',
    description: '深海のエレクトリックブルーと透明感あふれるターコイズアクアの揺らめき',
    previewColors: ['#0033cc', '#0088ff', '#00ffcc'],
  },
];

export const COLOR_SHIFT_MODES = COLOR_SHIFT_PRESETS;

// 一括変更マスタープリセット（見栄え抜群の総合演出）
export const MASTER_LIGHTING_PRESETS: MasterLightingPreset[] = [
  {
    id: 'stage_concert',
    name: 'ライブステージ・スポット',
    icon: '🎭',
    tagline: 'レインボーカラー変化とスモークに浮かぶムービングライトの熱気',
    description: 'レインボーカラー変化とスモークに浮かぶムービングライトの熱気',
    options: {
      enabled: true,
      plane: 'tilt_pos45',
      autoRotate: true,
      rotationSpeed: 0.9,
      distance: 5.6,
      intensity: 3.8,
      color: '#ff007f',
      colorShiftMode: 'rainbow',
      colorShiftSpeed: 0.8,
      smokeEnabled: true,
      smokeDensity: 0.038,
      multiLightEnabled: true,
      showLightGizmo: true,
    },
  },
  {
    id: 'cyberpunk_arena',
    name: 'サイバーパンク・アリーナ',
    icon: '🌌',
    tagline: 'シアン＆マゼンタの波状ライティングと空間を包むネオンスモーク',
    description: 'シアン＆マゼンタの波状ライティングと空間を包むネオンスモーク',
    options: {
      enabled: true,
      plane: 'horizontal',
      autoRotate: true,
      rotationSpeed: 1.2,
      distance: 4.8,
      intensity: 4.2,
      color: '#00f0ff',
      colorShiftMode: 'cyber_pulse',
      colorShiftSpeed: 1.1,
      smokeEnabled: true,
      smokeDensity: 0.042,
      multiLightEnabled: true,
      showLightGizmo: true,
    },
  },
  {
    id: 'racing_night_pit',
    name: 'ナイトピット・レーサー',
    icon: '🏎️',
    tagline: 'ル・マンの夜間ピットを思わせる鋭いアンバー光とハイコントラスト陰影',
    description: 'ル・マンの夜間ピットを思わせる鋭いアンバー光とハイコントラスト陰影',
    options: {
      enabled: true,
      plane: 'horizontal',
      autoRotate: true,
      rotationSpeed: 0.6,
      distance: 7.5,
      intensity: 3.6,
      color: '#ffaa00',
      colorShiftMode: 'none',
      colorShiftSpeed: 1.0,
      smokeEnabled: false,
      smokeDensity: 0.02,
      multiLightEnabled: true,
      showLightGizmo: true,
    },
  },
  {
    id: 'master_showroom',
    name: 'オートサロン・ショールーム',
    icon: '💎',
    tagline: '金属の造形美を寸分の歪みなく引き出すクリーンホワイト3点スタジオ光',
    description: '金属の造形美を寸分の歪みなく引き出すクリーンホワイト3点スタジオ光',
    options: {
      enabled: true,
      plane: 'horizontal',
      autoRotate: true,
      rotationSpeed: 0.5,
      distance: 6.2,
      intensity: 2.8,
      color: '#ffffff',
      colorShiftMode: 'none',
      colorShiftSpeed: 1.0,
      smokeEnabled: false,
      smokeDensity: 0.015,
      multiLightEnabled: true,
      showLightGizmo: false,
    },
  },
  {
    id: 'sunset_canyon',
    name: 'サンセット・トワイライト',
    icon: '🌅',
    tagline: '夕陽の暖かなアンバーから真紅へと移ろう情緒的なシネマティック光',
    description: '夕陽の暖かなアンバーから真紅へと移ろう情緒的なシネマティック光',
    options: {
      enabled: true,
      plane: 'tilt_neg45',
      autoRotate: true,
      rotationSpeed: 0.7,
      distance: 5.8,
      intensity: 3.4,
      color: '#ff7700',
      colorShiftMode: 'sunset_glow',
      colorShiftSpeed: 0.7,
      smokeEnabled: true,
      smokeDensity: 0.026,
      multiLightEnabled: true,
      showLightGizmo: true,
    },
  },
  {
    id: 'electric_storm',
    name: 'エレクトリック・ビーム',
    icon: '⚡',
    tagline: '近接配置から放たれる強烈なアクアブルー光と躍動感ある垂直旋回',
    description: '近接配置から放たれる強烈なアクアブルー光と躍動感ある垂直旋回',
    options: {
      enabled: true,
      plane: 'vertical',
      autoRotate: true,
      rotationSpeed: 1.5,
      distance: 3.8,
      intensity: 5.0,
      color: '#00ffff',
      colorShiftMode: 'deep_ocean',
      colorShiftSpeed: 1.4,
      smokeEnabled: true,
      smokeDensity: 0.048,
      multiLightEnabled: true,
      showLightGizmo: true,
    },
  },
];

export const DEFAULT_STAGE_LIGHTING: StageLightingOptions = {
  enabled: true,
  plane: 'horizontal',
  autoRotate: true,
  rotationSpeed: 0.8,
  manualAngleDeg: 45,
  distance: 6.2,
  intensity: 3.0,
  color: '#ffffff',
  colorShiftMode: 'none',
  colorShiftSpeed: 1.0,
  smokeEnabled: false,
  smokeDensity: 0.032,
  multiLightEnabled: true,
  showLightGizmo: true,
};
