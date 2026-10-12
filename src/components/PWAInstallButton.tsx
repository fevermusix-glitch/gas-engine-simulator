import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>アプリをインストール</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ホーム画面に追加</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold text-sm text-sky-400">iOS ホーム画面に追加 (PWA)</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                1. Safariブラウザ下部の <Share className="w-4 h-4 inline text-sky-400 mx-1" /> <strong>共有ボタン</strong> をタップします。<br />
                2. メニューをスクロールして <strong>「ホーム画面に追加」</strong> を選択します。<br />
                3. アプリ単体として全画面・軽量で起動できるようになります。
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
