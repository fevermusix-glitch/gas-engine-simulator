import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  EngineConfig,
  EngineVisualOptions,
  EngineTelemetry,
  ShadingMode,
  BackgroundStyle,
  DEFAULT_STAGE_LIGHTING,
  MASTER_LIGHTING_PRESETS,
  LIGHT_ROTATION_PLANES,
} from '../types/engine';
import { getEngineCylinderGeometry } from '../physics/engineGeometry';
import { Palette, Sparkles, Sun, ChevronDown, ChevronUp, Lightbulb, Wind, RotateCw, FolderOpen } from 'lucide-react';
import { EXPLODED_EASING_FUNCTIONS } from '../utils/easing';

interface Engine3DViewProps {
  config: EngineConfig;
  visualOptions: EngineVisualOptions;
  telemetry: EngineTelemetry;
  cameraControlAction: string | null;
  onCameraActionHandled: () => void;
  onUpdateVisualOptions?: (patch: Partial<EngineVisualOptions>) => void;
  onOpenStageLighting?: () => void;
}

// High-Dynamic-Range Thermal Heatmap Color Ramp (Extreme Contrast & Exaggerated Drama)
function getHeatmapColor(tempC: number): THREE.Color {
  // Exaggerated color contrast requested by user:
  // < 90°C (Cold/Intake): Deep oceanic navy / cobalt blue
  // 90°C - 160°C (Warm/Compression Start): Electric vibrant cyan
  // 160°C - 280°C (Mid-compression): Neon mint green
  // 280°C - 480°C (Pre-ignition / High Pressure): Vivid incandescent yellow
  // 480°C - 750°C (Combustion / Flame expansion): Blazing flame orange-red
  // 750°C - 1100°C (Combustion peak): Searing blood crimson
  // > 1100°C (Extreme hotspot): Super white-hot plasma
  if (tempC < 90) return new THREE.Color(0x0033cc);
  if (tempC < 160) return new THREE.Color(0x00d8ff);
  if (tempC < 280) return new THREE.Color(0x00ff88);
  if (tempC < 480) return new THREE.Color(0xffea00);
  if (tempC < 750) return new THREE.Color(0xff4400);
  if (tempC < 1100) return new THREE.Color(0xef1444);
  return new THREE.Color(0xffffff);
}

// Procedural High-Brilliance Studio Reflection PMREM for Show-Car Mirror Chrome
function createChromeStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  // Deep contrast high-end studio gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.3, '#020617');
  bgGrad.addColorStop(0.5, '#000000');
  bgGrad.addColorStop(0.7, '#0f172a');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // 1. Giant overhead softbox (intense blinding white chrome sheen)
  const topSoftbox = ctx.createRadialGradient(512, 90, 20, 512, 90, 420);
  topSoftbox.addColorStop(0, '#ffffff');
  topSoftbox.addColorStop(0.25, '#ffffff');
  topSoftbox.addColorStop(0.6, '#cbd5e1');
  topSoftbox.addColorStop(1, 'transparent');
  ctx.fillStyle = topSoftbox;
  ctx.fillRect(0, 0, 1024, 280);

  // 2. Left high-contrast white strip light (razor-sharp edge reflections on curves)
  const leftStrip = ctx.createLinearGradient(140, 0, 260, 0);
  leftStrip.addColorStop(0, 'transparent');
  leftStrip.addColorStop(0.45, '#ffffff');
  leftStrip.addColorStop(0.55, '#ffffff');
  leftStrip.addColorStop(1, 'transparent');
  ctx.fillStyle = leftStrip;
  ctx.fillRect(140, 60, 120, 400);

  // 3. Right cool silver strip light
  const rightStrip = ctx.createLinearGradient(760, 0, 880, 0);
  rightStrip.addColorStop(0, 'transparent');
  rightStrip.addColorStop(0.45, '#ffffff');
  rightStrip.addColorStop(0.55, '#e2e8f0');
  rightStrip.addColorStop(1, 'transparent');
  ctx.fillStyle = rightStrip;
  ctx.fillRect(760, 60, 120, 400);

  // 4. Center horizontal chrome horizon line (creates the classic exaggerated hotrod chrome look)
  const horizonGrad = ctx.createLinearGradient(0, 250, 1024, 250);
  horizonGrad.addColorStop(0, '#334155');
  horizonGrad.addColorStop(0.2, '#64748b');
  horizonGrad.addColorStop(0.5, '#ffffff');
  horizonGrad.addColorStop(0.8, '#64748b');
  horizonGrad.addColorStop(1, '#334155');
  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, 245, 1024, 10);

  // 5. Bottom ground reflection bounce
  const groundBounce = ctx.createLinearGradient(0, 360, 0, 512);
  groundBounce.addColorStop(0, 'transparent');
  groundBounce.addColorStop(0.5, '#1e293b');
  groundBounce.addColorStop(1, '#0f172a');
  ctx.fillStyle = groundBounce;
  ctx.fillRect(0, 360, 1024, 152);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const renderTarget = pmremGenerator.fromEquirectangular(tex);
  pmremGenerator.dispose();
  tex.dispose();

  return renderTarget.texture;
}

const STORAGE_KEY_CAMERA = 'engine_sim_camera_v2';

function getInitialCameraState(): {
  spherical: { radius: number; theta: number; phi: number };
  target: THREE.Vector3;
} {
  const defaultSpherical = { radius: 9.0, theta: Math.PI / 4, phi: Math.PI / 3.2 };
  const defaultTarget = new THREE.Vector3(0, 0, 0);
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CAMERA);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.spherical && typeof parsed.spherical.radius === 'number') {
        return {
          spherical: {
            radius: Math.max(3.0, Math.min(25.0, parsed.spherical.radius)),
            theta: typeof parsed.spherical.theta === 'number' ? parsed.spherical.theta : defaultSpherical.theta,
            phi: Math.max(0.05, Math.min(Math.PI - 0.05, parsed.spherical.phi)),
          },
          target: new THREE.Vector3(
            parsed.target?.x || 0,
            parsed.target?.y || 0,
            parsed.target?.z || 0
          ),
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load saved camera state', e);
  }
  return { spherical: defaultSpherical, target: defaultTarget };
}

