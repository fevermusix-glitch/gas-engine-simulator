import {
  StageLightingOptions,
  BackgroundStyle,
  DEFAULT_STAGE_LIGHTING,
  MASTER_LIGHTING_PRESETS,
} from '../types/engine';

export interface SavedLightingProfile {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
  lighting: StageLightingOptions;
  backgroundStyle?: BackgroundStyle;
  isBuiltin?: boolean;
}

export interface LightingJsonExport {
  format: 'gas_engine_lighting_profile';
  version: 1;
  exportedAt: string;
  profile: {
    name: string;
    lighting: StageLightingOptions;
    backgroundStyle?: BackgroundStyle;
  };
}

export interface LightingCollectionJsonExport {
  format: 'gas_engine_lighting_collection';
  version: 1;
  exportedAt: string;
  profiles: {
    name: string;
    lighting: StageLightingOptions;
    backgroundStyle?: BackgroundStyle;
    createdAt?: string;
  }[];
}

export const STORAGE_KEY_LIGHTING_PROFILES = 'gas_engine_saved_lighting_profiles_v1';

// Initial built-in library derived from master presets
export const BUILTIN_LIGHTING_PROFILES: SavedLightingProfile[] = MASTER_LIGHTING_PRESETS.map((preset, idx) => ({
  id: `builtin_${preset.id}`,
  name: `${preset.icon} ${preset.name}`,
  createdAt: new Date(Date.now() - (MASTER_LIGHTING_PRESETS.length - idx) * 3600000).toISOString(),
  lighting: {
    ...DEFAULT_STAGE_LIGHTING,
    ...preset.options,
    enabled: true,
  },
  backgroundStyle:
    preset.id === 'cyberpunk_arena'
      ? 'neon_cyber'
      : preset.id === 'sunset_canyon'
      ? 'sunset_warm'
      : preset.id === 'racing_night_pit'
      ? 'carbon_garage'
      : 'dark_studio',
  isBuiltin: true,
}));

/**
 * Validates and sanitizes unknown raw objects into a safe, valid StageLightingOptions
 */
export function sanitizeLightingOptions(raw: unknown): StageLightingOptions {
  const def = DEFAULT_STAGE_LIGHTING;
  if (!raw || typeof raw !== 'object') {
    return { ...def };
  }
  const obj = raw as Record<string, unknown>;

  const validPlanes = ['horizontal', 'vertical', 'tilt_pos45', 'tilt_neg45'];
  const plane =
    typeof obj.plane === 'string' && validPlanes.includes(obj.plane)
      ? (obj.plane as StageLightingOptions['plane'])
      : def.plane;

  const validShiftModes = ['none', 'rainbow', 'cyber_pulse', 'sunset_glow', 'racing_shift', 'deep_ocean'];
  const colorShiftMode =
    typeof obj.colorShiftMode === 'string' && validShiftModes.includes(obj.colorShiftMode)
      ? (obj.colorShiftMode as StageLightingOptions['colorShiftMode'])
      : def.colorShiftMode;

  const color =
    typeof obj.color === 'string' && /^#([0-9a-fA-F]{3}){1,2}$/.test(obj.color)
      ? obj.color
      : def.color;

  return {
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : true,
    plane,
    autoRotate: typeof obj.autoRotate === 'boolean' ? obj.autoRotate : def.autoRotate,
    rotationSpeed:
      typeof obj.rotationSpeed === 'number' && !isNaN(obj.rotationSpeed)
        ? Math.max(0.1, Math.min(5.0, obj.rotationSpeed))
        : def.rotationSpeed,
    manualAngleDeg:
      typeof obj.manualAngleDeg === 'number' && !isNaN(obj.manualAngleDeg)
        ? ((obj.manualAngleDeg % 360) + 360) % 360
        : def.manualAngleDeg,
    distance:
      typeof obj.distance === 'number' && !isNaN(obj.distance)
        ? Math.max(1.5, Math.min(25.0, obj.distance))
        : def.distance,
    intensity:
      typeof obj.intensity === 'number' && !isNaN(obj.intensity)
        ? Math.max(0.1, Math.min(15.0, obj.intensity))
        : def.intensity,
    color,
    colorShiftMode,
    colorShiftSpeed:
      typeof obj.colorShiftSpeed === 'number' && !isNaN(obj.colorShiftSpeed)
        ? Math.max(0.1, Math.min(5.0, obj.colorShiftSpeed))
        : def.colorShiftSpeed,
    smokeEnabled: typeof obj.smokeEnabled === 'boolean' ? obj.smokeEnabled : def.smokeEnabled,
    smokeDensity:
      typeof obj.smokeDensity === 'number' && !isNaN(obj.smokeDensity)
        ? Math.max(0.002, Math.min(0.15, obj.smokeDensity))
        : def.smokeDensity,
    multiLightEnabled: typeof obj.multiLightEnabled === 'boolean' ? obj.multiLightEnabled : def.multiLightEnabled,
    showLightGizmo: typeof obj.showLightGizmo === 'boolean' ? obj.showLightGizmo : def.showLightGizmo,
  };
}

/**
 * Loads all saved profiles from LocalStorage, falling back to built-ins if empty
 */
