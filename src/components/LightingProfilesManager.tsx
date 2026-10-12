import React, { useState, useEffect, useRef } from 'react';
import {
  StageLightingOptions,
  BackgroundStyle,
  LIGHT_ROTATION_PLANES,
  COLOR_SHIFT_PRESETS,
} from '../types/engine';
import {
  SavedLightingProfile,
  loadSavedLightingProfiles,
  saveLightingProfilesToStorage,
  exportLightingProfileAsJson,
  exportAllLightingProfilesAsJson,
  parseLightingJsonContent,
  sanitizeLightingOptions,
} from '../utils/lightingStorage';
import {
  Save,
  Download,
  Upload,
  FolderOpen,
  Sparkles,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Edit2,
  RotateCcw,
  Copy,
  Wind,
  Lightbulb,
  Disc,
} from 'lucide-react';

interface LightingProfilesManagerProps {
  currentLighting: StageLightingOptions;
  currentBackgroundStyle?: BackgroundStyle;
  onApplyLighting: (lighting: StageLightingOptions, backgroundStyle?: BackgroundStyle) => void;
}

export const LightingProfilesManager: React.FC<LightingProfilesManagerProps> = ({
  currentLighting,
  currentBackgroundStyle,
  onApplyLighting,
}) => {
  const [profiles, setProfiles] = useState<SavedLightingProfile[]>(() => loadSavedLightingProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'builtin'>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [autoApplyOnImport, setAutoApplyOnImport] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage whenever profiles list changes
  useEffect(() => {
    saveLightingProfilesToStorage(profiles);
  }, [profiles]);

  // Clear toast status message after 4.5 seconds
  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(null), 4500);
    return () => clearTimeout(t);
  }, [statusMessage]);

  // Handle saving the current lighting settings as a new profile
  const handleSaveCurrent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProfileName.trim() || `照明プリセット #${profiles.length + 1}`;

    const newProfile: SavedLightingProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      createdAt: new Date().toISOString(),
      lighting: sanitizeLightingOptions(currentLighting),
      backgroundStyle: currentBackgroundStyle,
      isBuiltin: false,
    };

    setProfiles((prev) => [newProfile, ...prev]);
    setNewProfileName('');
    setStatusMessage({
      text: `照明状態「${name}」を保存しました！リストからいつでも呼び出せます。`,
      type: 'success',
    });
  };

  // Quick export of the active live lighting
  const handleExportCurrent = () => {
    const defaultName = newProfileName.trim() || '現在の3D照明設定';
    exportLightingProfileAsJson({
      name: defaultName,
      lighting: currentLighting,
      backgroundStyle: currentBackgroundStyle,
    });
    setStatusMessage({
      text: `現在の照明設定を JSON ファイル（.json）として書き出しました。`,
      type: 'success',
    });
  };

  // Export a specific saved profile
  const handleExportSingle = (profile: SavedLightingProfile) => {
    exportLightingProfileAsJson(profile);
    setStatusMessage({
      text: `「${profile.name}」の JSON ファイルを書き出しました。`,
      type: 'success',
    });
  };

  // Export all profiles as a collection
  const handleExportAll = () => {
    exportAllLightingProfilesAsJson(profiles);
    setStatusMessage({
      text: `全 ${profiles.length} 件の照明プロファイルを一括 JSON 書き出ししました。`,
      type: 'success',
    });
  };

  // Process file upload / drop
  const handleProcessFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setStatusMessage({
        text: 'JSON形式のファイル (.json) を選択してください。',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const result = parseLightingJsonContent(text);
      if (!result.success || result.importedProfiles.length === 0) {
        setStatusMessage({
          text: result.message || 'JSONファイルの解析に失敗しました。',
          type: 'error',
        });
        return;
      }

      // Add to list avoiding exact duplicate IDs
      setProfiles((prev) => [...result.importedProfiles, ...prev]);

      // If auto-apply is enabled, activate the primary imported profile immediately
      if (autoApplyOnImport && result.primaryProfile) {
        onApplyLighting(result.primaryProfile.lighting, result.primaryProfile.backgroundStyle);
        setStatusMessage({
          text: `「${result.primaryProfile.name}」をJSONから読み込み、直ちに3D照明へ適用しました！`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: result.message,
          type: 'success',
        });
      }
    };

    reader.onerror = () => {
      setStatusMessage({
        text: 'ファイルの読み込み中にエラーが発生しました。',
        type: 'error',
      });
    };

    reader.readAsText(file, 'utf-8');
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Delete profile
  const handleDeleteProfile = (id: string, name: string) => {
    if (window.confirm(`照明設定「${name}」を削除してもよろしいですか？`)) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setStatusMessage({
        text: `「${name}」をリストから削除しました。`,
        type: 'info',
      });
    }
  };

  // Overwrite saved profile with current lighting
  const handleOverwriteWithCurrent = (id: string, name: string) => {
    if (window.confirm(`「${name}」を現在の照明設定で上書き保存しますか？`)) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                updatedAt: new Date().toISOString(),
                lighting: sanitizeLightingOptions(currentLighting),
                backgroundStyle: currentBackgroundStyle,
              }
            : p
        )
      );
      setStatusMessage({
        text: `「${name}」を現在の設定で上書き保存しました。`,
        type: 'success',
      });
    }
  };

  // Save renamed profile
  const handleSaveRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed, updatedAt: new Date().toISOString() } : p))
      );
    }
    setEditingProfileId(null);
    setEditingName('');
  };

  // Duplicate profile
  const handleDuplicate = (profile: SavedLightingProfile) => {
    const dup: SavedLightingProfile = {
      ...profile,
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${profile.name} (複製)`,
      createdAt: new Date().toISOString(),
      isBuiltin: false,
    };
    setProfiles((prev) => [dup, ...prev]);
    setStatusMessage({
      text: `「${profile.name}」を複製して保存しました。`,
      type: 'success',
    });
  };

  const filteredProfiles = profiles.filter((p) => {
    if (filterType === 'custom') return !p.isBuiltin;
    if (filterType === 'builtin') return Boolean(p.isBuiltin);
    return true;
  });

  return (
    <div className="flex flex-col gap-3.5 text-xs text-slate-200">
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Status / Toast Notification Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/80 text-rose-200'
              : 'bg-sky-950/80 border-sky-500/80 text-sky-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Top Action Box: Save Current Lighting & JSON Import/Export Bar */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="font-bold text-amber-200 flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>照明状態の保存・呼び出し & JSON書き出し・読み込み</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              3D周回軌道、RGB調光、スモーク、動的変化など全パラメータを完全記録。JSONでPC/スマホ間も自在に共有可能。
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            {/* JSON Export Current Active Button */}
            <button
              type="button"
              id="export-current-lighting-json-btn"
              onClick={handleExportCurrent}
              title="現在の3D照明設定を JSON ファイルとしてダウンロード"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/50 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>現在の照明をJSON書き出し</span>
            </button>

            {/* JSON Import Button */}
            <button
              type="button"
              id="import-lighting-json-btn"
              onClick={() => fileInputRef.current?.click()}
              title="JSONファイルをファイルシステムから読み込む"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/60 text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON読み込み</span>
            </button>
          </div>
        </div>

        {/* Save Form & Drag/Drop Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {/* Form to Save Current State into List */}
          <form
            onSubmit={handleSaveCurrent}
            className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="保存名を入力 (例: ナイトピット#1, サーキット特効)..."
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              id="save-current-lighting-profile-btn"
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>現在の照明をリストに保存</span>
            </button>
          </form>

          {/* Drag & Drop Zone for JSON */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed text-center cursor-pointer transition select-none ${
              isDragOver
                ? 'bg-purple-950/80 border-purple-400 text-purple-200 scale-[1.02]'
                : 'bg-slate-950/40 border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            <FileJson className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-slate-200">JSONをドラッグ＆ドロップ</span>
              <span className="block text-[9px] text-slate-400">またはクリックしてファイル選択</span>
            </div>
          </div>
        </div>

        {/* Import Preferences Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoApplyOnImport}
              onChange={(e) => setAutoApplyOnImport(e.target.checked)}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>JSON読み込み時に即座に3Dステージ照明へ適用する</span>
          </label>

          <button
            type="button"
            onClick={handleExportAll}
            className="flex items-center gap-1 hover:text-amber-300 transition text-[11px]"
            title="保存されているすべての照明設定を1つのJSONファイルとしてまとめてバックアップ"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>全リストを一括バックアップ (.json)</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & List Header */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>保存された照明プロファイル一覧</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
              {profiles.length}
            </span>
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded transition ${
              filterType === 'all'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            すべて ({profiles.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('custom')}
            className={`px-2 py-0.5 rounded transition ${
              filterType === 'custom'
                ? 'bg-amber-950 text-amber-300 font-bold border border-amber-600/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            カスタム ({profiles.filter((p) => !p.isBuiltin).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('builtin')}
            className={`px-2 py-0.5 rounded transition ${
              filterType === 'builtin'
                ? 'bg-purple-950 text-purple-300 font-bold border border-purple-600/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            マスター公式 ({profiles.filter((p) => p.isBuiltin).length})
          </button>
        </div>
      </div>

      {/* 3. Saved Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/30 border border-slate-800 text-center text-slate-400 space-y-2">
          <Sparkles className="w-6 h-6 mx-auto text-slate-600" />
          <p className="text-xs">該当する照明プロファイルがありません。</p>
          <p className="text-[10px] text-slate-500">
            上の入力欄から「現在の照明をリストに保存」するか、「JSON読み込み」からファイルをインポートしてください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredProfiles.map((profile) => {
            const planeInfo = LIGHT_ROTATION_PLANES.find((p) => p.id === profile.lighting.plane);
            const shiftInfo = COLOR_SHIFT_PRESETS.find((m) => m.id === profile.lighting.colorShiftMode);
            const isEditing = editingProfileId === profile.id;

            return (
              <div
                key={profile.id}
                className="group relative flex flex-col justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900/90 hover:border-amber-500/50 transition-all shadow-sm"
              >
                {/* Header: Name and Status */}
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    {/* Name or Edit Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(profile.id);
                            if (e.key === 'Escape') setEditingProfileId(null);
                          }}
                          autoFocus
                          className="flex-1 bg-slate-900 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(profile.id)}
                          className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                          title="確定"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                          style={{ backgroundColor: profile.lighting.color || '#ffffff' }}
                        />
                        <span className="font-bold text-xs text-slate-200 truncate" title={profile.name}>
                          {profile.name}
                        </span>
                        {!profile.isBuiltin && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfileId(profile.id);
                              setEditingName(profile.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-slate-300 transition"
                            title="名前を変更"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Builtin Badge or Timestamp */}
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">
                      {profile.isBuiltin ? (
                        <span className="px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                          公式
                        </span>
                      ) : (
                        new Date(profile.createdAt).toLocaleDateString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                        })
                      )}
                    </span>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-1 mb-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {planeInfo?.shortName || profile.lighting.plane}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                      光量 {profile.lighting.intensity.toFixed(1)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                      {profile.lighting.distance.toFixed(1)}m
                    </span>
                    {profile.lighting.colorShiftMode !== 'none' && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 text-purple-300">
                        {shiftInfo?.name.split(' ')[0] || '動的変化'}
                      </span>
                    )}
                    {profile.lighting.smokeEnabled && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 flex items-center gap-0.5">
                        <Wind className="w-2.5 h-2.5" />
                        <span>スモーク</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Apply, Export JSON, Overwrite, Delete */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/80">
                  {/* Primary Call / Apply Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onApplyLighting(profile.lighting, profile.backgroundStyle);
                      setStatusMessage({
                        text: `「${profile.name}」をステージ照明に適用しました。`,
                        type: 'success',
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold transition active:scale-95 shadow-sm"
                    title="この照明設定を3Dステージに適用"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>呼び出し・適用</span>
                  </button>

                  {/* Export Single Profile to JSON */}
                  <button
                    type="button"
                    onClick={() => handleExportSingle(profile)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 transition"
                    title="この照明をJSONファイルとして書き出し"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicate(profile)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800 transition"
                    title="プロファイルを複製"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Overwrite with current (custom profiles only) */}
                  {!profile.isBuiltin && (
                    <button
                      type="button"
                      onClick={() => handleOverwriteWithCurrent(profile.id, profile.name)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 transition"
                      title="現在の照明状態でこのプロファイルを上書き"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete (custom profiles only) */}
                  {!profile.isBuiltin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile.id, profile.name)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-500 hover:text-rose-300 border border-slate-800 hover:border-rose-700 transition"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
