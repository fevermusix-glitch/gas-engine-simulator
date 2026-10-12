// Strict Engine Kinematic & Thermodynamic Geometry Synchronization
// Guaranteed 100% mathematical alignment between 3D Mesh Crankpins, Piston TDC, and Ignition Cycles

export interface CylinderGeometryDefinition {
  index: number;
  rowIndex: number;
  bank: 'left' | 'right' | 'center';
  bankAngleRad: number;
  bankAngleDeg: number;
  crankPinDeg: number;
  tdcAngleDeg: number;
  fireAngleDeg: number;
  phaseDeg: number;
}

export function getEngineCylinderGeometry(
  layout: 'inline' | 'v-type' | 'boxer',
  cylinderCount: number,
  vAngleDeg: number = 90,
  crankshaftType?: 'crossplane' | 'flatplane'
): CylinderGeometryDefinition[] {
  const result: CylinderGeometryDefinition[] = [];
  const numRows = layout === 'inline' ? cylinderCount : Math.ceil(cylinderCount / 2);
  const halfVAngleDeg = layout === 'v-type' ? vAngleDeg / 2 : 0;

  if (layout === 'inline') {
    // Bank angle is always 0° (vertical)
    let crankPins: number[] = [];
    let fireAngles: number[] = [];

    if (cylinderCount === 1) {
      crankPins = [0];
      fireAngles = [360];
    } else if (cylinderCount === 2) {
      // 360° even firing twin
      crankPins = [0, 0];
      fireAngles = [360, 0];
    } else if (cylinderCount === 3) {
      // 120° crankpins, 240° firing order: 1 -> 2 -> 3
      // #1: fires at 360° (pin 0°)
      // #2: fires at 600° (pin 120°, TDC at 600° mod 360 = 240°)
      // #3: fires at 120° (pin 240°, TDC at 120° mod 360 = 120°)
      crankPins = [0, 120, 240];
      fireAngles = [360, 600, 120];
    } else if (cylinderCount === 4) {
      // Flat-plane 180° crank, 180° firing order: 1 - 3 - 4 - 2
      // #1: fires at 360° (pin 0°)
      // #2: fires at 180° (pin 180°)
      // #3: fires at 540° (pin 180°)
      // #4: fires at 0° (pin 0°)
      crankPins = [0, 180, 180, 0];
      fireAngles = [360, 180, 540, 0];
    } else if (cylinderCount === 5) {
      // 144° firing order 1 - 2 - 4 - 5 - 3
      // pins: (360 - fireAngle % 360) % 360
      fireAngles = [360, 504, 216, 72, 648];
      crankPins = fireAngles.map((f) => (360 - (f % 360)) % 360);
    } else if (cylinderCount === 6) {
      // Standard I6 1-5-3-6-2-4 firing order (120° intervals)
      // #1: fires at 360° (pin 0°)
      // #2: fires at 120° (pin 240°)
      // #3: fires at 600° (pin 120°)
      // #4: fires at 240° (pin 120°)
      // #5: fires at 480° (pin 240°)
      // #6: fires at 0° (pin 0°)
      crankPins = [0, 240, 120, 120, 240, 0];
      fireAngles = [360, 120, 600, 240, 480, 0];
    } else {
      const step = 720 / cylinderCount;
      for (let i = 0; i < cylinderCount; i++) {
        const fire = (360 + i * step) % 720;
        fireAngles.push(fire);
        crankPins.push((360 - (fire % 360)) % 360);
      }
    }

    for (let i = 0; i < cylinderCount; i++) {
      const pin = crankPins[i] ?? 0;
      const fire = fireAngles[i] ?? 0;
      const tdc = (360 - pin) % 360;
      const phase = (360 - fire + 72000) % 720;

      result.push({
        index: i,
        rowIndex: i,
        bank: 'center',
        bankAngleRad: 0,
        bankAngleDeg: 0,
        crankPinDeg: pin,
        tdcAngleDeg: tdc,
        fireAngleDeg: fire,
        phaseDeg: phase,
      });
    }
  } else if (layout === 'boxer') {
    // Boxer / Horizontally Opposed:
    // Left bank: -90° (270°), Right bank: +90°
    // Left TDC: when crankpin points left (-90° / 270°) -> crankAngle = (270 - pin) % 360
    // Right TDC: when crankpin points right (+90°) -> crankAngle = (90 - pin) % 360

    if (cylinderCount === 2) {
      // 180° opposing twin (BMW / Citroen 2CV)
      // Both pistons reach TDC simultaneously at 270°
      const crankPins = [0, 180];
      const fireAngles = [270, 630]; // 360° alternating firing
      for (let i = 0; i < 2; i++) {
        const isRight = i % 2 === 1;
        const bankAng = isRight ? 90 : -90;
        const pin = crankPins[i];
        const fire = fireAngles[i];
        const tdc = (bankAng - pin + 7200) % 360;
        const phase = (360 - fire + 7200) % 720;
        result.push({
          index: i,
          rowIndex: 0,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    } else if (cylinderCount === 4) {
      // Boxer-4 (Subaru EJ/FA): Firing order 1 - 3 - 2 - 4 (180° intervals)
      // Row 0: #1 (L1, i=0, pin=0°), #2 (R1, i=1, pin=180°)
      // Row 1: #3 (L2, i=2, pin=180°), #4 (R2, i=3, pin=0°)
      const crankPins = [0, 180, 180, 0];
      // #1 fires at 270°
      // #3 fires at 450° (90°)
      // #2 fires at 630° (270°)
      // #4 fires at 90°
      const fireAngles = [270, 630, 450, 90];
      for (let i = 0; i < 4; i++) {
        const isRight = i % 2 === 1;
        const rowIndex = Math.floor(i / 2);
        const bankAng = isRight ? 90 : -90;
        const pin = crankPins[i];
        const fire = fireAngles[i];
        const tdc = (bankAng - pin + 7200) % 360;
        const phase = (360 - fire + 7200) % 720;
        result.push({
          index: i,
          rowIndex,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    } else if (cylinderCount === 6) {
      // Boxer-6 (Porsche 911): Firing order 1 - 6 - 2 - 4 - 3 - 5 (120° intervals)
      // Row 0: #1 (L1, i=0, pin=0°), #2 (R1, i=1, pin=180°)
      // Row 1: #3 (L2, i=2, pin=120°), #4 (R2, i=3, pin=300°)
      // Row 2: #5 (L3, i=4, pin=240°), #6 (R3, i=5, pin=60°)
      const crankPins = [0, 180, 120, 300, 240, 60];

      // Exact TDC angles for each cylinder:
      // i=0 (L1, bank -90°, pin 0°):   TDC = 270° (also 630°)
      // i=1 (R1, bank +90°, pin 180°): TDC = 270° (also 630°)
      // i=2 (L2, bank -90°, pin 120°): TDC = 150° (also 510°)
      // i=3 (R2, bank +90°, pin 300°): TDC = 150° (also 510°)
      // i=4 (L3, bank -90°, pin 240°): TDC = 30°  (also 390°)
      // i=5 (R3, bank +90°, pin 60°):  TDC = 30°  (also 390°)
      //
      // Firing sequence across 720° (120° intervals):
      // 30°:  #5 (L3, i=4)
      // 150°: #4 (R2, i=3)
      // 270°: #1 (L1, i=0)
      // 390°: #6 (R3, i=5)
      // 510°: #3 (L2, i=2)
      // 630°: #2 (R1, i=1)
      const fireAngles = [270, 630, 510, 150, 30, 390];
      for (let i = 0; i < 6; i++) {
        const isRight = i % 2 === 1;
        const rowIndex = Math.floor(i / 2);
        const bankAng = isRight ? 90 : -90;
        const pin = crankPins[i];
        const fire = fireAngles[i] % 720;
        const tdc = (bankAng - pin + 7200) % 360;
        const phase = (360 - fire + 7200) % 720;
        result.push({
          index: i,
          rowIndex,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    } else {
      const step = 720 / cylinderCount;
      for (let i = 0; i < cylinderCount; i++) {
        const isRight = i % 2 === 1;
        const rowIndex = Math.floor(i / 2);
        const bankAng = isRight ? 90 : -90;
        const pin = (rowIndex * (720 / numRows) + (isRight ? 180 : 0)) % 360;
        const tdc = (bankAng - pin + 7200) % 360;
        const fire = (tdc + (i % 2 === 1 ? 360 : 0)) % 720;
        const phase = (360 - fire + 7200) % 720;
        result.push({
          index: i,
          rowIndex,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    }
  } else {
    // V-Type Engine:
    // Left bank: -halfVAngleDeg, Right bank: +halfVAngleDeg
    // Shared crankpin per row (pairIndex = floor(i/2))
    if (cylinderCount === 8) {
      // --- V8 ARCHITECTURE: Crossplane (90° cross) vs Flatplane (180° flat) ---
      const isFlatplane = crankshaftType === 'flatplane';
      // Row pins: 4 throws
      // Crossplane: 0°, 90°, 270°, 180° (Classic 90° cross-plane layout)
      // Flatplane: 0°, 180°, 180°, 0° (High-RPM racing flat-plane layout)
      const rowPins = isFlatplane ? [0, 180, 180, 0] : [0, 90, 270, 180];

      // Firing angles for each of the 8 cylinders:
      // In 90° V8, exactly 90° separation between combustions: 45°, 135°, 225°, 315°, 405°, 495°, 585°, 675°
      // Cylinders index:
      // 0: L1, 1: R1, 2: L2, 3: R2, 4: L3, 5: R3, 6: L4, 7: R4
      const fireAnglesV8 = isFlatplane
        ? [675, 45, 135, 585, 495, 225, 315, 405] // Flatplane: R -> L -> R -> L -> R -> L -> R -> L
        : [315, 45, 585, 675, 405, 495, 135, 225]; // Crossplane: R -> L -> R -> L -> L -> R -> L -> R (Classic Rumble)

      for (let i = 0; i < 8; i++) {
        const isRight = i % 2 === 1;
        const rowIndex = Math.floor(i / 2);
        const bankAng = isRight ? halfVAngleDeg : -halfVAngleDeg;
        const pin = rowPins[rowIndex];

        // Exact geometric TDC crank angle: (bankAng - pin) % 360
        const tdc = (bankAng - pin + 7200) % 360;
        const fire = fireAnglesV8[i];
        const phase = (360 - fire + 7200) % 720;

        result.push({
          index: i,
          rowIndex,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    } else {
      for (let i = 0; i < cylinderCount; i++) {
        const isRight = i % 2 === 1;
        const rowIndex = Math.floor(i / 2);
        const bankAng = isRight ? halfVAngleDeg : -halfVAngleDeg;

        // Shared crankpin for the pair
        const pin = (rowIndex * (720 / numRows)) % 360;

        // Exact geometric crank angle when this piston reaches TDC
        const tdc = (bankAng - pin + 7200) % 360;

        // Alternating 4-stroke combustion across banks
        const isSecondStroke = rowIndex % 2 === 1 ? !isRight : isRight;
        const fire = (tdc + (isSecondStroke ? 360 : 0)) % 720;
        const phase = (360 - fire + 7200) % 720;

        result.push({
          index: i,
          rowIndex,
          bank: isRight ? 'right' : 'left',
          bankAngleRad: (bankAng * Math.PI) / 180,
          bankAngleDeg: bankAng,
          crankPinDeg: pin,
          tdcAngleDeg: tdc,
          fireAngleDeg: fire,
          phaseDeg: phase,
        });
      }
    }
  }

  // Universal Mathematical Invariant Guarantee:
  // Every cylinder's combustion fireAngleDeg MUST occur precisely at one of its physical TDC events:
  // i.e., (fireAngleDeg % 360) must identically equal (tdcAngleDeg % 360).
  result.forEach((g) => {
    const tdcMod = ((g.tdcAngleDeg % 360) + 360) % 360;
    const fireMod = ((g.fireAngleDeg % 360) + 360) % 360;
    if (Math.abs(tdcMod - fireMod) > 0.001) {
      // Snap to exact matching TDC stroke phase
      const isSecond = g.fireAngleDeg >= 360;
      g.fireAngleDeg = (tdcMod + (isSecond ? 360 : 0)) % 720;
      g.phaseDeg = (360 - g.fireAngleDeg + 7200) % 720;
    }
  });

  return result;
}
