# ガソリンエンジンシミュレーター PWA Cloudflare Pages 公開ガイド

本プロジェクトは **Vite + React + Three.js + vite-plugin-pwa** で構成されており、すでに完全なPWA化とCloudflare Pages向けの最適化設定（SPAリダイレクト・ヘッダー・アイコン群）が完了しています。

---

## 🚀 ステップ1: GitHubへプッシュする

ローカルのGit初期化および全ファイルのコミットはすでに完了しています。以下の手順でGitHubリポジトリにプッシュします。

1. **GitHubで新しいリポジトリを作成**
   - [GitHub](https://github.com/new) にアクセスし、リポジトリを作成します（例: `gas-engine-simulator`）。
   - ※「Initialize with README」などのチェックは外した状態で作成してください。

2. **リモートリポジトリを追加してプッシュ**
   ターミナルで以下のコマンドを実行します（`<YOUR_ACCOUNT>` をご自身のGitHubユーザー名に置き換えてください）：

   ```bash
   git remote add origin https://github.com/<YOUR_ACCOUNT>/gas-engine-simulator.git
   git push -u origin main
   ```

---

## ☁️ ステップ2: Cloudflare Pages に接続・自動デプロイ

Cloudflare PagesのGit連携を使用すると、GitHubにプッシュするだけで自動ビルド・全世界エッジへの高速配信が行われます。

1. **Cloudflare ダッシュボードにログイン**
   - [Cloudflare Dashboard](https://dash.cloudflare.com/) を開きます。

2. **Pages プロジェクトの作成**
   - 左側メニューの **「Workers & Pages」** を選択。
   - **「作成」 (Create application)** ボタンをクリック → **「Pages」** タブを選択。
   - **「Git に接続」 (Connect to Git)** をクリック。

3. **リポジトリの選択**
   - ステップ1でプッシュした `gas-engine-simulator` リポジトリを選択して「セットアップの開始」をクリック。

4. **ビルド設定の入力**
   以下のように設定します：

   | 項目 | 設定値 |
   | :--- | :--- |
   | **プロジェクト名** | `gas-engine-simulator`（任意） |
   | **本番環境ブランチ** | `main` |
   | **フレームワーク プリセット** | `Vite` |
   | **ビルド コマンド** | `npm run build` |
   | **ビルド出力ディレクトリ** | `dist` |

5. **環境変数の追加（推奨）**
   「環境変数」セクションを展開し、以下を追加します：
   - 変数名: `NODE_VERSION`
   - 値: `20` または `22`

6. **「保存してデプロイ」をクリック**
   - 数十秒でビルドが完了し、`https://gas-engine-simulator.pages.dev` のような公開URLが即座に発行されます。
   - 今後は `main` ブランチにコミットをプッシュするたびに自動で再デプロイされます。

---

## 📱 ステップ3: PWA としてのインストールと利用方法

Cloudflare Pagesで発行されたURL（HTTPS）にアクセスすると、自動的にPWAとして認識されます。

- **PC (Google Chrome / Edge / Brave)**:
  - 画面右上の **「アプリをインストール」** ボタンをクリック、またはブラウザのアドレスバー右端に表示されるインストールアイコンをクリックしてインストールできます。
- **Android スマートフォン**:
  - 画面上部の **「アプリをインストール」** ボタンをクリック、またはChromeメニューから「ホーム画面に追加」を選択。全画面のネイティブアプリとしてインストールされます。
- **iOS (iPhone / iPad - Safari)**:
  - 画面右上の **「ホーム画面に追加」** ボタンをクリックすると手順ガイドが表示されます。
  - Safariの **共有ボタン (四角と上矢印)** → **「ホーム画面に追加」** をタップすると、アプリアイコン付きでインストールされます。

---

## 🛠️ 本リポジトリに実装済みのPWA & Cloudflare最適化

- **Service Worker & オフラインキャッシュ**:
  - `vite-plugin-pwa` (Workbox) により、3Dレンダリングエンジン・熱力学物理モデル・照明プリセットなど全資産が端末にキャッシュされます。
  - 電波の届かないオフライン環境・機内モードでも100%滑らかにシミュレーションが動作します。
- **高解像度PWAアイコン一式**:
  - `pwa-192x192.png`: Android / ホーム画面用
  - `pwa-512x512.png`: スプラッシュスクリーン用高解像度アイコン
  - `pwa-maskable-512x512.png`: Androidのアダプティブアイコン（セーフゾーン余白対応）
  - `apple-touch-icon.png` (180x180): iOS Safari専用アイコン
- **Cloudflare Pages SPA対応 (`public/_redirects`)**:
  - `/*    /index.html   200` を設定済み。ブラウザをリロードしたり別パスに遷移しても404にならずSPAとして正常に動作します。
- **PWAヘッダー最適化 (`public/_headers`)**:
  - Service Worker (`sw.js`) とマニフェスト (`manifest.webmanifest`) のキャッシュを常に最新に保ち、アップデートが即座にユーザー端末に届くよう制御しています。
