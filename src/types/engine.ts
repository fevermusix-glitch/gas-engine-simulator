export type EngineLayout = 'inline' | 'v-type' | 'boxer';

export type ExplosionEffectType = 'metaball' | 'realistic';

export type CrankshaftType = 'crossplane' | 'flatplane';

export type CylinderCount = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface EngineConfig {
  layout: EngineLayout;
  cylinderCount: number;
  vAngleDeg: number; // For V-type, e.g. 60, 75, 90
  crankshaftType?: CrankshaftType; // For V8: 'crossplane' (90° cross) or 'flatplane' (180° flat)
  boreMm: number; // e.g. 84 mm
  strokeMm: number; // e.g. 90 mm
  compressionRatio: number; // e.g. 10.5
  rodLengthMm: number; // e.g. 145 mm
  blockMaterial: 'aluminum' | 'cast_iron';
}

export interface EngineControlState {
  throttle: number; // 0 to 100%
  fuelRatio: number; // 0.8 (rich) to 1.3 (lean) (stoichiometric = 1.0)
  targetFuelMg: number; // mg per cycle
  simulationSpeed: number; // 0.05 to 1.5
  isRunning: boolean;
  starterActive: boolean;
}

import { StageLightingOptions } from './lighting';
export * from './lighting';

export type ShadingMode = 'standard' | 'exaggerated_metallic' | 'toon' | 'wireframe';

export type BackgroundStyle = 'dark_studio' | 'carbon_garage' | 'clean_white' | 'sunset_warm' | 'neon_cyber';

export type ExplodedEasingType = 'cubic' | 'quart' | 'quint' | 'elastic' | 'linear';

export interface EngineVisualOptions {
  isCutaway: boolean; // true = cutaway (pistons & crank exposed), false = engine cover
  showExplosion: boolean; // true = show combustion flame/spark explosions, false = off
  showExhaust: boolean; // exhaust pipes toggle
  showWaterJacket: boolean; // coolant channels
  showHeatmap: boolean; // thermal heatmap on surfaces
  blockOpacity: number; // 0.0 (transparent) to 1.0 (solid)
  explosionEffect: ExplosionEffectType;
  explodedProgress: number; // 0.0 (assembled) to 1.0 (fully exploded)
  explodedEasing?: ExplodedEasingType; // easing curve for smooth exploded view animation
  showCameraHUD: boolean; // on-screen pan/tilt/zoom buttons
  showCrankRotationMarker: boolean; // visual timing ring & degree marker
  shadingMode: ShadingMode; // standard | exaggerated_metallic | toon | wireframe
  backgroundStyle: BackgroundStyle; // dark_studio | carbon_garage | clean_white | sunset_warm | neon_cyber
  lighting?: StageLightingOptions; // 3D Rotating Stage Lighting, Smoke Machine & Color Shift
}

export interface CylinderTelemetry {
  index: number;
  bank: 'left' | 'right' | 'center';
  angleDeg: number; // Crank angle for this cylinder (0 - 720)
  pistonPositionNormalized: number; // 0 (TDC) to 1 (BDC)
  strokePhase: '吸気 (Intake)' | '圧縮 (Compression)' | '燃焼 (Power)' | '排気 (Exhaust)';
  pressureBar: number;
  tempCelsius: number;
  isIgniting: boolean;
}

export interface EngineTelemetry {
  rpm: number;
  torqueNm: number;
  powerKw: number;
  powerPs: number;
  thermalEfficiencyPct: number;
  indicatedMeanEffPressureBar: number; // IMEP
  airFuelRatio: number; // AFR e.g. 14.7
  fuelFlowLitersPerHour: number;
  cylinderTemperatures: number[]; // °C
  exhaustTempCelsius: number;
  coolantTempCelsius: number;
  oilTempCelsius: number;
  displacementCc: number;
  crankAngleDeg: number; // 0 - 720
  cylinders: CylinderTelemetry[];
  pvData: { volumeCc: number; pressureBar: number }[];
}

export interface MaterialProperty {
  id: string;
  name: string;
  materialName: string;
  densityGPerCm3: number;
  yieldStrengthMpa: number;
  thermalConductivityWPerMk: number;
  maxOperatingTempC: number;
  unitWeightKg: number;
  totalWeightKg: number;
  category: '往復運動部品' | '回転運動部品' | '構造部品' | '動弁系';
}
