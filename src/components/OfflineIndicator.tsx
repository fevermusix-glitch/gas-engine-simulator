import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-14 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-medium shadow-xl backdrop-blur-md animate-pulse"
      title="PWAオフライン対応: 3Dエンジン・熱力学物理・ライティングはオフラインでも完全動作します"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>オフライン動作中（PWAキャッシュ稼働）</span>
    </div>
  );
};