export function loadSavedLightingProfiles(): SavedLightingProfile[] {
  if (typeof window === 'undefined') return BUILTIN_LIGHTING_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIGHTING_PROFILES);
    if (!raw) {
      saveLightingProfilesToStorage(BUILTIN_LIGHTING_PROFILES);
      return BUILTIN_LIGHTING_PROFILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        id: item.id || `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '無題の照明',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt,
        lighting: sanitizeLightingOptions(item.lighting),
        backgroundStyle: item.backgroundStyle,
        isBuiltin: Boolean(item.isBuiltin),
      }));
    }
  } catch (err) {
    console.warn('Failed to load saved lighting profiles, resetting to defaults', err);
  }
  return BUILTIN_LIGHTING_PROFILES;
}

/**
 * Saves profiles array to LocalStorage
 */
export function saveLightingProfilesToStorage(profiles: SavedLightingProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LIGHTING_PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('LocalStorage write failed for lighting profiles', err);
  }
}

/**
 * Triggers a client-side file download of JSON data
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to trigger JSON download', err);
  }
}

/**
 * Exports a single lighting profile to a clean JSON file
 */
export function exportLightingProfileAsJson(
  profile: { name: string; lighting: StageLightingOptions; backgroundStyle?: BackgroundStyle },
  customFilename?: string
): void {
  const exportPayload: LightingJsonExport = {
    format: 'gas_engine_lighting_profile',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: profile.name,
      lighting: sanitizeLightingOptions(profile.lighting),
      backgroundStyle: profile.backgroundStyle,
    },
  };

  const safeName = profile.name.replace(/[^a-zA-Z0-9_\-\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, '_').slice(0, 30);
  const filename = customFilename || `engine-lighting-${safeName || 'preset'}-${Date.now().toString().slice(-4)}.json`;
  downloadJsonFile(exportPayload, filename);
}

/**
 * Exports all saved profiles to a collection JSON file
 */
export function exportAllLightingProfilesAsJson(profiles: SavedLightingProfile[], customFilename?: string): void {
  const exportPayload: LightingCollectionJsonExport = {
    format: 'gas_engine_lighting_collection',
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((p) => ({
      name: p.name,
      lighting: sanitizeLightingOptions(p.lighting),
      backgroundStyle: p.backgroundStyle,
      createdAt: p.createdAt,
    })),
  };

  const filename = customFilename || `engine-lighting-presets-all-${Date.now().toString().slice(-6)}.json`;
  downloadJsonFile(exportPayload, filename);
}

export interface ParseResult {
  success: boolean;
  importedProfiles: SavedLightingProfile[];
  primaryProfile?: SavedLightingProfile;
  message: string;
}

/**
 * Parses and validates raw JSON text from a file into valid lighting profile(s)
 */
export function parseLightingJsonContent(rawText: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      success: false,
      importedProfiles: [],
      message: 'JSON形式の構文エラーです。正しいJSONファイルを選択してください。',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      importedProfiles: [],
      message: '有効なJSONオブジェクトではありません。',
    };
  }

  const obj = parsed as Record<string, unknown>;
  const now = new Date().toISOString();
  const importedList: SavedLightingProfile[] = [];

  // Case 1: Standard Gas Engine Collection export format
  if (obj.format === 'gas_engine_lighting_collection' && Array.isArray(obj.profiles)) {
    for (const item of obj.profiles) {
      if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        importedList.push({
          id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: typeof itemObj.name === 'string' && itemObj.name.trim() ? itemObj.name.trim() : 'インポート照明',
          createdAt: typeof itemObj.createdAt === 'string' ? itemObj.createdAt : now,
          lighting: sanitizeLightingOptions(itemObj.lighting),
          backgroundStyle: itemObj.backgroundStyle as BackgroundStyle | undefined,
        });
      }
    }
  }
  // Case 2: Standard Single Profile export format
  else if (obj.format === 'gas_engine_lighting_profile' && obj.profile && typeof obj.profile === 'object') {
    const p = obj.profile as Record<string, unknown>;
    importedList.push({
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'インポート照明',
      createdAt: now,
      lighting: sanitizeLightingOptions(p.lighting),
      backgroundStyle: p.backgroundStyle as BackgroundStyle | undefined,
    });
  }
  // Case 3: Raw array of profiles or lighting objects
  else if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        const lightingSource = itemObj.lighting ? itemObj.lighting : itemObj;
        importedList.push({
          id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: typeof itemObj.name === 'string' && itemObj.name.trim() ? itemObj.name.trim() : 'インポート照明',
          createdAt: now,
          lighting: sanitizeLightingOptions(lightingSource),
          backgroundStyle: itemObj.backgroundStyle as BackgroundStyle | undefined,
        });
      }
    }
  }
  // Case 4: Generic object with a `lighting` property
  else if (obj.lighting && typeof obj.lighting === 'object') {
    importedList.push({
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'インポート照明',
      createdAt: now,
      lighting: sanitizeLightingOptions(obj.lighting),
      backgroundStyle: obj.backgroundStyle as BackgroundStyle | undefined,
    });
  }
  // Case 5: Direct StageLightingOptions object (e.g. { enabled: true, plane: "horizontal", ... })
  else if ('plane' in obj || 'intensity' in obj || 'distance' in obj || 'color' in obj) {
    importedList.push({
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'インポート照明 (直接指定)',
      createdAt: now,
      lighting: sanitizeLightingOptions(obj),
      backgroundStyle: obj.backgroundStyle as BackgroundStyle | undefined,
    });
  } else {
    return {
      success: false,
      importedProfiles: [],
      message: '照明設定（lighting）のデータ構造が見つかりませんでした。',
    };
  }

  if (importedList.length === 0) {
    return {
      success: false,
      importedProfiles: [],
      message: '読み込み可能な照明データが含まれていませんでした。',
    };
  }

  return {
    success: true,
    importedProfiles: importedList,
    primaryProfile: importedList[0],
    message: `${importedList.length} 件の照明設定を正常に読み込みました。`,
  };
}
