import React, { useState, useRef, useEffect } from 'react';
import { EngineTelemetry, EngineConfig } from '../types/engine';
import { PerformanceGraphs } from './PerformanceGraphs';
import { X, Maximize2, Minimize2, Move, Layers } from 'lucide-react';

interface FloatingGraphWindowProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: EngineTelemetry;
  config: EngineConfig;
}

export const FloatingGraphWindow: React.FC<FloatingGraphWindowProps> = ({
  isOpen,
  onClose,
  telemetry,
  config,
}) => {
  // Floating position state (px from top-left)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Default initial position on right side or center
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 480) : 100;
    return { x: defaultX, y: 70 };
  });

  // Floating window dimension state - matching graph aspect ratio
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 460,
    height: 270,
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
  });

  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number }>({
    mouseX: 0,
    mouseY: 0,
    startW: 0,
    startH: 0,
  });

  // Clamp position within window bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(10, prev.x), Math.max(10, window.innerWidth - 120)),
        y: Math.min(Math.max(10, prev.y), Math.max(10, window.innerHeight - 80)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag Movement Event Handlers
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    // Only trigger drag if clicked on header (not on buttons)
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(8, Math.min(window.innerWidth - 120, dragStartRef.current.posX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - 60, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      const newW = Math.max(340, Math.min(window.innerWidth - position.x - 10, resizeStartRef.current.startW + dx));
      const newH = Math.max(180, Math.min(window.innerHeight - position.y - 10, resizeStartRef.current.startH + dy));
      setSize({ width: newW, height: newH });
    }
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer capture release error
      }
    }
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Resize Drag Handlers
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  if (!isOpen) return null;

  return (
    <div
      id="floating-performance-graph-window"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '260px' : `${Math.min(size.width, window.innerWidth - position.x - 12)}px`,
        height: isMinimized ? 'auto' : `${Math.min(size.height, window.innerHeight - position.y - 12)}px`,
        zIndex: 45,
      }}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUpDrag}
      className={`flex flex-col bg-slate-900/95 border border-sky-500/40 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden transition-shadow select-none ${
        isDragging ? 'shadow-sky-500/30 ring-2 ring-sky-400 cursor-grabbing' : 'ring-1 ring-slate-700/80'
      }`}
    >
      {/* Draggable Minimal Title Bar */}
      <div
        onPointerDown={handlePointerDownDrag}
        className="flex items-center justify-between px-2.5 py-1 bg-slate-950/90 border-b border-slate-800/80 cursor-grab active:cursor-grabbing text-[11px] font-semibold text-slate-300"
      >
        <div className="flex items-center gap-1.5">
          <Move className="w-3 h-3 text-sky-400 opacity-80" />
          <span className="font-semibold text-slate-200">性能グラフ</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-800/50 font-mono">
            {telemetry.rpm} rpm
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            title={isMinimized ? 'ウィンドウを展開' : '最小化'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>

          {/* Close Window (One-Button Close requested by user) */}
          <button
            type="button"
            onClick={onClose}
            title="フローティングウィンドウを閉じる"
            className="p-1 rounded text-slate-400 hover:text-rose-300 hover:bg-rose-950/80 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area (when not minimized): Only Graph Tabs & Graph Body */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 text-xs text-slate-200">
          <PerformanceGraphs
            telemetry={telemetry}
            config={config}
            isFloatingMode={true}
            onCloseFloating={onClose}
          />
        </div>
      )}

      {/* Resizing Handle (Bottom Right Corner) */}
      {!isMinimized && (
        <div
          onPointerDown={handlePointerDownResize}
          title="ドラッグしてサイズを変更"
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize flex items-end justify-end p-0.5 z-10"
        >
          <svg className="w-2 h-2 text-slate-500 hover:text-sky-400 transition" viewBox="0 0 10 10">
            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
};