export const Engine3DView: React.FC<Engine3DViewProps> = ({
  config,
  visualOptions,
  telemetry,
  cameraControlAction,
  onCameraActionHandled,
  onUpdateVisualOptions,
  onOpenStageLighting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Realtime Raytracing Probe and Chrome Environment Map
  const chromeEnvMapRef = useRef<THREE.Texture | null>(null);
  const cubeCameraRef = useRef<THREE.CubeCamera | null>(null);
  const cubeRenderTargetRef = useRef<THREE.WebGLCubeRenderTarget | null>(null);
  const cubeCameraFrameCountRef = useRef<number>(0);

  // Performance: Reusable Vector3 to prevent garbage collection stutter during animate loop
  const reusablePinPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Dynamic mesh references for animation
  const pistonsRef = useRef<{
    mesh: THREE.Group;
    wristPin?: THREE.Group;
    basePos: THREE.Vector3;
    cylIndex: number;
    bankAngleRad: number;
  }[]>([]);

  const conrodsRef = useRef<{
    mesh: THREE.Group;
    crankPinMesh: THREE.Object3D;
    cylIndex: number;
    bankAngleRad: number;
  }[]>([]);

  const crankshaftGroupRef = useRef<THREE.Group | null>(null);
  const timingDiscRef = useRef<THREE.Group | null>(null);
  const intakeValvesRef = useRef<{ mesh: THREE.Mesh; cylIndex: number; basePos: THREE.Vector3; bankAngleRad: number }[]>([]);
  const exhaustValvesRef = useRef<{ mesh: THREE.Mesh; cylIndex: number; basePos: THREE.Vector3; bankAngleRad: number }[]>([]);
  
  const explosionNodesRef = useRef<{
    group: THREE.Group;
    metaballMesh: THREE.Mesh;
    particlePoints: THREE.Points;
    sparkLight: THREE.PointLight;
    cylIndex: number;
    basePos: THREE.Vector3;
  }[]>([]);

  // Groups for exploded view & materials
  const explodedGroupsRef = useRef<{
    blockGroup: THREE.Group;
    headGroup: THREE.Group;
    coverGroup: THREE.Group;
    exhaustGroup: THREE.Group;
    waterJacketGroup: THREE.Group;
    crankshaftAssemblyGroup: THREE.Group;
  } | null>(null);

  // Smoothly animated progress for physical mechanical exploded view
  const smoothExplodedProgressRef = useRef(visualOptions.explodedProgress);

  // Camera Orbit state with persistent localStorage support across phone sleep/reloads
  const initialCam = useRef(getInitialCameraState()).current;
  const cameraTargetRef = useRef<THREE.Vector3>(initialCam.target);
  const cameraSphericalRef = useRef(initialCam.spherical);
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pointerButtonRef = useRef(0);

  // Helper to persist camera position, zoom, and target
  const saveCameraState = () => {
    try {
      const state = {
        spherical: {
          radius: cameraSphericalRef.current.radius,
          theta: cameraSphericalRef.current.theta,
          phi: cameraSphericalRef.current.phi,
        },
        target: {
          x: cameraTargetRef.current.x,
          y: cameraTargetRef.current.y,
          z: cameraTargetRef.current.z,
        },
      };
      localStorage.setItem(STORAGE_KEY_CAMERA, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  };

  // Multi-touch gestures (smartphones & tablets)
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartRadiusRef = useRef<number>(9.0);
  const lastPinchMidRef = useRef<{ x: number; y: number } | null>(null);

  // Background and Lighting refs
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLight1Ref = useRef<THREE.DirectionalLight | null>(null);
  const dirLight2Ref = useRef<THREE.DirectionalLight | null>(null);
  const dirLight3Ref = useRef<THREE.DirectionalLight | null>(null);

  // Dynamic 3D Stage Lighting Rig refs
  const stageLightingGroupRef = useRef<THREE.Group | null>(null);
  const stageKeyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const stageRimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const stageFillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const stageLightBeaconRef = useRef<THREE.Mesh | null>(null);
  const stageLightConeRef = useRef<THREE.Mesh | null>(null);
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const smokeVelocitiesRef = useRef<Float32Array | null>(null);
  const accumulatedLightAngleRef = useRef<number>(0);
  const currentLightColorRef = useRef<THREE.Color>(new THREE.Color(0xffffff));

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const dom = containerRef.current;
    const width = dom.clientWidth;
    const height = dom.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768 && navigator.maxTouchPoints > 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    // Mobile optimization: Cap at 1.5x on smartphones for guaranteed 60fps even with V12 wireframe
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    dom.innerHTML = '';
    dom.appendChild(renderer.domElement);

    // Create Procedural High-Brilliance Chrome Studio Reflection Map
    try {
      const chromeEnv = createChromeStudioEnvMap(renderer);
      chromeEnvMapRef.current = chromeEnv;
    } catch (e) {
      console.warn('Failed to build procedural chrome reflection map', e);
    }

    // Realtime Raytracing Probe: CubeCamera for dynamic inter-part self-reflections
    const cubeTarget = new THREE.WebGLCubeRenderTarget(isMobile ? 96 : 128, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCam = new THREE.CubeCamera(0.08, 40, cubeTarget);
    cubeCam.position.set(0, 0, 0);
    scene.add(cubeCam);
    cubeCameraRef.current = cubeCam;
    cubeRenderTargetRef.current = cubeTarget;

    // Disable context menu on mobile
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    dom.addEventListener('contextmenu', onContextMenu);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0xfff8ee, 2.4);
    dirLight1.position.set(7, 11, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 1.5);
    dirLight2.position.set(-7, -2, -6);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    const dirLight3 = new THREE.DirectionalLight(0x38bdf8, 0.9);
    dirLight3.position.set(0, -6, 5);
    scene.add(dirLight3);
    dirLight3Ref.current = dirLight3;

    // Dynamic 3D Stage Lighting Rig Group
    const stageLightingGroup = new THREE.Group();
    scene.add(stageLightingGroup);
    stageLightingGroupRef.current = stageLightingGroup;

    // 1. Rotating Key Directional Light
    const stageKeyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    stageKeyLight.castShadow = true;
    stageKeyLight.shadow.mapSize.width = 1024;
    stageKeyLight.shadow.mapSize.height = 1024;
    stageKeyLight.shadow.bias = -0.0005;
    stageLightingGroup.add(stageKeyLight);
    stageLightingGroup.add(stageKeyLight.target);
    stageKeyLightRef.current = stageKeyLight;

    // 2. Counter-angle Rim Light (Specular accent & component edge pop)
    const stageRimLight = new THREE.DirectionalLight(0x60a5fa, 1.8);
    stageLightingGroup.add(stageRimLight);
    stageLightingGroup.add(stageRimLight.target);
    stageRimLightRef.current = stageRimLight;

    // 3. Fill / Top Light (Ambient fill balance)
    const stageFillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    stageLightingGroup.add(stageFillLight);
    stageLightingGroup.add(stageFillLight.target);
    stageFillLightRef.current = stageFillLight;

    // 4. Light Position Beacon (Glowing indicator sphere at key light position)
    const beaconGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    stageLightingGroup.add(beaconMesh);
    stageLightBeaconRef.current = beaconMesh;

    // 5. Volumetric Light Cone Mesh (Illuminated light beam visible during smoke/fog)
    const coneHeight = 10;
    const coneGeo = new THREE.ConeGeometry(3.2, coneHeight, 32, 1, true);
    coneGeo.translate(0, -coneHeight / 2, 0); // apex at (0, 0, 0)
    coneGeo.rotateX(-Math.PI / 2); // point along +Z
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.visible = false;
    stageLightingGroup.add(coneMesh);
    stageLightConeRef.current = coneMesh;

    // 6. Stage Smoke Particle Cloud
    const smokeCount = 380;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3 + 0] = (Math.random() - 0.5) * 11;
      smokePositions[i * 3 + 1] = Math.random() * 6.5 - 2.5;
      smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 11;

      smokeVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.006;
      smokeVelocities[i * 3 + 1] = Math.random() * 0.007 + 0.002; // gently drift upwards
      smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeVelocitiesRef.current = smokeVelocities;

    // Procedural soft circular puff texture for smoke particles
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;
    const smokeCtx = smokeCanvas.getContext('2d');
    if (smokeCtx) {
      const grad = smokeCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      smokeCtx.fillStyle = grad;
      smokeCtx.fillRect(0, 0, 64, 64);
    }
    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
    const smokeMat = new THREE.PointsMaterial({
      size: 0.65,
      map: smokeTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffffff,
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    smokePoints.visible = false;
    scene.add(smokePoints);
    smokeParticlesRef.current = smokePoints;

    // High-tech circular grid floor
    const grid = new THREE.GridHelper(16, 32, 0x0284c7, 0x1e293b);
    grid.position.y = -2.8;
    scene.add(grid);
    gridHelperRef.current = grid;

    // WebGL Context Lost & Restored handlers (Prevents crash/blank screen when phone goes to sleep)
    const onContextLost = (e: Event) => {
      e.preventDefault();
      saveCameraState();
    };
    const onContextRestored = () => {
      updateCameraPosition();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);

    // Mobile sleep & tab visibility handler: flush camera state on sleep, re-sync viewport on wake
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCameraState();
      } else if (document.visibilityState === 'visible') {
        if (containerRef.current && rendererRef.current && cameraRef.current) {
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          if (w > 0 && h > 0) {
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h);
          }
          updateCameraPosition();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', saveCameraState);
    window.addEventListener('beforeunload', saveCameraState);

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      dom.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', saveCameraState);
      window.removeEventListener('beforeunload', saveCameraState);
      if (chromeEnvMapRef.current) chromeEnvMapRef.current.dispose();
      cubeTarget.dispose();
      renderer.dispose();
    };
  }, []);

  function updateCameraPosition() {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const clampedPhi = Math.max(0.05, Math.min(Math.PI - 0.05, phi));
    cameraSphericalRef.current.phi = clampedPhi;

    const x = cameraTargetRef.current.x + radius * Math.sin(clampedPhi) * Math.sin(theta);
    const y = cameraTargetRef.current.y + radius * Math.cos(clampedPhi);
    const z = cameraTargetRef.current.z + radius * Math.sin(clampedPhi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cameraTargetRef.current);
  }

  // Screen-space camera panning helper (projects screen 2D dx, dy into 3D world space along camera's right and up vectors)
  const panCameraScreen = (deltaScreenX: number, deltaScreenY: number) => {
    const camera = cameraRef.current;
    const dom = containerRef.current;
    if (!camera || !dom) return;

    // Camera view basis vectors
    const forward = new THREE.Vector3().subVectors(cameraTargetRef.current, camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    // Scale displacement in world units based on FOV and camera distance to target
    const domHeight = Math.max(dom.clientHeight, 300);
    const visibleHeightAtTarget =
      2 * cameraSphericalRef.current.radius * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const factor = visibleHeightAtTarget / domHeight;

    cameraTargetRef.current.addScaledVector(right, -deltaScreenX * factor);
    cameraTargetRef.current.addScaledVector(up, deltaScreenY * factor);
  };

  // Handle external camera actions (from CameraHUD)
  useEffect(() => {
    if (!cameraControlAction) return;

    const rotStep = Math.PI / 16;
    const zoomFactor = 0.85;

    switch (cameraControlAction) {
      case 'rotate_left':
        cameraSphericalRef.current.theta += rotStep;
        break;
      case 'rotate_right':
        cameraSphericalRef.current.theta -= rotStep;
        break;
      case 'tilt_up':
        cameraSphericalRef.current.phi = Math.max(0.1, cameraSphericalRef.current.phi - rotStep);
        break;
      case 'tilt_down':
        cameraSphericalRef.current.phi = Math.min(Math.PI - 0.1, cameraSphericalRef.current.phi + rotStep);
        break;
      case 'zoom_in':
        cameraSphericalRef.current.radius = Math.max(3.5, cameraSphericalRef.current.radius * zoomFactor);
        break;
      case 'zoom_out':
        cameraSphericalRef.current.radius = Math.min(18.0, cameraSphericalRef.current.radius / zoomFactor);
        break;
      case 'pan_up':
        panCameraScreen(0, 45);
        break;
      case 'pan_down':
        panCameraScreen(0, -45);
        break;
      case 'pan_left':
        panCameraScreen(45, 0);
        break;
      case 'pan_right':
        panCameraScreen(-45, 0);
        break;
      case 'preset_front':
        cameraSphericalRef.current = { radius: 8.5, theta: 0, phi: Math.PI / 2.3 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'preset_side':
        cameraSphericalRef.current = { radius: 8.5, theta: Math.PI / 2, phi: Math.PI / 2.3 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'preset_top':
        cameraSphericalRef.current = { radius: 8.5, theta: 0, phi: 0.15 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'preset_iso':
        cameraSphericalRef.current = { radius: 9.0, theta: Math.PI / 4, phi: Math.PI / 3.2 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'preset_v8_valley':
        // Looking down the V-bank valley to watch alternating cross-bank firing
        cameraSphericalRef.current = { radius: 7.2, theta: 0.08, phi: Math.PI / 4.8 };
        cameraTargetRef.current.set(0, 0.4, 0);
        break;
      case 'preset_v8_crank':
        // Looking directly along crankshaft axis to inspect 90° Crossplane '+' or 180° Flatplane '-'
        cameraSphericalRef.current = { radius: 7.0, theta: 0, phi: Math.PI / 2.1 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'reset':
        cameraSphericalRef.current = { radius: 9.0, theta: Math.PI / 4, phi: Math.PI / 3.2 };
        cameraTargetRef.current.set(0, 0, 0);
        break;
    }

    updateCameraPosition();
    saveCameraState();
    onCameraActionHandled();
  }, [cameraControlAction, onCameraActionHandled]);

  // Touch & Mouse Orbit / Pan / Pinch-Zoom gesture handlers
  useEffect(() => {
    const dom = containerRef.current;
    if (!dom) return;

    let wheelDebounceTimer: number | null = null;

    // Mouse Pointer handlers (PC / Desktop)
    const onPointerDown = (e: PointerEvent) => {
      // Ignore touch events here; mobile touch is handled natively below to prevent event duplication
      if (e.pointerType === 'touch') return;
      isPointerDownRef.current = true;
      pointerButtonRef.current = e.button;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !isPointerDownRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };

      // Right-click, Middle-click, or Shift+Left-click: Screen-space Pan
      if (e.shiftKey || pointerButtonRef.current === 2 || pointerButtonRef.current === 1) {
        panCameraScreen(dx, dy);
      } else {
        // Left-click: Orbit rotation
        cameraSphericalRef.current.theta -= dx * 0.008;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, cameraSphericalRef.current.phi - dy * 0.008)
        );
      }
      updateCameraPosition();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        saveCameraState();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = e.deltaY > 0 ? 1.08 : 0.92;
      cameraSphericalRef.current.radius = Math.max(
        3.5,
        Math.min(22.0, cameraSphericalRef.current.radius * zoom)
      );
      updateCameraPosition();
      if (wheelDebounceTimer) window.clearTimeout(wheelDebounceTimer);
      wheelDebounceTimer = window.setTimeout(() => {
        saveCameraState();
      }, 250);
    };

    // Mobile / Tablet Multi-Touch Handlers (1-finger orbit, 2-finger pan & pinch zoom)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        pinchStartDistanceRef.current = null;
        lastPinchMidRef.current = null;
      } else if (e.touches.length >= 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        pinchStartDistanceRef.current = Math.max(dist, 1);
        pinchStartRadiusRef.current = cameraSphericalRef.current.radius;
        lastPinchMidRef.current = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // Prevent browser default scroll, pull-to-refresh, or history gesture
      if (e.cancelable) e.preventDefault();

      if (e.touches.length === 1 && pinchStartDistanceRef.current === null) {
        // 1-finger: Orbit rotation
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dx = currentX - touchStartPosRef.current.x;
        const dy = currentY - touchStartPosRef.current.y;
        touchStartPosRef.current = { x: currentX, y: currentY };

        cameraSphericalRef.current.theta -= dx * 0.007;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, cameraSphericalRef.current.phi - dy * 0.007)
        );
        updateCameraPosition();
      } else if (e.touches.length >= 2) {
        // 2-finger: Simultaneous Pan (translation) and Pinch Zoom (scaling)
        const t0 = e.touches[0];
        const t1 = e.touches[1];

        // 1. Pan via midpoint delta in screen space
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        if (lastPinchMidRef.current) {
          const deltaMidX = midX - lastPinchMidRef.current.x;
          const deltaMidY = midY - lastPinchMidRef.current.y;
          panCameraScreen(deltaMidX, deltaMidY);
        }
        lastPinchMidRef.current = { x: midX, y: midY };

        // 2. Pinch Zoom
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        if (pinchStartDistanceRef.current !== null && pinchStartDistanceRef.current > 0) {
          const scale = pinchStartDistanceRef.current / Math.max(dist, 10);
          cameraSphericalRef.current.radius = Math.max(
            3.5,
            Math.min(22.0, pinchStartRadiusRef.current * scale)
          );
        }

        updateCameraPosition();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Smoothly resume 1-finger orbit without coordinate jumping
        touchStartPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        pinchStartDistanceRef.current = null;
        lastPinchMidRef.current = null;
      } else if (e.touches.length === 0) {
        pinchStartDistanceRef.current = null;
        lastPinchMidRef.current = null;
      }
      saveCameraState();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', onTouchEnd);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Rebuild 3D Engine Model when configuration changes (Inline / V-Type / Boxer)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous engine objects
    const prevRoot = scene.getObjectByName('EngineRoot');
    if (prevRoot) {
      scene.remove(prevRoot);
      prevRoot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    }

    pistonsRef.current = [];
    conrodsRef.current = [];
    intakeValvesRef.current = [];
    exhaustValvesRef.current = [];
    explosionNodesRef.current = [];

    const root = new THREE.Group();
    root.name = 'EngineRoot';
    scene.add(root);

    const blockGroup = new THREE.Group();
    blockGroup.name = 'BlockGroup';
    const headGroup = new THREE.Group();
    headGroup.name = 'HeadGroup';
    const coverGroup = new THREE.Group();
    coverGroup.name = 'CoverGroup';
    const exhaustGroup = new THREE.Group();
    exhaustGroup.name = 'ExhaustGroup';
    const waterJacketGroup = new THREE.Group();
    waterJacketGroup.name = 'WaterJacketGroup';
    const crankshaftAssemblyGroup = new THREE.Group();
    crankshaftAssemblyGroup.name = 'CrankshaftAssemblyGroup';

    root.add(blockGroup);
    root.add(headGroup);
    root.add(coverGroup);
    root.add(exhaustGroup);
    root.add(waterJacketGroup);
    root.add(crankshaftAssemblyGroup);

    explodedGroupsRef.current = {
      blockGroup,
      headGroup,
      coverGroup,
      exhaustGroup,
      waterJacketGroup,
      crankshaftAssemblyGroup,
    };

    const { layout, cylinderCount, vAngleDeg, boreMm, strokeMm } = config;
    const cylSpacing = 1.35; // Spacing along crank Z-axis
    const crankRadius = (strokeMm / 90) * 0.45;
    const conrodLength = 1.48;
    const pistonRadius = (boreMm / 84) * 0.44;
    const pistonHeight = 0.55;

    // Determine bank angle for cylinders:
    // - Inline: 0 rad (vertical)
    // - V-Type: ± (vAngleDeg/2) rad
    // - Boxer: -PI/2 (Left bank, horizontal) and +PI/2 (Right bank, horizontal)
    const halfVAngleRad = layout === 'v-type' ? (vAngleDeg * Math.PI) / 360 : 0;
    const numRows = layout === 'inline' ? cylinderCount : Math.ceil(cylinderCount / 2);
    const startZ = ((numRows - 1) * cylSpacing) / 2;
    const crankLength = numRows * cylSpacing + 1.2;

    // Materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.22,
    });
    const polishedCrankMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.12,
    });
    const counterweightMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.82,
      roughness: 0.35,
    });

    // 1. Build Authentic Multi-Part Crankshaft Assembly (No single rod; real main journals, webs, crankpins, and counterweights)
    const crankGroup = new THREE.Group();
    crankshaftAssemblyGroup.add(crankGroup);
    crankshaftGroupRef.current = crankGroup;

    // Helper: Construct authentic forged crank cheek web + counterweight geometry
    const createCrankWebGeo = (rThrow: number, rCw: number, webThickness: number) => {
      const shape = new THREE.Shape();
      const rMain = 0.20;
      const rPinWeb = 0.18;

      // Arm reaching from main journal (0,0) towards crankpin (0, rThrow) (+Y direction in local frame)
      shape.moveTo(-rMain, 0);
      shape.lineTo(-rPinWeb * 0.95, rThrow);
      // Top round arc surrounding the crankpin journal
      shape.absarc(0, rThrow, rPinWeb, Math.PI, 0, false);
      shape.lineTo(rMain, 0);

      // Flank expanding down to aerodynamic counterweight (-Y direction)
      const angleSpan = 0.95; // ~55 degrees
      const sinA = Math.sin(angleSpan);
      const cosA = Math.cos(angleSpan);
      shape.lineTo(sinA * rCw * 0.7, -cosA * rCw * 0.25);
      shape.lineTo(sinA * rCw, -cosA * rCw);
      // Counterweight bottom outer balancing arc
      shape.absarc(0, 0, rCw, -Math.PI / 2 + angleSpan, -Math.PI / 2 - angleSpan, true);
      shape.lineTo(-sinA * rCw, -cosA * rCw);
      shape.lineTo(-sinA * rCw * 0.7, -cosA * rCw * 0.25);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: webThickness,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.025,
        bevelThickness: 0.025,
      });
      geo.center();
      return geo;
    };

    // Counterweight radius tuned for authentic racing clearance - never contacts piston skirt at BDC
    const cwRadius = crankRadius * 1.62;
    const webThickness = 0.11;
    const crankWebGeo = createCrankWebGeo(crankRadius, cwRadius, webThickness);

    // Dark inset material for oil feed holes and balance drill indentations
    const drillHoleMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.95,
      roughness: 0.8,
    });

    // --- Main Bearing Journals on the (0,0) Centerline ---
    // A. Front Snout Journal (extends forward to timing pulley/disc) with woodruff keyway
    const snoutFrontZ = crankLength / 2 + 0.12;
    const snoutRearZ = startZ + 0.20;
    const snoutLen = Math.max(0.2, snoutFrontZ - snoutRearZ);
    const snoutGeo = new THREE.CylinderGeometry(0.16, 0.16, snoutLen, 24);
    snoutGeo.rotateX(Math.PI / 2);
    const snoutMesh = new THREE.Mesh(snoutGeo, polishedCrankMat);
    snoutMesh.position.set(0, 0, snoutRearZ + snoutLen / 2);
    snoutMesh.castShadow = true;
    crankGroup.add(snoutMesh);

    // Front Snout Keyway (makes shaft rotation instantly visible from front)
    const keywayGeo = new THREE.BoxGeometry(0.04, 0.08, snoutLen * 0.7);
    keywayGeo.translate(0, 0.15, 0);
    const keywayMesh = new THREE.Mesh(keywayGeo, drillHoleMat);
    snoutMesh.add(keywayMesh);

    // B. Intermediate Main Bearing Journals between adjacent cylinder rows (with oil lubrication holes)
    for (let k = 0; k < numRows - 1; k++) {
      const row1Z = startZ - k * cylSpacing;
      const row2Z = startZ - (k + 1) * cylSpacing;
      const jRear = row1Z - 0.16;
      const jFront = row2Z + 0.16;
      const jLen = jRear - jFront;
      if (jLen > 0.05) {
        const jGeo = new THREE.CylinderGeometry(0.18, 0.18, jLen, 24);
        jGeo.rotateX(Math.PI / 2);
        const jMesh = new THREE.Mesh(jGeo, polishedCrankMat);
        jMesh.position.set(0, 0, (jRear + jFront) / 2);
        jMesh.castShadow = true;

        // Main Journal Oil Feed Hole (makes axial rotation clearly apparent)
        const oilHoleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.38, 12);
        const oilHoleMesh = new THREE.Mesh(oilHoleGeo, drillHoleMat);
        oilHoleMesh.rotation.z = Math.PI / 4;
        jMesh.add(oilHoleMesh);

        crankGroup.add(jMesh);
      }
    }

    // C. Rear Main Bearing Journal & Flywheel Mounting Flange
    const lastRowZ = startZ - (numRows - 1) * cylSpacing;
    const rearJFront = lastRowZ - 0.16;
    const rearJRear = -crankLength / 2 - 0.12;
    const rearJLen = Math.max(0.25, rearJFront - rearJRear);
    const rearJGeo = new THREE.CylinderGeometry(0.18, 0.18, rearJLen, 24);
    rearJGeo.rotateX(Math.PI / 2);
    const rearJMesh = new THREE.Mesh(rearJGeo, polishedCrankMat);
    rearJMesh.position.set(0, 0, rearJRear + rearJLen / 2);
    rearJMesh.castShadow = true;

    // Rear journal oil hole
    const rearOilHoleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.38, 12);
    const rearOilHoleMesh = new THREE.Mesh(rearOilHoleGeo, drillHoleMat);
    rearOilHoleMesh.rotation.z = -Math.PI / 4;
    rearJMesh.add(rearOilHoleMesh);

    crankGroup.add(rearJMesh);

    // Flywheel Flange (Solid forged disc with bolt circle)
    const flangeGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 30);
    flangeGeo.rotateX(Math.PI / 2);
    const flangeMesh = new THREE.Mesh(flangeGeo, polishedCrankMat);
    flangeMesh.position.set(0, 0, -crankLength / 2 - 0.07);
    // Flange mounting bolts
    for (let b = 0; b < 6; b++) {
      const bAngle = (b * Math.PI) / 3;
      const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.09, 8);
      boltGeo.rotateX(Math.PI / 2);
      const boltMesh = new THREE.Mesh(boltGeo, drillHoleMat);
      boltMesh.position.set(Math.sin(bAngle) * 0.26, Math.cos(bAngle) * 0.26, 0);
      flangeMesh.add(boltMesh);
    }
    crankGroup.add(flangeMesh);

    // Front Timing Disc & TDC Marker
    const discGroup = new THREE.Group();
    discGroup.position.set(0, 0, crankLength / 2 + 0.12);
    const discGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.08, 36);
    discGeo.rotateX(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discGroup.add(discMesh);

    // Glowing timing mark / TDC needle
    const markGeo = new THREE.BoxGeometry(0.08, 0.28, 0.09);
    markGeo.translate(0, 0.52, 0);
    const markMesh = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    discGroup.add(markMesh);

    // Degree notch ticks around disc
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const notchGeo = new THREE.BoxGeometry(0.03, 0.08, 0.09);
      const notchMesh = new THREE.Mesh(
        notchGeo,
        new THREE.MeshBasicMaterial({ color: deg === 0 ? 0xf43f5e : 0x94a3b8 })
      );
      notchMesh.position.set(Math.sin(rad) * 0.6, Math.cos(rad) * 0.6, 0);
      notchMesh.rotation.z = -rad;
      discGroup.add(notchMesh);
    }
    crankGroup.add(discGroup);
    timingDiscRef.current = discGroup;

    // Rear Flywheel (Equipped with high-visibility Starter Ring Gear Teeth)
    const flywheelGroup = new THREE.Group();
    flywheelGroup.position.set(0, 0, -crankLength / 2 - 0.15);

    const flywheelGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.24, 40);
    flywheelGeo.rotateX(Math.PI / 2);
    const flywheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 });
    const flywheel = new THREE.Mesh(flywheelGeo, flywheelMat);
    flywheel.castShadow = true;
    flywheelGroup.add(flywheel);

    // Flywheel Starter Ring Gear Teeth (48 individual gear teeth along outer circumference)
    // When the crankshaft spins, this gear ring provides unmistakable rotational visual motion!
    const ringGearMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.25,
    });
    const toothCount = 48;
    for (let t = 0; t < toothCount; t++) {
      const tAngle = (t * 2 * Math.PI) / toothCount;
      const toothGeo = new THREE.BoxGeometry(0.065, 0.08, 0.22);
      const toothMesh = new THREE.Mesh(toothGeo, ringGearMat);
      toothMesh.position.set(Math.sin(tAngle) * 1.25, Math.cos(tAngle) * 1.25, 0);
      toothMesh.rotation.z = -tAngle;
      flywheelGroup.add(toothMesh);
    }

    // Clutch mounting bolts on flywheel friction face
    for (let b = 0; b < 8; b++) {
      const bAngle = (b * Math.PI) / 4;
      const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 10);
      boltGeo.rotateX(Math.PI / 2);
      const boltMesh = new THREE.Mesh(boltGeo, drillHoleMat);
      boltMesh.position.set(Math.sin(bAngle) * 0.95, Math.cos(bAngle) * 0.95, 0);
      flywheelGroup.add(boltMesh);
    }

    crankGroup.add(flywheelGroup);

    // Primary Left and Right Exhaust Collector Nodes for realistic manifolds
    const leftExhaustRunners: THREE.Vector3[][] = [];
    const rightExhaustRunners: THREE.Vector3[][] = [];
    const inlineExhaustRunners: THREE.Vector3[][] = [];

    // Track rows where webs have already been placed (for V-type and Boxer multi-cylinder rows)
    const builtRowWebs = new Set<number>();

    // 2. Iterate Cylinders: Build Cylinders, Crank throws, Counterweights, Pistons, Conrods, Valves
    // Synchronized 100% with exact physics geometry definition
    const cylinderGeometries = getEngineCylinderGeometry(
      layout,
      cylinderCount,
      vAngleDeg,
      config.crankshaftType
    );

    for (let i = 0; i < cylinderCount; i++) {
      const geom = cylinderGeometries[i] || {
        bankAngleRad: 0,
        bankAngleDeg: 0,
        rowIndex: i,
        bank: 'center',
        crankPinDeg: (i * (720 / cylinderCount)) % 360,
      };

      const bankAngleRad = geom.bankAngleRad;
      const rowIndex = geom.rowIndex;
      const isRightBank = geom.bank === 'right';
      const crankPinDeg = geom.crankPinDeg;

      const zPos = startZ - rowIndex * cylSpacing;
      const pinRad = (crankPinDeg * Math.PI) / 180;

      // --- Crankpin Journal Mesh ---
      // Bank stagger offset: V-engines and Boxers stagger connecting rods along crank axis
      const pinOffsetZ = (layout === 'v-type' || layout === 'boxer') && isRightBank ? 0.08 : -0.08;
      const cylZ = zPos + (layout === 'inline' ? 0 : pinOffsetZ);

      const crankPinMesh = new THREE.Object3D();
      crankPinMesh.position.set(
        Math.sin(pinRad) * crankRadius,
        Math.cos(pinRad) * crankRadius,
        cylZ
      );
      crankGroup.add(crankPinMesh);

      // Dedicated cylindrical crankpin journal for connecting rod bearing
      const pinWidth = layout === 'inline' ? 0.20 : 0.16;
      const pinCylinderGeo = new THREE.CylinderGeometry(0.12, 0.12, pinWidth, 18);
      pinCylinderGeo.rotateX(Math.PI / 2);
      const pinMesh = new THREE.Mesh(pinCylinderGeo, polishedCrankMat);

      // Crankpin oil supply hole (makes journal rotation visible)
      const pinOilHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, pinWidth + 0.02, 10),
        drillHoleMat
      );
      pinOilHole.rotateX(Math.PI / 2);
      pinMesh.add(pinOilHole);

      crankPinMesh.add(pinMesh);

      // Helper to build a crank web with counterweight balancing drill holes
      const addBalancedWeb = (webZ: number, rotZ: number) => {
        const webMesh = new THREE.Mesh(crankWebGeo, counterweightMat);
        webMesh.position.set(0, 0, zPos + webZ);
        webMesh.rotation.z = rotZ;
        webMesh.castShadow = true;

        // Counterweight balancing drill indentations (dynamically rotate with crankshaft)
        [-0.16, 0.16].forEach((holeX) => {
          const drillIndentation = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, webThickness + 0.02, 12),
            drillHoleMat
          );
          drillIndentation.rotateX(Math.PI / 2);
          drillIndentation.position.set(holeX, -cwRadius * 0.72, 0);
          webMesh.add(drillIndentation);
        });

        crankGroup.add(webMesh);
      };

      // --- Build Realistic Forged Crank Webs with Counterweights (One set per row) ---
      if (!builtRowWebs.has(rowIndex)) {
        builtRowWebs.add(rowIndex);

        if (layout === 'inline') {
          // Front web and rear web straddling the single inline crankpin
          [-0.14, 0.14].forEach((webZ) => {
            addBalancedWeb(webZ, -pinRad);
          });
        } else if (layout === 'v-type') {
          // Dual web straddling the shared V-bank crank throw
          [-0.17, 0.17].forEach((webZ) => {
            addBalancedWeb(webZ, -pinRad);
          });
        } else if (layout === 'boxer') {
          // Boxer has two 180° opposing crankpins in the row
          const pinRadL = pinRad;
          const pinRadR = pinRad + Math.PI;

          addBalancedWeb(-0.18, -pinRadL);
          addBalancedWeb(0, -pinRadR);
          addBalancedWeb(0.18, -pinRadR);
        }
      }

      // --- Cylinder Block Liner Tube ---
      const linerHeight = strokeMm * 0.024;
      const linerGeo = new THREE.CylinderGeometry(pistonRadius * 1.05, pistonRadius * 1.05, linerHeight, 24, 1, true);
      const linerMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.6,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
      const linerMesh = new THREE.Mesh(linerGeo, linerMat);
      linerMesh.rotation.z = -bankAngleRad;
      const linerCenterDist = conrodLength + crankRadius + 0.3;
      linerMesh.position.set(
        Math.sin(bankAngleRad) * linerCenterDist,
        Math.cos(bankAngleRad) * linerCenterDist,
        cylZ
      );
      blockGroup.add(linerMesh);

      // --- Cylinder Head and Combustion Chamber Dome ---
      const headDist = conrodLength + crankRadius + pistonHeight + 0.72;
      const headGeo = new THREE.BoxGeometry(pistonRadius * 2.3, 0.42, cylSpacing * 0.94);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.7,
        roughness: 0.35,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.rotation.z = -bankAngleRad;
      headMesh.position.set(
        Math.sin(bankAngleRad) * headDist,
        Math.cos(bankAngleRad) * headDist,
        cylZ
      );
      headGroup.add(headMesh);

      // Spark plug
      const plugGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 12);
      const plugMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const plugMesh = new THREE.Mesh(plugGeo, plugMat);
      plugMesh.rotation.z = -bankAngleRad;
      plugMesh.position.set(
        Math.sin(bankAngleRad) * (headDist + 0.22),
        Math.cos(bankAngleRad) * (headDist + 0.22),
        cylZ
      );
      headGroup.add(plugMesh);

      // Dual Intake Valves & Dual Exhaust Valves
      const valveRadius = pistonRadius * 0.32;
      const valveStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8);
      const valveHeadGeo = new THREE.CylinderGeometry(valveRadius, 0.02, 0.08, 16);
      valveHeadGeo.translate(0, -0.22, 0);

      // Intake Valve
      const intakeGroup = new THREE.Group();
      const inStem = new THREE.Mesh(valveStemGeo, steelMat);
      const inHead = new THREE.Mesh(valveHeadGeo, steelMat);
      intakeGroup.add(inStem);
      intakeGroup.add(inHead);
      intakeGroup.rotation.z = -bankAngleRad;
      const inBasePos = new THREE.Vector3(
        Math.sin(bankAngleRad) * headDist - Math.cos(bankAngleRad) * (pistonRadius * 0.45),
        Math.cos(bankAngleRad) * headDist + Math.sin(bankAngleRad) * (pistonRadius * 0.45),
        cylZ - 0.22
      );
      intakeGroup.position.copy(inBasePos);
      headGroup.add(intakeGroup);
      intakeValvesRef.current.push({ mesh: intakeGroup as unknown as THREE.Mesh, cylIndex: i, basePos: inBasePos, bankAngleRad });

      // Exhaust Valve
      const exhaustValveGroup = new THREE.Group();
      const exStem = new THREE.Mesh(valveStemGeo, steelMat);
      const exHead = new THREE.Mesh(valveHeadGeo, steelMat);
      exhaustValveGroup.add(exStem);
      exhaustValveGroup.add(exHead);
      exhaustValveGroup.rotation.z = -bankAngleRad;
      const exBasePos = new THREE.Vector3(
        Math.sin(bankAngleRad) * headDist + Math.cos(bankAngleRad) * (pistonRadius * 0.45),
        Math.cos(bankAngleRad) * headDist - Math.sin(bankAngleRad) * (pistonRadius * 0.45),
        cylZ + 0.22
      );
      exhaustValveGroup.position.copy(exBasePos);
      headGroup.add(exhaustValveGroup);
      exhaustValvesRef.current.push({ mesh: exhaustValveGroup as unknown as THREE.Mesh, cylIndex: i, basePos: exBasePos, bankAngleRad });

      // --- Water Jacket (Translucent Blue Cooling Passages) ---
      const jacketGeo = new THREE.CylinderGeometry(pistonRadius * 1.25, pistonRadius * 1.25, linerHeight * 0.85, 24);
      const jacketMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: visualOptions.showWaterJacket ? 0.42 : 0.0,
        roughness: 0.1,
      });
      const jacketMesh = new THREE.Mesh(jacketGeo, jacketMat);
      jacketMesh.rotation.z = -bankAngleRad;
      jacketMesh.position.copy(linerMesh.position);
      waterJacketGroup.add(jacketMesh);

      // --- Piston Assembly (Authentic Slipper Skirt, Valve Reliefs, Hollow Wrist Pin, Pin Bosses) ---
      // Origin (0,0,0) is EXACTLY the Wrist Pin (Gudgeon Pin) center axis!
      const pistonGroup = new THREE.Group();
      
      // Top Crown Deck: Positioned safely above the wrist pin center (compression height)
      const crownDeckGeo = new THREE.CylinderGeometry(pistonRadius, pistonRadius, 0.20, 32);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db, // Pure authentic forged aluminum alloy
        metalness: 0.88,
        roughness: 0.22,
      });
      const crownDeck = new THREE.Mesh(crownDeckGeo, crownMat);
      crownDeck.position.y = 0.28; // Deck bottom at 0.18, top at 0.38 - never clipped by conrod small end!
      crownDeck.castShadow = true;
      pistonGroup.add(crownDeck);

      // Valve Relief Indentations (Combustion pocket reliefs on crown deck)
      [-0.14, 0.14].forEach((vrX) => {
        const vrGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
        const vrMesh = new THREE.Mesh(vrGeo, crownMat);
        vrMesh.position.set(vrX, 0.38, 0);
        crownDeck.add(vrMesh);
      });

      // Piston Rings (Top Compression Ring, 2nd Scraper Ring, Oil Control Ring)
      for (let r = 0; r < 3; r++) {
        const ringGeo = new THREE.TorusGeometry(pistonRadius * 0.995, 0.014, 8, 32);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.92,
          roughness: 0.15,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.name = 'piston_ring';
        ringMesh.position.y = 0.34 - r * 0.055;
        pistonGroup.add(ringMesh);
      }

      // Slipper Skirt with authentic counterweight relief cutouts (ultra-lightweight forged racing profile)
      // Skirt bottom ends well above counterweight sweep arc even at BDC
      const skirtAngleSpan = 0.82; // ~47 degrees arc for thrust faces
      [-1, 1].forEach((dir) => {
        const skirtGeo = new THREE.CylinderGeometry(
          pistonRadius * 0.985,
          pistonRadius * 0.985,
          0.20,
          18,
          1,
          true,
          dir > 0 ? -skirtAngleSpan / 2 : Math.PI - skirtAngleSpan / 2,
          skirtAngleSpan
        );
        const skirtMesh = new THREE.Mesh(skirtGeo, crownMat);
        skirtMesh.position.y = 0.04;
        pistonGroup.add(skirtMesh);
      });

      // Piston Pin Bosses (Reinforced forged pillars supporting the wrist pin directly centered at y=0)
      // Hollow cylindrical bore allowing wrist pin to pass through and its rotation indicators to be viewed
      const pinBossMat = crownMat;
      const bossOuterRad = 0.18;
      const bossInnerRad = 0.094; // Clearance bore for 0.092 pin
      const bossThickness = 0.22;

      const bossShape = new THREE.Shape();
      bossShape.absarc(0, 0, bossOuterRad, 0, Math.PI * 2, false);
      const bossHole = new THREE.Path();
      bossHole.absarc(0, 0, bossInnerRad, 0, Math.PI * 2, true);
      bossShape.holes.push(bossHole);

      const bossHollowGeo = new THREE.ExtrudeGeometry(bossShape, {
        depth: bossThickness,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 20,
      });
      bossHollowGeo.center();

      [-pistonRadius * 0.48, pistonRadius * 0.48].forEach((bossZ) => {
        const bossMesh = new THREE.Mesh(bossHollowGeo, pinBossMat);
        bossMesh.position.set(0, 0, bossZ);

        // Circlip / C-clip retaining groove on outer boss face
        const clipGrooveGeo = new THREE.TorusGeometry(0.098, 0.008, 8, 16);
        const clipMesh = new THREE.Mesh(clipGrooveGeo, drillHoleMat);
        clipMesh.position.set(0, 0, bossZ > 0 ? 0.105 : -0.105);
        bossMesh.add(clipMesh);

        pistonGroup.add(bossMesh);
      });

      // --- Hollow Full-Floating Wrist Pin (Gudgeon Pin) precisely centered at y=0 ---
      // Real racing engines use full-floating pins that rotate freely in both the piston pin bosses
      // and the connecting rod small-end bronze bushing.
      const wristPinGroup = new THREE.Group();
      wristPinGroup.name = 'wrist_pin_group';

      const pinLength = pistonRadius * 1.62;
      const pinRadius = 0.092;
      const pinInnerRadius = 0.052;

      // Outer Pin Body Tube (Hollow Precision Ground Steel)
      const pinShape = new THREE.Shape();
      pinShape.absarc(0, 0, pinRadius, 0, Math.PI * 2, false);
      const pinInnerHole = new THREE.Path();
      pinInnerHole.absarc(0, 0, pinInnerRadius, 0, Math.PI * 2, true);
      pinShape.holes.push(pinInnerHole);

      const pinGeo = new THREE.ExtrudeGeometry(pinShape, {
        depth: pinLength,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.005,
        bevelThickness: 0.005,
        curveSegments: 24,
      });
      pinGeo.center();

      const polishedPinMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0, // Precision ground polished DLC chrome steel
        metalness: 0.96,
        roughness: 0.08,
      });
      const pinBodyMesh = new THREE.Mesh(pinGeo, polishedPinMat);
      wristPinGroup.add(pinBodyMesh);

      // Hollow inner dark cavity core
      const innerCoreGeo = new THREE.CylinderGeometry(pinInnerRadius * 0.99, pinInnerRadius * 0.99, pinLength * 0.98, 16);
      innerCoreGeo.rotateX(Math.PI / 2);
      const innerCoreMesh = new THREE.Mesh(innerCoreGeo, drillHoleMat);
      wristPinGroup.add(innerCoreMesh);

      // Rotation Indicators on Pin Ends (Crosshair + Eccentric Gold Indicator Dot visible from piston exterior)
      [-pinLength / 2 - 0.002, pinLength / 2 + 0.002].forEach((zFace) => {
        // Dark laser engraved crosshair lines across the pin end
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(pinRadius * 1.6, 0.012, 0.002), drillHoleMat);
        crossH.position.set(0, 0, zFace);
        wristPinGroup.add(crossH);

        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.012, pinRadius * 1.6, 0.002), drillHoleMat);
        crossV.position.set(0, 0, zFace);
        wristPinGroup.add(crossV);

        // Highly visible eccentric Gold/Brass timing dot: orbits around pin axis when rotating!
        const dotGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.005, 12);
        dotGeo.rotateX(Math.PI / 2);
        const dotMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b, // Vivid Amber/Gold indicator dot
          metalness: 0.92,
          roughness: 0.15,
        });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.position.set(0, pinRadius * 0.72, zFace);
        wristPinGroup.add(dotMesh);
      });

      // Circumferential radial lubrication oil holes & axial contrast stripes
      // 4 radial oil holes spaced around circumference (visible through small-end oil notch)
      [0, Math.PI / 2].forEach((holeAngle) => {
        const oilHoleGeo = new THREE.CylinderGeometry(0.018, 0.018, pinRadius * 2.05, 10);
        const oilHoleMesh = new THREE.Mesh(oilHoleGeo, drillHoleMat);
        oilHoleMesh.rotation.z = holeAngle;
        wristPinGroup.add(oilHoleMesh);
      });

      // 2 Longitudinal laser contrast stripes along the outer surface
      [Math.PI / 4, Math.PI / 4 + Math.PI].forEach((stripeAngle) => {
        const stripeGeo = new THREE.BoxGeometry(0.014, pinRadius * 2.008, pinLength * 0.85);
        stripeGeo.rotateZ(stripeAngle);
        const stripeMesh = new THREE.Mesh(stripeGeo, drillHoleMat);
        wristPinGroup.add(stripeMesh);
      });

      pistonGroup.add(wristPinGroup);

      root.add(pistonGroup);
      const pistonBasePos = new THREE.Vector3(
        Math.sin(bankAngleRad) * (conrodLength + crankRadius),
        Math.cos(bankAngleRad) * (conrodLength + crankRadius),
        cylZ
      );
      pistonGroup.position.copy(pistonBasePos);
      pistonGroup.rotation.z = -bankAngleRad;
      pistonsRef.current.push({
        mesh: pistonGroup,
        wristPin: wristPinGroup,
        basePos: pistonBasePos,
        cylIndex: i,
        bankAngleRad,
      });

      // --- Connecting Rod (Forged H-Beam, Bronze Small-End Bushing, Split Big-End with Cap Bolts) ---
      const conrodGroup = new THREE.Group();
      
      // H-Beam shank: Center web + Dual side flanges for authentic cross-section
      const hBeamGroup = new THREE.Group();
      hBeamGroup.position.y = conrodLength / 2;

      // Central Web plate
      const webPlateGeo = new THREE.BoxGeometry(0.04, conrodLength * 0.72, 0.13);
      const rodSteelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.88,
        roughness: 0.28,
      });
      const webPlate = new THREE.Mesh(webPlateGeo, rodSteelMat);
      hBeamGroup.add(webPlate);

      // Left and Right Flanges creating the true H-Beam profile
      [-0.045, 0.045].forEach((fX) => {
        const flangeGeo = new THREE.BoxGeometry(0.035, conrodLength * 0.72, 0.13);
        const flangeMesh = new THREE.Mesh(flangeGeo, rodSteelMat);
        flangeMesh.position.x = fX;
        hBeamGroup.add(flangeMesh);
      });
      conrodGroup.add(hBeamGroup);

      // Big End (Crankpin Journal Bearing Housing & Rod Cap)
      const bigEndGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.16, 24);
      bigEndGeo.rotateX(Math.PI / 2);
      const bigEnd = new THREE.Mesh(bigEndGeo, rodSteelMat);
      conrodGroup.add(bigEnd);

      // Rod Cap Split line and Two Rod Bolts
      [-0.14, 0.14].forEach((boltX) => {
        const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.26, 10);
        const boltMesh = new THREE.Mesh(boltGeo, drillHoleMat);
        boltMesh.name = 'rod_bolt';
        boltMesh.position.set(boltX, -0.05, 0);
        conrodGroup.add(boltMesh);
      });

      // Small End: Hollow Eye with Pressed-In Bronze Bushing Sleeve
      // Precisely centered at y = conrodLength to connect with zero offset to Wrist Pin
      const smallEndGroup = new THREE.Group();
      smallEndGroup.position.y = conrodLength;

      // Forged Steel Eye Shell (Outer 0.165, Inner 0.114, Width 0.134)
      const eyeShape = new THREE.Shape();
      eyeShape.absarc(0, 0, 0.165, 0, Math.PI * 2, false);
      const eyeHole = new THREE.Path();
      eyeHole.absarc(0, 0, 0.114, 0, Math.PI * 2, true);
      eyeShape.holes.push(eyeHole);
      const smallEndEyeGeo = new THREE.ExtrudeGeometry(eyeShape, {
        depth: 0.134,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 24,
      });
      smallEndEyeGeo.center();
      const smallEndMesh = new THREE.Mesh(smallEndEyeGeo, rodSteelMat);
      smallEndGroup.add(smallEndMesh);

      // Authentic Bronze Bushing Sleeve (Outer 0.114, Inner 0.095 - holds 0.092 pin with oil clearance)
      const bushingShape = new THREE.Shape();
      bushingShape.absarc(0, 0, 0.114, 0, Math.PI * 2, false);
      const bushingHole = new THREE.Path();
      bushingHole.absarc(0, 0, 0.095, 0, Math.PI * 2, true);
      bushingShape.holes.push(bushingHole);
      const bronzeBushingGeo = new THREE.ExtrudeGeometry(bushingShape, {
        depth: 0.140,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 24,
      });
      bronzeBushingGeo.center();
      const bronzeBushingMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Bronze / Gold alloy
        metalness: 0.90,
        roughness: 0.22,
      });
      const bronzeBushing = new THREE.Mesh(bronzeBushingGeo, bronzeBushingMat);
      bronzeBushing.name = 'bronze_bushing';
      smallEndGroup.add(bronzeBushing);

      // Small End Oil Feed Hole (Notch on top to catch oil mist from underside of piston and view rotating pin)
      const oilNotchGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8);
      const oilNotchMesh = new THREE.Mesh(oilNotchGeo, drillHoleMat);
      oilNotchMesh.position.y = 0.14;
      smallEndGroup.add(oilNotchMesh);

      conrodGroup.add(smallEndGroup);

      root.add(conrodGroup);
      conrodsRef.current.push({
        mesh: conrodGroup,
        crankPinMesh,
        cylIndex: i,
        bankAngleRad,
      });

      // --- Combustion Explosion Nodes ---
      const explosionGroup = new THREE.Group();
      const combustionPos = new THREE.Vector3(
        Math.sin(bankAngleRad) * (headDist - 0.24),
        Math.cos(bankAngleRad) * (headDist - 0.24),
        cylZ
      );
      explosionGroup.position.copy(combustionPos);
      root.add(explosionGroup);

      const metaballGeo = new THREE.SphereGeometry(pistonRadius * 0.92, 24, 24);
      const metaballMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0 });
      const metaballMesh = new THREE.Mesh(metaballGeo, metaballMat);
      explosionGroup.add(metaballMesh);

      const particleCount = 45;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let p = 0; p < particleCount; p++) {
        posArray[p * 3] = (Math.random() - 0.5) * pistonRadius * 1.5;
        posArray[p * 3 + 1] = (Math.random() - 0.5) * 0.25;
        posArray[p * 3 + 2] = (Math.random() - 0.5) * pistonRadius * 1.5;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xef4444,
        size: 0.15,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const particlePoints = new THREE.Points(particleGeo, particleMat);
      explosionGroup.add(particlePoints);

      const sparkLight = new THREE.PointLight(0xfbbf24, 0, 3.5);
      explosionGroup.add(sparkLight);

      explosionNodesRef.current.push({
        group: explosionGroup,
        metaballMesh,
        particlePoints,
        sparkLight,
        cylIndex: i,
        basePos: combustionPos,
      });

      // --- EXHAUST MANIFOLD RUNNER RECORDING ---
      // Exhaust port origin on cylinder head outer flank
      const headPortX = Math.sin(bankAngleRad) * headDist;
      const headPortY = Math.cos(bankAngleRad) * headDist;

      if (layout === 'inline') {
        // Inline engine: Exhaust ports on right side (+X), gather into single collector
        const startPt = new THREE.Vector3(headPortX + 0.4, headPortY, cylZ);
        const midPt = new THREE.Vector3(headPortX + 0.9, headPortY - 0.5, cylZ);
        const endPt = new THREE.Vector3(headPortX + 1.25, -0.6, startZ - rowIndex * 0.35);
        inlineExhaustRunners.push([startPt, midPt, endPt]);
      } else if (layout === 'v-type') {
        // V-engine: Left bank exhaust ports exit to Left (-X), Right bank exit to Right (+X)
        const sign = isRightBank ? 1 : -1;
        const normX = Math.cos(bankAngleRad); // normal vector perpendicular to cylinder axis
        const normY = -Math.sin(bankAngleRad);

        const startPt = new THREE.Vector3(headPortX + sign * 0.35, headPortY, cylZ);
        const midPt = new THREE.Vector3(headPortX + sign * 1.0, headPortY - 0.45, cylZ);
        const endPt = new THREE.Vector3(sign * 1.75, -0.7, startZ - rowIndex * 0.4);

        if (isRightBank) {
          rightExhaustRunners.push([startPt, midPt, endPt]);
        } else {
          leftExhaustRunners.push([startPt, midPt, endPt]);
        }
      } else if (layout === 'boxer') {
        // Boxer engine: Left horizontal head ports exit left (-X), Right ports exit right (+X)
        const sign = isRightBank ? 1 : -1;
        const startPt = new THREE.Vector3(headPortX + sign * 0.2, headPortY - 0.3, cylZ);
        const midPt = new THREE.Vector3(headPortX + sign * 0.4, -0.9, cylZ);
        const endPt = new THREE.Vector3(sign * 1.6, -1.2, startZ - rowIndex * 0.4);

        if (isRightBank) {
          rightExhaustRunners.push([startPt, midPt, endPt]);
        } else {
          leftExhaustRunners.push([startPt, midPt, endPt]);
        }
      }
    }

    // --- 3. Build Realistic Tubular Exhaust Manifolds & Collectors ---
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      metalness: 0.75,
      roughness: 0.35,
    });
    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x44403c,
      metalness: 0.85,
      roughness: 0.3,
    });

    const buildManifoldBank = (runners: THREE.Vector3[][], collectorPos: THREE.Vector3) => {
      runners.forEach((pts) => {
        // Head flange ring
        const flangeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16);
        flangeGeo.rotateZ(Math.PI / 2);
        const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);
        flangeMesh.position.copy(pts[0]);
        exhaustGroup.add(flangeMesh);

        // Runner tube
        const curve = new THREE.CatmullRomCurve3([pts[0], pts[1], pts[2], collectorPos]);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.11, 12, false);
        const tubeMesh = new THREE.Mesh(tubeGeo, exhaustMat);
        tubeMesh.castShadow = true;
        exhaustGroup.add(tubeMesh);
      });

      // Collector cone & downpipe
      const collectorGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.6, 16);
      collectorGeo.rotateX(Math.PI / 2);
      const collectorMesh = new THREE.Mesh(collectorGeo, exhaustMat);
      collectorMesh.position.copy(collectorPos);
      exhaustGroup.add(collectorMesh);

      // Extended exhaust downpipe
      const downpipeCurve = new THREE.CatmullRomCurve3([
        collectorPos,
        new THREE.Vector3(collectorPos.x * 0.85, collectorPos.y - 0.3, collectorPos.z - 0.8),
        new THREE.Vector3(collectorPos.x * 0.7, collectorPos.y - 0.4, -crankLength / 2 - 1.2),
      ]);
      const downpipeGeo = new THREE.TubeGeometry(downpipeCurve, 20, 0.18, 14, false);
      const downpipeMesh = new THREE.Mesh(downpipeGeo, exhaustMat);
      downpipeMesh.castShadow = true;
      exhaustGroup.add(downpipeMesh);
    };

    if (layout === 'inline') {
      const collectorPos = new THREE.Vector3(1.35, -0.75, -startZ);
      buildManifoldBank(inlineExhaustRunners, collectorPos);
    } else {
      // Dual Exhaust Manifolds: Left Bank & Right Bank
      const leftCollector = new THREE.Vector3(-1.85, -0.85, -startZ);
      const rightCollector = new THREE.Vector3(1.85, -0.85, -startZ);
      if (leftExhaustRunners.length > 0) buildManifoldBank(leftExhaustRunners, leftCollector);
      if (rightExhaustRunners.length > 0) buildManifoldBank(rightExhaustRunners, rightCollector);
    }

    // --- 4. Authentic, Highly Realistic Engine Cover & Accessories ---
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.38,
    });
    const redCamCoverMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Sport red valve cover
      metalness: 0.45,
      roughness: 0.4,
    });
    const alumCastMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.4,
    });

    if (layout === 'inline') {
      // INLINE: Sculptured DOHC Valve Cover with Bolt Heads, Oil Cap & Intake Plenum
      const coverLen = crankLength * 0.95;
      const vCoverGeo = new THREE.BoxGeometry(pistonRadius * 2.6, 0.45, coverLen);
      const vCoverMesh = new THREE.Mesh(vCoverGeo, redCamCoverMat);
      vCoverMesh.position.set(0, conrodLength + crankRadius + pistonHeight + 0.95, 0);
      coverGroup.add(vCoverMesh);

      // Oil Filler Cap (オイルフィラーキャップ)
      const oilCapGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
      const oilCapMesh = new THREE.Mesh(
        oilCapGeo,
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
      );
      oilCapMesh.position.set(0.35, conrodLength + crankRadius + pistonHeight + 1.22, startZ * 0.7);
      coverGroup.add(oilCapMesh);

      // Intake Surge Tank / Plenum on the opposite side
      const plenumGeo = new THREE.CylinderGeometry(0.38, 0.38, coverLen * 0.85, 24);
      plenumGeo.rotateX(Math.PI / 2);
      const plenumMesh = new THREE.Mesh(plenumGeo, alumCastMat);
      plenumMesh.position.set(-1.15, conrodLength + crankRadius + 0.4, 0);
      coverGroup.add(plenumMesh);

      // Intake runners connecting plenum to cylinder head
      for (let i = 0; i < cylinderCount; i++) {
        const rZ = startZ - i * cylSpacing;
        const runnerCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.15, conrodLength + crankRadius + 0.4, rZ),
          new THREE.Vector3(-0.8, conrodLength + crankRadius + 0.75, rZ),
          new THREE.Vector3(-0.4, conrodLength + crankRadius + pistonHeight + 0.7, rZ),
        ]);
        const runnerGeo = new THREE.TubeGeometry(runnerCurve, 12, 0.09, 10, false);
        const runnerMesh = new THREE.Mesh(runnerGeo, alumCastMat);
        coverGroup.add(runnerMesh);
      }
    } else if (layout === 'v-type') {
      // V-TYPE: Dual Angled Valve Covers (Bank 1 & 2), Central High-Flow Surge Tank
      const coverLen = crankLength * 0.92;

      // Left Bank Valve Cover
      const leftCoverGeo = new THREE.BoxGeometry(pistonRadius * 2.4, 0.42, coverLen);
      const leftCoverMesh = new THREE.Mesh(leftCoverGeo, redCamCoverMat);
      leftCoverMesh.rotation.z = halfVAngleRad;
      const leftDist = conrodLength + crankRadius + pistonHeight + 0.95;
      leftCoverMesh.position.set(-Math.sin(halfVAngleRad) * leftDist, Math.cos(halfVAngleRad) * leftDist, 0);
      coverGroup.add(leftCoverMesh);

      // Right Bank Valve Cover
      const rightCoverGeo = new THREE.BoxGeometry(pistonRadius * 2.4, 0.42, coverLen);
      const rightCoverMesh = new THREE.Mesh(rightCoverGeo, redCamCoverMat);
      rightCoverMesh.rotation.z = -halfVAngleRad;
      rightCoverMesh.position.set(Math.sin(halfVAngleRad) * leftDist, Math.cos(halfVAngleRad) * leftDist, 0);
      coverGroup.add(rightCoverMesh);

      // Central Intake Plenum nestled inside the Vee
      const vPlenumGeo = new THREE.BoxGeometry(pistonRadius * 2.2, 0.55, coverLen * 0.88);
      const vPlenumMesh = new THREE.Mesh(vPlenumGeo, coverMat);
      vPlenumMesh.position.set(0, leftDist * 0.82, 0);
      coverGroup.add(vPlenumMesh);

      // Throttle Body at front of plenum
      const tbGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.35, 20);
      tbGeo.rotateX(Math.PI / 2);
      const tbMesh = new THREE.Mesh(tbGeo, alumCastMat);
      tbMesh.position.set(0, leftDist * 0.82, coverLen * 0.44 + 0.18);
      coverGroup.add(tbMesh);
    } else if (layout === 'boxer') {
      // BOXER: Dual Horizontally Opposed Valve Covers on Left and Right extremes
      const coverLen = crankLength * 0.92;
      const hDist = conrodLength + crankRadius + pistonHeight + 0.95;

      // Left Horizontal Cover
      const leftCoverGeo = new THREE.BoxGeometry(0.42, pistonRadius * 2.4, coverLen);
      const leftCoverMesh = new THREE.Mesh(leftCoverGeo, redCamCoverMat);
      leftCoverMesh.position.set(-hDist, 0, 0);
      coverGroup.add(leftCoverMesh);

      // Right Horizontal Cover
      const rightCoverGeo = new THREE.BoxGeometry(0.42, pistonRadius * 2.4, coverLen);
      const rightCoverMesh = new THREE.Mesh(rightCoverGeo, redCamCoverMat);
      rightCoverMesh.position.set(hDist, 0, 0);
      coverGroup.add(rightCoverMesh);

      // Top-mounted Boxer Intake Spider Plenum
      const boxerPlenumGeo = new THREE.BoxGeometry(1.6, 0.45, coverLen * 0.7);
      const boxerPlenumMesh = new THREE.Mesh(boxerPlenumGeo, coverMat);
      boxerPlenumMesh.position.set(0, 1.25, 0);
      coverGroup.add(boxerPlenumMesh);
    }

    // Lower Ribbed Oil Pan (オイルパン) & Front Timing Cover
    const oilPanGeo = new THREE.BoxGeometry(layout === 'boxer' ? 2.4 : 1.8, 0.5, crankLength * 0.92);
    oilPanGeo.translate(0, -0.25, 0);
    const oilPanMesh = new THREE.Mesh(oilPanGeo, alumCastMat);
    oilPanMesh.position.set(0, -crankRadius * 1.7 - 0.25, 0);
    coverGroup.add(oilPanMesh);

    // Front Timing Chain / Belt Housing
    const frontCoverGeo = new THREE.BoxGeometry(layout === 'boxer' ? 3.6 : 2.4, 2.2, 0.22);
    const frontCoverMesh = new THREE.Mesh(frontCoverGeo, alumCastMat);
    frontCoverMesh.position.set(0, 0.5, crankLength / 2 + 0.05);
    coverGroup.add(frontCoverMesh);

    // Immediately apply visual options (cutaway, opacity, exhaust, water jacket) upon building the new engine
    const isCutaway = visualOptions.isCutaway;
    coverGroup.visible = !isCutaway;
    exhaustGroup.visible = visualOptions.showExhaust;

    blockGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (isCutaway) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.12, visualOptions.blockOpacity);
          child.material.depthWrite = false;
        } else {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
        }
        child.material.needsUpdate = true;
      }
    });

    headGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (isCutaway) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.18, visualOptions.blockOpacity * 1.25);
          child.material.depthWrite = false;
        } else {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
        }
        child.material.needsUpdate = true;
      }
    });

    waterJacketGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.visible = visualOptions.showWaterJacket;
        child.material.transparent = true;
        child.material.opacity = visualOptions.showWaterJacket ? 0.42 : 0.0;
        child.material.needsUpdate = true;
      }
    });

  }, [config.layout, config.cylinderCount, config.vAngleDeg, config.boreMm, config.strokeMm]);

  // Update dynamic visuals: Opacity, Cutaway toggle, Exhaust, Water Jacket, Heatmap
  useEffect(() => {
    if (!sceneRef.current || !explodedGroupsRef.current) return;
    const { blockGroup, headGroup, coverGroup, exhaustGroup, waterJacketGroup } = explodedGroupsRef.current;

    // Cutaway vs Cover (1-click toggle)
    const isCutaway = visualOptions.isCutaway;
    coverGroup.visible = !isCutaway;
    coverGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.transparent = false;
        child.material.opacity = 1.0;
        child.material.depthWrite = true;
        child.material.needsUpdate = true;
      }
    });

    blockGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (isCutaway) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.12, visualOptions.blockOpacity);
          child.material.depthWrite = false;
        } else {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
        }
        child.material.needsUpdate = true;
      }
    });

    headGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (isCutaway) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.18, visualOptions.blockOpacity * 1.25);
          child.material.depthWrite = false;
        } else {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
        }
        child.material.needsUpdate = true;
      }
    });

    // Exhaust visibility
    exhaustGroup.visible = visualOptions.showExhaust;

    // Water jacket visibility
    waterJacketGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.visible = visualOptions.showWaterJacket;
        child.material.transparent = true;
        child.material.opacity = visualOptions.showWaterJacket ? 0.42 : 0.0;
        child.material.needsUpdate = true;
      }
    });

    // Crank timing marker visibility
    if (timingDiscRef.current) {
      timingDiscRef.current.visible = visualOptions.showCrankRotationMarker;
    }
  }, [
    config.layout,
    config.cylinderCount,
    visualOptions.isCutaway,
    visualOptions.blockOpacity,
    visualOptions.showExhaust,
    visualOptions.showWaterJacket,
    visualOptions.showCrankRotationMarker,
  ]);

  // Dynamic Background and Studio Lighting Switcher (User request: 背景切り替え機能)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const bgStyle = visualOptions.backgroundStyle || 'dark_studio';
    const grid = gridHelperRef.current;
    const amb = ambientLightRef.current;
    const l1 = dirLight1Ref.current;
    const l2 = dirLight2Ref.current;
    const l3 = dirLight3Ref.current;

    switch (bgStyle) {
      case 'carbon_garage':
        scene.background = new THREE.Color(0x050508);
        if (grid) {
          (grid.material as THREE.LineBasicMaterial).color.setHex(0x64748b);
        }
        if (amb) { amb.color.setHex(0x94a3b8); amb.intensity = 0.6; }
        if (l1) { l1.color.setHex(0xffffff); l1.intensity = 2.8; }
        if (l2) { l2.color.setHex(0x94a3b8); l2.intensity = 1.2; }
        if (l3) { l3.color.setHex(0xef4444); l3.intensity = 1.4; } // Sharp Red Rim
        break;

      case 'clean_white':
        scene.background = new THREE.Color(0xe2e8f0);
        if (grid) {
          (grid.material as THREE.LineBasicMaterial).color.setHex(0x94a3b8);
        }
        if (amb) { amb.color.setHex(0xffffff); amb.intensity = 1.2; }
        if (l1) { l1.color.setHex(0xffffff); l1.intensity = 2.0; }
        if (l2) { l2.color.setHex(0x93c5fd); l2.intensity = 1.2; }
        if (l3) { l3.color.setHex(0x64748b); l3.intensity = 0.8; }
        break;

      case 'sunset_warm':
        scene.background = new THREE.Color(0x180d08);
        if (grid) {
          (grid.material as THREE.LineBasicMaterial).color.setHex(0xf59e0b);
        }
        if (amb) { amb.color.setHex(0xffedd5); amb.intensity = 0.8; }
        if (l1) { l1.color.setHex(0xfef3c7); l1.intensity = 2.6; }
        if (l2) { l2.color.setHex(0xf97316); l2.intensity = 1.8; }
        if (l3) { l3.color.setHex(0xd97706); l3.intensity = 1.4; }
        break;

      case 'neon_cyber':
        scene.background = new THREE.Color(0x080312);
        if (grid) {
          (grid.material as THREE.LineBasicMaterial).color.setHex(0xa855f7);
        }
        if (amb) { amb.color.setHex(0xe879f9); amb.intensity = 0.7; }
        if (l1) { l1.color.setHex(0xf0abfc); l1.intensity = 2.2; }
        if (l2) { l2.color.setHex(0x06b6d4); l2.intensity = 2.0; } // Cyan
        if (l3) { l3.color.setHex(0xec4899); l3.intensity = 1.5; } // Magenta
        break;

      case 'dark_studio':
      default:
        scene.background = new THREE.Color(0x090d16);
        if (grid) {
          (grid.material as THREE.LineBasicMaterial).color.setHex(0x0284c7);
        }
        if (amb) { amb.color.setHex(0xffffff); amb.intensity = 0.9; }
        if (l1) { l1.color.setHex(0xfff8ee); l1.intensity = 2.4; }
        if (l2) { l2.color.setHex(0x60a5fa); l2.intensity = 1.5; }
        if (l3) { l3.color.setHex(0x38bdf8); l3.intensity = 0.9; }
        break;
    }
  }, [visualOptions.backgroundStyle]);

  // Apply Shading Mode across all meshes safely without breaking Three.js Color object listeners
  // Includes Toon Shading with prominent black inked edges along plane junctions (EdgesGeometry)
  // Extreme Mirror Chrome with Procedural Studio Reflection Map & Realtime Raytracing Probe
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const sm = visualOptions.shadingMode || 'standard';
    const isHeatmap = visualOptions.showHeatmap;

    // Mobile & Performance: Completely disable shadow pass during wireframe mode to guarantee 60fps on V12
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = sm !== 'wireframe';
    }

    // Exaggerated Chrome Studio Environment: attach ultra-high brilliance PMREM reflection map
    if (sm === 'exaggerated_metallic' && chromeEnvMapRef.current) {
      scene.environment = chromeEnvMapRef.current;
    } else {
      scene.environment = null;
    }

    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material &&
        !child.name.startsWith('exhaust_flame') &&
        child.name !== 'toon_edge_line'
      ) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat || !mat.color) return;

        // Manage Toon Black Inked Edge Line: ONLY instantiate EdgesGeometry when Toon mode is active
        // This avoids heavy geometry calculation when switching to wireframe or standard
        let edgeLine = child.children.find((c) => c.name === 'toon_edge_line') as THREE.LineSegments | undefined;
        if (sm === 'toon') {
          if (!edgeLine && child.geometry) {
            try {
              const edgesGeo = new THREE.EdgesGeometry(child.geometry, 20);
              const edgeMat = new THREE.LineBasicMaterial({
                color: 0x000000, // Rich black outline ink
                linewidth: 2,
                depthTest: true,
              });
              edgeLine = new THREE.LineSegments(edgesGeo, edgeMat);
              edgeLine.name = 'toon_edge_line';
              child.add(edgeLine);
            } catch (e) {
              console.error('Failed to create edges geometry', e);
            }
          }
          if (edgeLine) edgeLine.visible = true;
        } else {
          if (edgeLine) edgeLine.visible = false;
        }

        // Wireframe toggle
        mat.wireframe = sm === 'wireframe';

        if (!isHeatmap) {
          if (sm === 'exaggerated_metallic') {
            // User request: 極大メタリックはもっとわざとらしいくらいギラギラ銀色クロームメッキテクスチャにせよ、可能であればリアルタイムレイトレーシング
            // 100% Pure Optical Mirror Chrome with Dynamic Realtime Reflection Probe (CubeCamera)
            mat.metalness = 1.0; // Pure solid metal
            mat.roughness = 0.0; // Optical perfection, zero haze / 100% sharp mirror reflection
            mat.envMapIntensity = 3.6; // Blinding, exaggerated show-car luster
            if (cubeRenderTargetRef.current) {
              mat.envMap = cubeRenderTargetRef.current.texture;
            } else if (chromeEnvMapRef.current) {
              mat.envMap = chromeEnvMapRef.current;
            }

            if (child.name === 'bronze_bushing') {
              mat.color.setHex(0xfbbf24); // Pure mirror polished gold
              if (mat.emissive) mat.emissive.setHex(0x1a1202);
            } else if (child.name === 'piston_ring' || child.name === 'rod_bolt') {
              mat.color.setHex(0x94a3b8); // Polished platinum/titanium accent
              if (mat.emissive) mat.emissive.setHex(0x0a0a0a);
            } else {
              // Pistons, rods, crankshaft counterweights, journals, valves, block
              mat.color.setHex(0xffffff); // Sterling silver mirror chrome
              if (mat.emissive) mat.emissive.setHex(0x18181b);
            }
          } else {
            // Reset envMap for standard / toon / wireframe to preserve authentic baseline lighting
            mat.envMap = null;
            mat.envMapIntensity = 1.0;

            if (sm === 'toon') {
              // Cel-shaded / Anime technical look with high-contrast surfaces framed by black outlines
              if (child.name === 'bronze_bushing') {
                mat.color.setHex(0xfbbf24);
              } else if (child.name === 'piston_ring' || child.name === 'rod_bolt') {
                mat.color.setHex(0x1e293b);
              } else if (child.name === 'wrist_pin') {
                mat.color.setHex(0x93c5fd);
              } else {
                mat.color.setHex(0xf1f5f9);
              }
              mat.metalness = 0.02;
              mat.roughness = 0.65; // Matte cel finish so black outlines pop prominently
              if (mat.emissive) mat.emissive.setHex(0x000000);
            } else if (sm === 'wireframe') {
              if (child.name === 'bronze_bushing') {
                mat.color.setHex(0xfacc15);
              } else {
                mat.color.setHex(0x38bdf8);
              }
              mat.metalness = 0.5;
              mat.roughness = 0.5;
              if (mat.emissive) mat.emissive.setHex(0x000000);
            } else {
              // standard (authentic forged metals)
              if (child.name === 'bronze_bushing') {
                mat.color.setHex(0xd97706);
                mat.metalness = 0.90;
                mat.roughness = 0.22;
              } else if (child.name === 'piston_ring') {
                mat.color.setHex(0x1e293b);
                mat.metalness = 0.92;
                mat.roughness = 0.15;
              } else if (child.name === 'rod_bolt') {
                mat.color.setHex(0x334155);
                mat.metalness = 0.88;
                mat.roughness = 0.25;
              } else if (child.name === 'wrist_pin') {
                mat.color.setHex(0x94a3b8);
                mat.metalness = 0.88;
                mat.roughness = 0.22;
              } else {
                mat.color.setHex(0xd1d5db);
                mat.metalness = 0.88;
                mat.roughness = 0.25;
              }
              if (mat.emissive) mat.emissive.setHex(0x000000);
            }
          }
        }
        mat.needsUpdate = true;
      }
    });
  }, [visualOptions.shadingMode, visualOptions.showHeatmap, config.layout, config.cylinderCount, config.vAngleDeg]);

  // Animation Loop (Synchronized with physics telemetry and exact 3D transforms)
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const { crankAngleDeg, cylinders } = telemetry;
      const crankRad = (crankAngleDeg * Math.PI) / 180;

      // 1. Rotate Crankshaft
      if (crankshaftGroupRef.current) {
        crankshaftGroupRef.current.rotation.z = -crankRad;
        crankshaftGroupRef.current.updateMatrixWorld(true);
      }

      // 2. Exploded View Expansion with Easing & Smooth Animation Transition
      const targetExp = visualOptions.explodedProgress;
      const curExp = smoothExplodedProgressRef.current;
      const expDelta = targetExp - curExp;
      if (Math.abs(expDelta) > 0.0001) {
        smoothExplodedProgressRef.current += expDelta * 0.14;
      } else {
        smoothExplodedProgressRef.current = targetExp;
      }

      const easingKey = visualOptions.explodedEasing || 'cubic';
      const easingFn = EXPLODED_EASING_FUNCTIONS[easingKey] || EXPLODED_EASING_FUNCTIONS.cubic;
      const exp = Math.max(0, easingFn(smoothExplodedProgressRef.current));

      if (explodedGroupsRef.current) {
        const { blockGroup, headGroup, coverGroup, exhaustGroup, waterJacketGroup, crankshaftAssemblyGroup } =
          explodedGroupsRef.current;

        if (config.layout === 'boxer') {
          // Boxer: horizontally opposed expansion along X, crank remains centered at Y=0
          blockGroup.position.set(0, 0, 0);
          headGroup.position.set(exp * 1.8, 0, 0);
          coverGroup.position.set(exp * 2.8, 0, 0);
          exhaustGroup.position.set(0, -exp * 1.8, 0);
          waterJacketGroup.position.set(0, 0, 0);
          crankshaftAssemblyGroup.position.set(0, 0, 0);
        } else if (config.layout === 'v-type') {
          // V-type: cylinder heads separate along V banks, crank remains centered at Y=0 so all rod/piston paths stay collinear
          blockGroup.position.set(0, exp * 0.5, 0);
          headGroup.position.set(0, exp * 2.0, 0);
          coverGroup.position.set(0, exp * 3.2, 0);
          exhaustGroup.position.set(exp * 2.0, -exp * 0.4, 0);
          waterJacketGroup.position.set(0, exp * 0.5, 0);
          crankshaftAssemblyGroup.position.set(0, 0, 0);
        } else {
          // Inline: straight vertical expansion, crank drops downwards
          blockGroup.position.set(0, exp * 0.8, 0);
          headGroup.position.set(0, exp * 2.4, 0);
          coverGroup.position.set(0, exp * 3.6, 0);
          exhaustGroup.position.set(exp * 2.0, exp * 0.6, 0);
          waterJacketGroup.position.set(0, exp * 0.8, 0);
          crankshaftAssemblyGroup.position.set(0, -exp * 2.2, 0);
        }
      }

      // Realtime Raytracing Probe update: captures live engine self-reflections (piston, conrod, crank)
      // Throttled to alternating frames to guarantee smooth 60fps on mobile while rendering realtime reflections
      if (
        visualOptions.shadingMode === 'exaggerated_metallic' &&
        cubeCameraRef.current &&
        rendererRef.current &&
        sceneRef.current
      ) {
        cubeCameraFrameCountRef.current++;
        if (cubeCameraFrameCountRef.current % 2 === 0) {
          cubeCameraRef.current.position.set(0, 0, 0);
          cubeCameraRef.current.update(rendererRef.current, sceneRef.current);
        }
      }

      // 3 & 4. Move Conrods and Pistons with Exact Slider-Crank Kinematics + Physical Exploded Separation
      const conrodLen = 1.48; // Exactly matches conrod small-end offset
      const pinWorldPos = reusablePinPosRef.current;
      const isBoxer = config.layout === 'boxer';

      // Dynamic physical separation magnitudes along cylinder bore axis
      const pistonSepDist = exp * (config.layout === 'inline' ? 2.5 : isBoxer ? 2.6 : 2.4);
      const conrodSepDist = pistonSepDist * 0.45; // Conrod suspends midway along the bore axis

      conrodsRef.current.forEach((rod) => {
        const cylData = cylinders[rod.cylIndex];
        const piston = pistonsRef.current[rod.cylIndex];
        if (!cylData || !piston) return;

        // A. Exact World Position of the rotating Crankpin Journal
        rod.crankPinMesh.getWorldPosition(pinWorldPos);

        // B. Closed-form Slider-Crank solution along the cylinder bore axis
        const alpha = piston.bankAngleRad;
        // Strict trigonometry: for boxer, Y component is strictly 0.0
        const sinA = isBoxer ? (alpha > 0 ? 1 : -1) : Math.sin(alpha);
        const cosA = isBoxer ? 0 : Math.cos(alpha);

        // Projection of rotating crankpin center onto the cylinder bore axis:
        const bPrime = pinWorldPos.x * sinA + pinWorldPos.y * cosA;
        // Perpendicular distance squared from bore axis:
        const crankDistSq = pinWorldPos.x * pinWorldPos.x + pinWorldPos.y * pinWorldPos.y;
        const perpDistSq = Math.max(0, crankDistSq - bPrime * bPrime);

        // Exact distance from engine origin along bore axis to wrist pin center:
        const innerRad = Math.max(0.001, conrodLen * conrodLen - perpDistSq);
        const wristDistNormal = bPrime + Math.sqrt(innerRad);

        // Standard kinematic wrist pin coordinates:
        const normalWristX = sinA * wristDistNormal;
        const normalWristY = isBoxer ? 0 : cosA * wristDistNormal;

        // Physical Separation along bore axis for exploded view:
        // Even at 100% exploded view (exp = 1.0), components remain 100% dynamically synchronized
        // with the live crankshaft rotation and reciprocating piston stroke.
        // For Boxer, Y is strictly 0.0 at all times.
        const finalPistonX = sinA * (wristDistNormal + pistonSepDist);
        const finalPistonY = isBoxer ? 0 : cosA * (wristDistNormal + pistonSepDist);
        const wristZ = piston.basePos.z;

        // Position Piston directly at its dynamically moving exploded coordinates
        piston.mesh.position.set(finalPistonX, finalPistonY, wristZ);

        // Position Conrod along the bore axis offset from the rotating crankpin:
        // The big-end tracks the live rotating crankpin with an outward bore-axis offset
        const finalRodX = pinWorldPos.x + sinA * conrodSepDist;
        const finalRodY = isBoxer ? pinWorldPos.y : (pinWorldPos.y + cosA * conrodSepDist);
        const finalRodZ = pinWorldPos.z;
        rod.mesh.position.set(finalRodX, finalRodY, finalRodZ);

        // Rotate Conrod so its small end dynamically aims at the reciprocating Wrist Pin:
        // This ensures the conrod continues its authentic harmonic swing and stays 100% synchronized
        // with both the rotating crankpin and reciprocating piston in all engine layouts (Inline, Boxer, V-type)
        const dx = finalPistonX - finalRodX;
        const dy = finalPistonY - finalRodY;
        const angle = Math.atan2(dx, dy);
        rod.mesh.rotation.z = -angle;

        // F. Dynamic Full-Floating Wrist Pin Rotation
        // In real high-performance engines, the wrist pin floats freely in both the rod bushing and pin bosses.
        if (piston.wristPin) {
          const rodRelativeSwing = -angle - (-piston.bankAngleRad);
          const continuousCreep = (cylData.angleDeg * (Math.PI / 180)) * 0.32;
          piston.wristPin.rotation.z = rodRelativeSwing * 0.72 + continuousCreep;
        }

        // G. Heatmap Coloring (Only active when showHeatmap is enabled)
        if (visualOptions.showHeatmap) {
          const heatCol = getHeatmapColor(cylData.tempCelsius);
          piston.mesh.traverse((c) => {
            // Keep pin rotation indicators high-contrast even in heatmap mode
            if (
              c instanceof THREE.Mesh &&
              c.material &&
              c.name !== 'piston_ring' &&
              !c.parent?.name?.includes('wrist_pin')
            ) {
              const mat = c.material as THREE.MeshStandardMaterial;
              if (mat && mat.color) {
                mat.color.setHex(heatCol.getHex());
                if (mat.emissive) {
                  if (cylData.tempCelsius > 480) {
                    mat.emissive.setHex(heatCol.getHex()).multiplyScalar(0.4);
                  } else {
                    mat.emissive.setHex(0x000000);
                  }
                }
              }
            }
          });

          const rodTemp = Math.min(320, cylData.tempCelsius * 0.45);
          const rodCol = getHeatmapColor(rodTemp);
          rod.mesh.traverse((c) => {
            if (c instanceof THREE.Mesh && c.material) {
              const mat = c.material as THREE.MeshStandardMaterial;
              if (mat && mat.color) {
                mat.color.setHex(rodCol.getHex());
                if (mat.emissive) {
                  if (rodTemp > 240) {
                    mat.emissive.setHex(rodCol.getHex()).multiplyScalar(0.25);
                  } else {
                    mat.emissive.setHex(0x000000);
                  }
                }
              }
            }
          });
        }
      });

      // 5. Intake and Exhaust Valves timing
      intakeValvesRef.current.forEach((v) => {
        const cyl = cylinders[v.cylIndex];
        if (!cyl) return;
        const isIntakeOpen = cyl.angleDeg >= 15 && cyl.angleDeg <= 170;
        const lift = isIntakeOpen ? Math.sin(((cyl.angleDeg - 15) / 155) * Math.PI) * 0.12 : 0;
        v.mesh.position.x = v.basePos.x - Math.sin(v.bankAngleRad) * lift;
        v.mesh.position.y = v.basePos.y - Math.cos(v.bankAngleRad) * lift;
      });

      exhaustValvesRef.current.forEach((v) => {
        const cyl = cylinders[v.cylIndex];
        if (!cyl) return;
        const isExhOpen = cyl.angleDeg >= 540 && cyl.angleDeg <= 700;
        const lift = isExhOpen ? Math.sin(((cyl.angleDeg - 540) / 160) * Math.PI) * 0.12 : 0;
        v.mesh.position.x = v.basePos.x - Math.sin(v.bankAngleRad) * lift;
        v.mesh.position.y = v.basePos.y - Math.cos(v.bankAngleRad) * lift;
      });

      // 6. Combustion Explosions (Precision Synchronized with Spark BTDC 8° to ATDC 22°)
      explosionNodesRef.current.forEach((expNode) => {
        const cyl = cylinders[expNode.cylIndex];
        const piston = pistonsRef.current[expNode.cylIndex];
        if (!cyl) return;

        const isExploding = cyl.isIgniting && visualOptions.showExplosion !== false;
        if (isExploding) {
          // Flame envelope progression:
          // 352° to 360° (BTDC 8° to 0° TDC): Spark ignition & rapid flash rise (0 -> 1)
          // 360° to 382° (TDC to ATDC 22°): Power stroke flame expansion & dissipation (1 -> 0)
          const angle = cyl.angleDeg;
          let flameIntensity = 0;
          if (angle >= 352 && angle <= 360) {
            flameIntensity = (angle - 352) / 8; // 0.0 to 1.0
          } else if (angle > 360 && angle <= 382) {
            flameIntensity = Math.max(0, 1.0 - (angle - 360) / 22); // 1.0 to 0.0
          } else {
            flameIntensity = 0.5;
          }

          // Follow descending piston crown so the fireball physically expands between head and piston
          if (piston) {
            const headX = expNode.basePos.x;
            const headY = expNode.basePos.y;
            const pistX = piston.mesh.position.x;
            const pistY = piston.mesh.position.y;
            expNode.group.position.set(
              headX * 0.35 + pistX * 0.65,
              headY * 0.35 + pistY * 0.65,
              expNode.basePos.z
            );
          }

          // In exploded view, gracefully reduce flame opacity so mechanical component separation is clear
          const explodeFade = Math.max(0.05, 1.0 - exp * 0.85);
          expNode.sparkLight.intensity = 5.5 * Math.pow(flameIntensity, 0.7) * explodeFade;
          const scale = 0.6 + flameIntensity * 0.65;

          if (visualOptions.explosionEffect === 'metaball') {
            expNode.metaballMesh.visible = true;
            (expNode.metaballMesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * flameIntensity * explodeFade;
            expNode.metaballMesh.scale.setScalar(scale);
            expNode.particlePoints.visible = false;
          } else {
            expNode.metaballMesh.visible = false;
            expNode.particlePoints.visible = true;
            (expNode.particlePoints.material as THREE.PointsMaterial).opacity = 0.95 * flameIntensity * explodeFade;
            expNode.particlePoints.scale.setScalar(scale);
            expNode.particlePoints.rotation.y += 0.25;
          }
        } else {
          expNode.sparkLight.intensity = 0;
          expNode.metaballMesh.visible = false;
          expNode.particlePoints.visible = false;
        }
      });

      // 7. Dynamic Stage Lighting & Smoke Machine Update (Orbiting Crankshaft, RGB Color Shift, Fog)
      const lighting = visualOptions.lighting || DEFAULT_STAGE_LIGHTING;
      if (stageLightingGroupRef.current) {
        if (!lighting.enabled) {
          stageLightingGroupRef.current.visible = false;
          if (smokeParticlesRef.current) smokeParticlesRef.current.visible = false;
          if (sceneRef.current && sceneRef.current.fog) sceneRef.current.fog = null;
        } else {
          stageLightingGroupRef.current.visible = true;

          // A. Real-time Color Shift Calculation
          const nowSec = performance.now() * 0.001;
          const shiftSpeed = lighting.colorShiftSpeed || 1.0;
          const currentColor = currentLightColorRef.current;

          switch (lighting.colorShiftMode) {
            case 'rainbow': {
              const hue = (nowSec * 0.14 * shiftSpeed) % 1.0;
              currentColor.setHSL(hue, 0.95, 0.58);
              break;
            }
            case 'cyber_pulse': {
              const t = (Math.sin(nowSec * 1.6 * shiftSpeed) + 1) * 0.5;
              currentColor.set(0x00f0ff).lerp(new THREE.Color(0xff007f), t);
              break;
            }
            case 'sunset_glow': {
              const t = (Math.sin(nowSec * 1.2 * shiftSpeed) + 1) * 0.5;
              currentColor.set(0xffaa00).lerp(new THREE.Color(0xff1744), t);
              break;
            }
            case 'racing_shift': {
              const phase = (nowSec * 0.9 * shiftSpeed) % 3.0;
              if (phase < 1.0) {
                currentColor.set(0xffffff).lerp(new THREE.Color(0x00ff77), phase);
              } else if (phase < 2.0) {
                currentColor.set(0x00ff77).lerp(new THREE.Color(0xff1744), phase - 1.0);
              } else {
                currentColor.set(0xff1744).lerp(new THREE.Color(0xffffff), phase - 2.0);
              }
              break;
            }
            case 'deep_ocean': {
              const t = (Math.sin(nowSec * 1.3 * shiftSpeed) + 1) * 0.5;
              currentColor.set(0x0044ff).lerp(new THREE.Color(0x00ffcc), t);
              break;
            }
            case 'none':
            default: {
              currentColor.set(lighting.color || '#ffffff');
              break;
            }
          }

          // B. Orbit Position around Crankshaft (horizontal, vertical, tilt ±45°)
          if (lighting.autoRotate) {
            accumulatedLightAngleRef.current += 0.015 * (lighting.rotationSpeed || 1.0);
          }
          const manualRad = ((lighting.manualAngleDeg || 0) * Math.PI) / 180;
          const theta = accumulatedLightAngleRef.current + manualRad;
          const dist = lighting.distance || 6.2;
          let kx = 0;
          let ky = 0;
          let kz = 0;

          switch (lighting.plane) {
            case 'vertical':
              kx = Math.sin(theta) * dist;
              ky = Math.cos(theta) * dist;
              kz = 1.6;
              break;
            case 'tilt_pos45':
              kx = Math.sin(theta) * dist;
              ky = Math.cos(theta) * 0.707 * dist + 1.2;
              kz = Math.cos(theta) * 0.707 * dist;
              break;
            case 'tilt_neg45':
              kx = Math.sin(theta) * dist;
              ky = -Math.cos(theta) * 0.707 * dist + 1.2;
              kz = Math.cos(theta) * 0.707 * dist;
              break;
            case 'horizontal':
            default:
              kx = Math.sin(theta) * dist;
              ky = 1.8 + Math.sin(theta * 0.5) * 0.6;
              kz = Math.cos(theta) * dist;
              break;
          }

          // C. Update Key Light
          if (stageKeyLightRef.current) {
            const keyLight = stageKeyLightRef.current;
            keyLight.position.set(kx, ky, kz);
            keyLight.target.position.set(0, 0, 0);
            keyLight.color.copy(currentColor);
            keyLight.intensity = lighting.intensity || 3.0;
          }

          // D. Multiple Light Sources (Rim Light & Fill Light)
          if (stageRimLightRef.current) {
            const rimLight = stageRimLightRef.current;
            if (lighting.multiLightEnabled) {
              rimLight.visible = true;
              rimLight.position.set(-kx * 0.85, -ky * 0.35 + 1.5, -kz * 0.85);
              rimLight.target.position.set(0, 0, 0);
              const rimColor = currentColor.clone().offsetHSL(0.35, 0, 0.1);
              rimLight.color.copy(rimColor);
              rimLight.intensity = (lighting.intensity || 3.0) * 0.65;
            } else {
              rimLight.visible = false;
            }
          }

          if (stageFillLightRef.current) {
            const fillLight = stageFillLightRef.current;
            if (lighting.multiLightEnabled) {
              fillLight.visible = true;
              fillLight.position.set(0, dist * 0.85, 0);
              fillLight.target.position.set(0, 0, 0);
              fillLight.color.copy(currentColor);
              fillLight.intensity = (lighting.intensity || 3.0) * 0.35;
            } else {
              fillLight.visible = false;
            }
          }

          // E. Beacon Sphere & Volumetric Light Beam Cone
          if (stageLightBeaconRef.current) {
            const beacon = stageLightBeaconRef.current;
            beacon.visible = !!lighting.showLightGizmo;
            beacon.position.set(kx, ky, kz);
            (beacon.material as THREE.MeshBasicMaterial).color.copy(currentColor);
          }

          if (stageLightConeRef.current) {
            const cone = stageLightConeRef.current;
            const showBeam = !!lighting.showLightGizmo || !!lighting.smokeEnabled;
            cone.visible = showBeam;
            if (showBeam) {
              cone.position.set(kx, ky, kz);
              cone.lookAt(0, 0, 0);
              const beamLength = Math.sqrt(kx * kx + ky * ky + kz * kz);
              cone.scale.set(1, 1, beamLength / 10);
              const coneMat = cone.material as THREE.MeshBasicMaterial;
              coneMat.color.copy(currentColor);
              coneMat.opacity = lighting.smokeEnabled
                ? Math.min(0.28, (lighting.smokeDensity || 0.03) * 6.0)
                : 0.06;
            }
          }

          // F. Smoke Machine Fog (Atmospheric Room Illumination)
          if (sceneRef.current) {
            if (lighting.smokeEnabled) {
              const density = lighting.smokeDensity || 0.032;
              if (!sceneRef.current.fog || !(sceneRef.current.fog instanceof THREE.FogExp2)) {
                sceneRef.current.fog = new THREE.FogExp2(currentColor.getHex(), density);
              } else {
                sceneRef.current.fog.color.copy(currentColor);
                (sceneRef.current.fog as THREE.FogExp2).density = density;
              }
            } else {
              if (sceneRef.current.fog) {
                sceneRef.current.fog = null;
              }
            }
          }

          // G. Smoke Particle Cloud Floating Animation
          if (smokeParticlesRef.current && smokeVelocitiesRef.current) {
            const smoke = smokeParticlesRef.current;
            smoke.visible = !!lighting.smokeEnabled;
            if (lighting.smokeEnabled) {
              const posAttr = smoke.geometry.attributes.position as THREE.BufferAttribute;
              const posArray = posAttr.array as Float32Array;
              const velArray = smokeVelocitiesRef.current;
              for (let i = 0; i < posArray.length / 3; i++) {
                posArray[i * 3 + 0] += velArray[i * 3 + 0];
                posArray[i * 3 + 1] += velArray[i * 3 + 1];
                posArray[i * 3 + 2] += velArray[i * 3 + 2];

                if (posArray[i * 3 + 1] > 4.5) {
                  posArray[i * 3 + 1] = -2.2;
                  posArray[i * 3 + 0] = (Math.random() - 0.5) * 9;
                  posArray[i * 3 + 2] = (Math.random() - 0.5) * 9;
                }
              }
              posAttr.needsUpdate = true;
              (smoke.material as THREE.PointsMaterial).color.copy(currentColor);
            }
          }
        }
      }

      // Render Scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    telemetry,
    config.strokeMm,
    config.layout,
    visualOptions.explodedProgress,
    visualOptions.explodedEasing,
    visualOptions.explosionEffect,
    visualOptions.showHeatmap,
    visualOptions.showExplosion,
    visualOptions.lighting,
  ]);

  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ WebkitTouchCallout: 'none' }}
      />

      {/* Floating Quick Selector Bar (Top-Left): Background Style & Shader Texture */}
      {onUpdateVisualOptions && (
        <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2 pointer-events-none">
          {!isStyleMenuOpen ? (
            <button
              id="style-menu-expand-btn"
              type="button"
              onClick={() => setIsStyleMenuOpen(true)}
              title="3D表示・テクスチャ・背景設定を展開"
              className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/85 hover:bg-slate-800 text-sm text-slate-200 border border-slate-700/80 backdrop-blur-md shadow-xl transition-all active:scale-95"
            >
              <span>🎨</span>
            </button>
          ) : (
            <div className="pointer-events-auto bg-slate-900/90 hover:bg-slate-900/95 border border-slate-700/80 rounded-2xl backdrop-blur-md p-2.5 shadow-2xl transition-all max-w-[calc(100vw-2rem)]">
              {/* Toggle header: Entire bar is clickable to collapse */}
              <div
                onClick={() => setIsStyleMenuOpen(false)}
                className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 group-hover:text-white transition">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>3D表示・テクスチャ・背景</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStyleMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition border border-slate-700"
                >
                  <span>閉じる</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>

              {/* Quick Switcher Controls */}
              <div className="flex flex-col gap-2.5 mt-2.5">
              {/* Shading Mode (テクスチャ / シェーダー) */}
              <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>質感 / シェーダー</span>
                </div>
                <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
                  {[
                    { id: 'standard' as ShadingMode, label: '標準メタル', icon: '⚙️' },
                    { id: 'exaggerated_metallic' as ShadingMode, label: '極大メタリック', icon: '✨' },
                    { id: 'toon' as ShadingMode, label: 'トゥーンシェード', icon: '🎨' },
                    { id: 'wireframe' as ShadingMode, label: 'ワイヤフレーム', icon: '📐' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onUpdateVisualOptions({ shadingMode: mode.id })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                        visualOptions.shadingMode === mode.id
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-300'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Style (背景切り替え) */}
              <div className="flex flex-col gap-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-cyan-400" />
                  <span>背景スタジオ</span>
                </div>
                <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap">
                  {[
                    { id: 'dark_studio' as BackgroundStyle, label: 'ダーク', icon: '🌙' },
                    { id: 'carbon_garage' as BackgroundStyle, label: 'カーボン', icon: '🏁' },
                    { id: 'clean_white' as BackgroundStyle, label: 'CAD白', icon: '⚪' },
                    { id: 'sunset_warm' as BackgroundStyle, label: '夕暮れ', icon: '🌅' },
                    { id: 'neon_cyber' as BackgroundStyle, label: 'ネオン', icon: '⚡' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => onUpdateVisualOptions({ backgroundStyle: bg.id })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                        visualOptions.backgroundStyle === bg.id
                          ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                      }`}
                    >
                      <span>{bg.icon}</span>
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Stage Lighting Quick Controls (オンオフボタンと下部舞台照明へのショートカットのみ) */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <div className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-300" />
                    <span>3D舞台照明</span>
                  </div>
                  <span className={`text-[10px] font-mono ${visualOptions.lighting?.enabled ?? true ? 'text-amber-400' : 'text-slate-500'}`}>
                    {visualOptions.lighting?.enabled ?? true ? '点灯中' : '消灯中'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Master On/Off Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const currentLighting = visualOptions.lighting || DEFAULT_STAGE_LIGHTING;
                      onUpdateVisualOptions?.({
                        lighting: { ...currentLighting, enabled: !(currentLighting.enabled ?? true) },
                      });
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                      (visualOptions.lighting?.enabled ?? true)
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (visualOptions.lighting?.enabled ?? true) ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span>{(visualOptions.lighting?.enabled ?? true) ? '照明 ON' : '照明 OFF'}</span>
                  </button>

                  {/* Shortcut Button to Bottom Stage Lighting Panel */}
                  {onOpenStageLighting && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsStyleMenuOpen(false);
                        onOpenStageLighting();
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 hover:text-white border border-amber-600/50 text-xs font-medium transition flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm"
                      title="下部メニューの「ビュー」→「舞台照明」保存・JSON・詳細調光パネルを開く"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>保存 & JSON</span>
                      <span className="text-amber-400 text-xs">↗</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
};
