import {
  EngineConfig,
  EngineControlState,
  EngineTelemetry,
  CylinderTelemetry,
} from '../types/engine';
import { getEngineCylinderGeometry } from './engineGeometry';

export class EngineThermodynamics {
  private crankAngleDeg = 0; // 0 to 720
  private currentRpm = 850; // Idle
  private smoothTorque = 0;
  private smoothPower = 0;

  public update(
    deltaTimeSeconds: number,
    config: EngineConfig,
    controls: EngineControlState
  ): EngineTelemetry {
    const {
      layout,
      cylinderCount,
      vAngleDeg,
      boreMm,
      strokeMm,
      compressionRatio,
      rodLengthMm,
    } = config;

    const { throttle, fuelRatio, isRunning, starterActive, simulationSpeed } = controls;

    // Geometric parameters
    const boreM = boreMm / 1000;
    const strokeM = strokeMm / 1000;
    const crankRadiusM = strokeM / 2;
    const pistonAreaM2 = Math.PI * Math.pow(boreM / 2, 2);
    const displacementPerCylM3 = pistonAreaM2 * strokeM;
    const singleCylCc = displacementPerCylM3 * 1e6;
    const totalDisplacementCc = singleCylCc * cylinderCount;
    const clearanceVolumeM3 = displacementPerCylM3 / (compressionRatio - 1);
    const lambdaRod = crankRadiusM / (rodLengthMm / 1000);

    // Crank phasing calculation
    const cylinderPhases = this.calculateCylinderPhases(
      layout,
      cylinderCount,
      vAngleDeg,
      config.crankshaftType
    );

    // Intake manifold absolute pressure (MAP) based on throttle
    // Idle (~0.35 bar), WOT (~0.98 bar atmospheric)
    const mapPressureBar = 0.30 + (throttle / 100) * 0.68;

    // Stoichiometric AFR is 14.7. User adjust fuelRatio (0.8 rich to 1.3 lean)
    // lambda = fuelRatio. Actual AFR = 14.7 * fuelRatio
    const airFuelRatio = 14.7 * fuelRatio;

    // Combustion quality factor based on AFR (peaks around rich best torque AFR ~ 12.8:1 or lambda ~ 0.88)
    const lambdaEquiv = 1 / fuelRatio;
    let afrCombustionEfficiency = 1.0;
    if (airFuelRatio < 10.5) {
      afrCombustionEfficiency = 0.65; // Way too rich, misfiring / sooty
    } else if (airFuelRatio > 17.5) {
      afrCombustionEfficiency = 0.55; // Too lean, lean misfire
    } else {
      // Parabolic peak near AFR 13.0
      afrCombustionEfficiency = 1.0 - Math.pow((airFuelRatio - 13.2) / 7.0, 2);
    }
    afrCombustionEfficiency = Math.max(0.4, Math.min(1.0, afrCombustionEfficiency));

    // Ideal Otto cycle thermal efficiency: eta = 1 - (1 / CR^(gamma - 1))
    const gamma = 1.33; // polytropic coefficient for air-fuel mixture
    const idealEfficiency = 1 - Math.pow(1 / compressionRatio, gamma - 1);
    const realThermalEfficiency = idealEfficiency * afrCombustionEfficiency * 0.72; // ~34% - 39%

    // Calculate per-cylinder telemetry and instantaneous torque
    let totalInstantaneousTorque = 0;
    let maxCylPressure = 0;
    const cylinderTelemetries: CylinderTelemetry[] = [];
    const pvPoints: { volumeCc: number; pressureBar: number }[] = [];

    for (let i = 0; i < cylinderCount; i++) {
      const phaseOffset = cylinderPhases[i].phaseDeg;
      const bank = cylinderPhases[i].bank;

      // Local cylinder cycle angle (0 - 720)
      const cylCycleAngle = (this.crankAngleDeg + phaseOffset + 72000) % 720;
      const rad = (cylCycleAngle * Math.PI) / 180;

      // Piston kinematic distance from TDC (0 at TDC, stroke at BDC)
      // s = r * [ (1 - cos(theta)) + (lambda/2)*sin^2(theta) ]
      const pistonDisp =
        crankRadiusM * (1 - Math.cos(rad) + 0.5 * lambdaRod * Math.pow(Math.sin(rad), 2));
      const normPos = Math.max(0, Math.min(1, pistonDisp / strokeM));

      // Instant cylinder volume
      const currentVolM3 = clearanceVolumeM3 + pistonAreaM2 * pistonDisp;
      const currentVolCc = currentVolM3 * 1e6;

      // Determine stroke phase and cylinder pressure
      let strokePhase: CylinderTelemetry['strokePhase'] = '吸気 (Intake)';
      let cylPressureBar = 1.0;
      let cylTempC = 90;
      
      // Precision Ignition Timing: Spark fires at BTDC 8° (352°), combustion peaks at TDC (360°), decays by ATDC 22° (382°)
      const isIgniting = isRunning && (cylCycleAngle >= 352 && cylCycleAngle <= 382);

      if (cylCycleAngle >= 0 && cylCycleAngle < 180) {
        // 1. 吸気 (Intake)
        strokePhase = '吸気 (Intake)';
        cylPressureBar = mapPressureBar * (0.95 + 0.05 * Math.sin(rad));
        cylTempC = 45 + (mapPressureBar * 25);
      } else if (cylCycleAngle >= 180 && cylCycleAngle < 360) {
        // 2. 圧縮 (Compression)
        strokePhase = '圧縮 (Compression)';
        const compAngle = cylCycleAngle - 180;
        const compVolFraction = currentVolM3 / (clearanceVolumeM3 + displacementPerCylM3);
        cylPressureBar = mapPressureBar * Math.pow(1 / Math.max(0.05, compVolFraction), gamma);
        cylTempC = 80 + Math.pow(compAngle / 180, 1.8) * 380;
      } else if (cylCycleAngle >= 360 && cylCycleAngle < 540) {
        // 3. 燃焼・膨張 (Power)
        strokePhase = '燃焼 (Power)';
        const expAngle = cylCycleAngle - 360;

        if (isRunning) {
          // Combustion peak pressure based on throttle & AFR
          const peakPressure = (18 + (throttle / 100) * 55) * afrCombustionEfficiency;
          if (expAngle <= 20) {
            // Rapid combustion rise to peak
            const rise = expAngle / 20;
            cylPressureBar = (mapPressureBar * Math.pow(compressionRatio, gamma)) + (peakPressure * rise);
            cylTempC = 460 + rise * 1400;
          } else {
            // Isentropic expansion
            const expFraction = currentVolM3 / clearanceVolumeM3;
            cylPressureBar = Math.max(
              1.2,
              peakPressure * Math.pow(1 / Math.max(1, expFraction * 0.4), gamma)
            );
            cylTempC = Math.max(400, 1850 - (expAngle / 180) * 1150);
          }
        } else {
          // Motoring compression decay without spark
          const compVolFraction = currentVolM3 / clearanceVolumeM3;
          cylPressureBar = 1.0 + 8.0 * (1 / compVolFraction);
          cylTempC = 80;
        }
      } else {
        // 4. 排気 (Exhaust)
        strokePhase = '排気 (Exhaust)';
        const exhAngle = cylCycleAngle - 540;
        cylPressureBar = 1.15 + (1 - exhAngle / 180) * 1.5;
        cylTempC = 550 - (exhAngle / 180) * 200;
      }

      maxCylPressure = Math.max(maxCylPressure, cylPressureBar);

      // Tangential torque contribution:
      // T = F_piston * r * [ sin(theta) + lambda*sin(2*theta) / (2*sqrt(1 - lambda^2 * sin^2(theta))) ]
      if (isRunning) {
        const netGasForceN = (cylPressureBar - 1.0) * 1e5 * pistonAreaM2;
        const sinTh = Math.sin(rad);
        const cosTh = Math.cos(rad);
        const geometricFactor = sinTh + (lambdaRod * Math.sin(2 * rad)) / (2 * Math.sqrt(Math.max(0.01, 1 - Math.pow(lambdaRod * sinTh, 2))));
        const cylTorque = netGasForceN * crankRadiusM * geometricFactor;
        totalInstantaneousTorque += cylTorque;
      }

      cylinderTelemetries.push({
        index: i,
        bank,
        angleDeg: cylCycleAngle,
        pistonPositionNormalized: normPos,
        strokePhase,
        pressureBar: Number(cylPressureBar.toFixed(1)),
        tempCelsius: Math.round(cylTempC),
        isIgniting,
      });

      // Sample P-V curve points from Cylinder #0
      if (i === 0) {
        pvPoints.push({
          volumeCc: Number(currentVolCc.toFixed(1)),
          pressureBar: Number(cylPressureBar.toFixed(1)),
        });
      }
    }

    // Engine dynamics & RPM acceleration
    // Internal mechanical friction torque (hydrodynamic oil shear + ring friction)
    const frictionTorque = 15 + 0.018 * this.currentRpm + 0.000004 * Math.pow(this.currentRpm, 2);
    // Pumping work loss + accessory load (alternator, water pump)
    const accessoryLoadTorque = 8 + 0.006 * this.currentRpm + Math.pow(this.currentRpm / 6000, 2) * 25;

    let targetRpm = 850;
    let netBrakeTorque = 0;

    if (isRunning) {
      // Mean indicated torque over full cycle
      // Calculate realistic engine brake torque curve
      const volEfficiency = 0.82 + 0.16 * Math.sin((this.currentRpm / 6000) * Math.PI) * (throttle / 100);
      const airMassPerCycleG = (totalDisplacementCc * 1e-3 * 1.204 * volEfficiency * (mapPressureBar / 1.013));
      const fuelMassPerCycleG = airMassPerCycleG / airFuelRatio;
      
      // Gasoline Lower Heating Value ~ 44 MJ/kg = 44,000 J/g
      const energyPerCycleJ = fuelMassPerCycleG * 44000 * afrCombustionEfficiency;
      const workPerCycleJ = energyPerCycleJ * realThermalEfficiency;
      
      // Torque = Work / (4 * PI) for 4-stroke
      const theoreticalTorqueNm = workPerCycleJ / (4 * Math.PI);
      netBrakeTorque = Math.max(0, theoreticalTorqueNm - frictionTorque);

      // Target RPM based on throttle and load
      const maxRpmLimit = 7800;
      targetRpm = 850 + (throttle / 100) * (maxRpmLimit - 850);
    } else if (starterActive) {
      targetRpm = 280; // Cranking starter motor
      netBrakeTorque = 30;
    } else {
      targetRpm = 0;
      netBrakeTorque = 0;
    }

    // Smooth RPM response with rotational flywheel inertia
    const inertiaFactor = 8.5; // Smooth response rate
    const rpmDelta = (targetRpm - this.currentRpm) * Math.min(1.0, deltaTimeSeconds * inertiaFactor);
    this.currentRpm = Math.max(0, this.currentRpm + rpmDelta);

    // Advance crankshaft angle
    const effectiveSpeed = Math.max(0.001, simulationSpeed);
    // Real degrees per second = RPM * 360 / 60 = RPM * 6
    const crankSpeedDegPerSec = this.currentRpm * 6 * effectiveSpeed;
    this.crankAngleDeg = (this.crankAngleDeg + crankSpeedDegPerSec * deltaTimeSeconds) % 720;

    // Power calculation
    const radPerSec = (this.currentRpm * 2 * Math.PI) / 60;
    const powerKw = (netBrakeTorque * radPerSec) / 1000;
    const powerPs = powerKw * 1.35962; // PS metric horsepower

    this.smoothTorque = this.smoothTorque * 0.9 + netBrakeTorque * 0.1;
    this.smoothPower = this.smoothPower * 0.9 + powerKw * 0.1;

    // Fuel consumption (L/h)
    // Fuel flow = (RPM / 120) * fuelPerCycle_g * 3600 / density (740 g/L)
    const fuelMassFlowGPerSec = isRunning
      ? ((this.currentRpm / 120) * (totalDisplacementCc * 1e-3 * 1.2 * (mapPressureBar / 1.013) / airFuelRatio))
      : 0;
    const fuelFlowLitersPerHour = (fuelMassFlowGPerSec * 3600) / 740;

    // Temperatures calculation
    const loadFactor = (throttle / 100) * (this.currentRpm / 5000);
    const exhaustTempCelsius = isRunning ? Math.round(380 + loadFactor * 420) : 30;
    const coolantTempCelsius = isRunning ? Math.round(86 + loadFactor * 8) : 25;
    const oilTempCelsius = isRunning ? Math.round(92 + loadFactor * 16) : 25;

    // Full 720° Reference P-V diagram curve for plotting
    const fullPvCurve = this.generateReferencePvCurve(
      displacementPerCylM3 * 1e6,
      clearanceVolumeM3 * 1e6,
      compressionRatio,
      mapPressureBar,
      throttle,
      afrCombustionEfficiency,
      isRunning
    );

    return {
      rpm: Math.round(this.currentRpm),
      torqueNm: Number(this.smoothTorque.toFixed(1)),
      powerKw: Number(this.smoothPower.toFixed(1)),
      powerPs: Number((this.smoothPower * 1.35962).toFixed(1)),
      thermalEfficiencyPct: Number((realThermalEfficiency * 100).toFixed(1)),
      indicatedMeanEffPressureBar: Number((netBrakeTorque / (displacementPerCylM3 * cylinderCount * 1e5 / (4 * Math.PI))).toFixed(2)),
      airFuelRatio: Number(airFuelRatio.toFixed(1)),
      fuelFlowLitersPerHour: Number(fuelFlowLitersPerHour.toFixed(2)),
      cylinderTemperatures: cylinderTelemetries.map((c) => c.tempCelsius),
      exhaustTempCelsius,
      coolantTempCelsius,
      oilTempCelsius,
      displacementCc: Math.round(totalDisplacementCc),
      crankAngleDeg: this.crankAngleDeg,
      cylinders: cylinderTelemetries,
      pvData: fullPvCurve,
    };
  }

