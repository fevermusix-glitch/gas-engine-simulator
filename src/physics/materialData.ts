import { EngineConfig, MaterialProperty } from '../types/engine';

export function calculateMaterialProperties(config: EngineConfig): {
  properties: MaterialProperty[];
  totalWeightKg: number;
  reciprocatingMassKg: number;
  rotatingMassKg: number;
  stationaryMassKg: number;
} {
  const { cylinderCount, boreMm, strokeMm, blockMaterial } = config;

  // Scale factors based on bore and stroke (standard reference: 84mm bore, 90mm stroke)
  const boreScale = boreMm / 84;
  const strokeScale = strokeMm / 90;
  const volScale = (boreScale * boreScale * strokeScale);

  // 1. Piston (Forged Al-Si Alloy A4032 / A2618)
  const singlePistonWeight = 0.385 * (boreScale ** 2.8); // kg
  const pistonProp: MaterialProperty = {
    id: 'piston',
    name: 'ピストン (ピン・リング含む)',
    materialName: '鍛造アルミシリコン合金 (A4032)',
    densityGPerCm3: 2.68,
    yieldStrengthMpa: 380,
    thermalConductivityWPerMk: 155,
    maxOperatingTempC: 380,
    unitWeightKg: Number(singlePistonWeight.toFixed(3)),
    totalWeightKg: Number((singlePistonWeight * cylinderCount).toFixed(2)),
    category: '往復運動部品',
  };

  // 2. Connecting Rod (Forged 4340 Alloy Steel / SNCM439)
  const singleRodWeight = 0.520 * (strokeScale ** 1.8);
  const rodProp: MaterialProperty = {
    id: 'rod',
    name: 'コネクティングロッド',
    materialName: '鍛造ニッケルクロムモリブデン鋼 (SNCM439 / 4340)',
    densityGPerCm3: 7.85,
    yieldStrengthMpa: 980,
    thermalConductivityWPerMk: 44,
    maxOperatingTempC: 450,
    unitWeightKg: Number(singleRodWeight.toFixed(3)),
    totalWeightKg: Number((singleRodWeight * cylinderCount).toFixed(2)),
    category: '往復運動部品',
  };

  // 3. Crankshaft (Nitrided SCM440 Steel / Forged Micro-alloy)
  const baseCrankPerCyl = 2.8 * (strokeScale ** 1.5);
  const totalCrankWeight = baseCrankPerCyl * cylinderCount + 4.5; // counterweights and snouts
  const crankProp: MaterialProperty = {
    id: 'crankshaft',
    name: 'クランクシャフト (カウンターウェイト含)',
    materialName: '浸炭焼入れ特殊合金鋼 (SCM440 / 4140H)',
    densityGPerCm3: 7.85,
    yieldStrengthMpa: 850,
    thermalConductivityWPerMk: 42,
    maxOperatingTempC: 400,
    unitWeightKg: Number((totalCrankWeight / cylinderCount).toFixed(2)),
    totalWeightKg: Number(totalCrankWeight.toFixed(2)),
    category: '回転運動部品',
  };

  // 4. Flywheel (Chromoly Steel SCM435)
  const flywheelWeight = 6.2 + cylinderCount * 0.4;
  const flywheelProp: MaterialProperty = {
    id: 'flywheel',
    name: 'フライホイール',
    materialName: 'クロムモリブデン鋼 (SCM435)',
    densityGPerCm3: 7.85,
    yieldStrengthMpa: 780,
    thermalConductivityWPerMk: 43,
    maxOperatingTempC: 350,
    unitWeightKg: Number(flywheelWeight.toFixed(2)),
    totalWeightKg: Number(flywheelWeight.toFixed(2)),
    category: '回転運動部品',
  };

  // 5. Cylinder Block
  const isAlum = blockMaterial === 'aluminum';
  const blockDensity = isAlum ? 2.75 : 7.20; // Al vs Cast Iron FC250
  const blockUnitWeight = isAlum ? (6.5 * volScale) : (14.2 * volScale);
  const totalBlockWeight = (blockUnitWeight * cylinderCount) + (isAlum ? 14 : 28);
  const blockProp: MaterialProperty = {
    id: 'block',
    name: 'シリンダーブロック (ライナー含む)',
    materialName: isAlum ? '低圧鋳造アルミニウム合金 (A319-T6)' : '高強度ネズミ鋳鉄 (FC250)',
    densityGPerCm3: blockDensity,
    yieldStrengthMpa: isAlum ? 240 : 250,
    thermalConductivityWPerMk: isAlum ? 120 : 48,
    maxOperatingTempC: isAlum ? 260 : 400,
    unitWeightKg: Number((totalBlockWeight / cylinderCount).toFixed(2)),
    totalWeightKg: Number(totalBlockWeight.toFixed(2)),
    category: '構造部品',
  };

  // 6. Cylinder Head (Al-Si Alloy A356-T6)
  const headWeightPerCyl = 3.8 * volScale;
  const totalHeadWeight = (headWeightPerCyl * cylinderCount) + 8.0;
  const headProp: MaterialProperty = {
    id: 'head',
    name: 'シリンダーヘッド',
    materialName: '熱処理アルミ合金 (A356-T6)',
    densityGPerCm3: 2.67,
    yieldStrengthMpa: 220,
    thermalConductivityWPerMk: 150,
    maxOperatingTempC: 280,
    unitWeightKg: Number((totalHeadWeight / cylinderCount).toFixed(2)),
    totalWeightKg: Number(totalHeadWeight.toFixed(2)),
    category: '構造部品',
  };

  // 7. Valves (Inconel 751 / SUH35 耐熱鋼)
  const valvesPerCyl = 4; // DOHC 4 valves
  const singleValveWeight = 0.045; // 45g
  const totalValveWeight = singleValveWeight * valvesPerCyl * cylinderCount;
  const valveProp: MaterialProperty = {
    id: 'valves',
    name: '吸排気バルブ & スプリング (4バルブ/気筒)',
    materialName: '超耐熱ニッケル基合金 (Inconel 751) / 耐熱鋼 (SUH35)',
    densityGPerCm3: 8.22,
    yieldStrengthMpa: 1100,
    thermalConductivityWPerMk: 16,
    maxOperatingTempC: 850,
    unitWeightKg: Number((singleValveWeight * valvesPerCyl).toFixed(3)),
    totalWeightKg: Number(totalValveWeight.toFixed(2)),
    category: '動弁系',
  };

  // 8. Camshafts (DOHC Chilled Cast Iron / Hollow Steel)
  const camWeight = 1.8 * (cylinderCount / 4) + 1.2;
  const camProp: MaterialProperty = {
    id: 'camshaft',
    name: 'カムシャフト (吸気・排気DOHC 2本)',
    materialName: 'チル鋳鉄 / 中空浸炭焼入鋼',
    densityGPerCm3: 7.25,
    yieldStrengthMpa: 650,
    thermalConductivityWPerMk: 40,
    maxOperatingTempC: 300,
    unitWeightKg: Number((camWeight * 2 / cylinderCount).toFixed(2)),
    totalWeightKg: Number((camWeight * 2).toFixed(2)),
    category: '動弁系',
  };

  // 9. Exhaust Manifold (SUS304 Stainless Steel)
  const exhaustWeight = 2.2 * (cylinderCount / 4) + 2.5;
  const exhaustProp: MaterialProperty = {
    id: 'exhaust',
    name: 'エキゾーストマニホールド & 配管',
    materialName: 'オーステナイト系ステンレス鋼 (SUS304)',
    densityGPerCm3: 7.93,
    yieldStrengthMpa: 520,
    thermalConductivityWPerMk: 16.2,
    maxOperatingTempC: 800,
    unitWeightKg: Number((exhaustWeight / cylinderCount).toFixed(2)),
    totalWeightKg: Number(exhaustWeight.toFixed(2)),
    category: '構造部品',
  };

  const properties = [
    pistonProp,
    rodProp,
    crankProp,
    flywheelProp,
    blockProp,
    headProp,
    valveProp,
    camProp,
    exhaustProp,
  ];

  const totalWeightKg = Number(
    properties.reduce((sum, p) => sum + p.totalWeightKg, 0).toFixed(2)
  );

  const reciprocatingMassKg = Number(
    (pistonProp.totalWeightKg + rodProp.totalWeightKg * 0.33).toFixed(2)
  );

  const rotatingMassKg = Number(
    (crankProp.totalWeightKg + flywheelProp.totalWeightKg + rodProp.totalWeightKg * 0.67).toFixed(2)
  );

  const stationaryMassKg = Number(
    (totalWeightKg - reciprocatingMassKg - rotatingMassKg).toFixed(2)
  );

  return {
    properties,
    totalWeightKg,
    reciprocatingMassKg,
    rotatingMassKg,
    stationaryMassKg,
  };
}