  private calculateCylinderPhases(
    layout: 'inline' | 'v-type' | 'boxer',
    cylinderCount: number,
    vAngleDeg: number,
    crankshaftType?: 'crossplane' | 'flatplane'
  ): { phaseDeg: number; bank: 'left' | 'right' | 'center' }[] {
    const geometries = getEngineCylinderGeometry(layout, cylinderCount, vAngleDeg, crankshaftType);
    return geometries.map((g) => ({
      phaseDeg: g.phaseDeg,
      bank: g.bank,
    }));
  }

  private generateReferencePvCurve(
    strokeVolCc: number,
    clearanceVolCc: number,
    cr: number,
    mapBar: number,
    throttle: number,
    afrEff: number,
    isRunning: boolean
  ): { volumeCc: number; pressureBar: number }[] {
    const points: { volumeCc: number; pressureBar: number }[] = [];
    const maxVol = strokeVolCc + clearanceVolCc;
    const minVol = clearanceVolCc;
    const gamma = 1.33;
    const peakPressure = (16 + (throttle / 100) * 58) * afrEff;

    // 1. Compression line (180° -> 360° / BDC -> TDC)
    for (let step = 0; step <= 16; step++) {
      const v = maxVol - (step / 16) * (maxVol - minVol);
      const p = mapBar * Math.pow(maxVol / Math.max(1, v), gamma);
      points.push({ volumeCc: Number(v.toFixed(1)), pressureBar: Number(p.toFixed(1)) });
    }

    // 2. Isochoric / Constant Volume combustion at TDC (Ignition spike)
    if (isRunning) {
      points.push({ volumeCc: Number(minVol.toFixed(1)), pressureBar: Number(peakPressure.toFixed(1)) });
    }

    // 3. Expansion / Power stroke (TDC -> BDC)
    for (let step = 0; step <= 16; step++) {
      const v = minVol + (step / 16) * (maxVol - minVol);
      let p = 1.0;
      if (isRunning) {
        p = Math.max(1.2, peakPressure * Math.pow(minVol / Math.max(1, v), gamma));
      } else {
        p = mapBar * Math.pow(maxVol / Math.max(1, v), gamma);
      }
      points.push({ volumeCc: Number(v.toFixed(1)), pressureBar: Number(p.toFixed(1)) });
    }

    // 4. Exhaust & Intake pumping loop
    points.push({ volumeCc: Number(maxVol.toFixed(1)), pressureBar: 1.1 });
    points.push({ volumeCc: Number(minVol.toFixed(1)), pressureBar: 1.05 });
    points.push({ volumeCc: Number(minVol.toFixed(1)), pressureBar: Number(mapBar.toFixed(1)) });
    points.push({ volumeCc: Number(maxVol.toFixed(1)), pressureBar: Number(mapBar.toFixed(1)) });

    return points;
  }
}
