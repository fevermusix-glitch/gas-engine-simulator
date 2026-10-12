# ガソリンエンジン3Dシミュレーター (Gasoline Engine 3D Simulator)

ブラウザ上で4ストローク内燃機関（直列・V型・水平対向ボクサー）の構造と物理挙動を直感的に学べる、高精度3D物理シミュレーター & PWA（Progressive Web App）です。

Three.js による滑らかな60fps 3Dレンダリング、オットーサイクルの熱力学物理演算、爆発燃焼・排気ガス・熱分布ヒートマップ、シリンダー分解図（Exploded View）、そして実在の名機プリセット（AE86の4A-GEU、レクサスLFAの1LR-GUE V10、ポルシェ911水平対向6気筒など）を搭載しています。

PCブラウザはもちろん、スマホ・タブレットへのPWAインストールによるネイティブアプリ同等の全画面・オフライン動作に対応しています。

---

## 🌟 主な機能・特徴

### 1. 多様なエンジンレイアウト & パラメータカスタマイズ
- **レイアウト方式**:
  - 直列エンジン (Inline: 単気筒 〜 直6)
  - V型エンジン (V-Type: 60° / 90° バンク角変更、V6 / V8 / V10 / V12)
  - 水平対向ボクサーエンジン (Boxer / Flat)
- **ジオメトリ調整**:
  - ボア径 (Bore) & ストローク量 (Stroke)（ショートストローク / スクエア / ロングストローク比率の自動計算）
  - 圧縮比 (Compression Ratio)
  - コネクティングロッド長 (Connecting Rod Length)
  - シリンダーブロック材質（軽量アルミ合金 / 高剛性鋳鉄）
  - クランクシャフト形式（クロスプレーン / フラットプレーン等）

### 2. 熱力学 & 物理シミュレーション (60 FPS)
- 4ストローク工程（吸気 → 圧縮 → 燃焼・膨張 → 排気）のクランク角連動計算
- スロットル開度・空燃比 (AFR / λ)・目標燃料噴射量 (mg) のリアルタイム調整
- 指圧線図（P-V線図 / P-θ線図）およびリアルタイム出力・トルク曲線の波形グラフ表示
- スターターモーター始動、セル回転、アイドリング・レブリミット制御

### 3. リッチな3Dグラフィック & 視覚化
- **Three.jsによるリアルタイム3Dビュー**:
  - クランクシャフト、コンロッド、ピストン、シリンダーライナー、スパークプラグの完全連動
- **分解図アニメーション (Exploded View)**: スライダーでエンジン構成パーツをスムーズに展開
- **シリンダーカットモデル (Cutaway)** & ブロック透明度調整
- **熱分布ヒートマップ (Thermal Heatmap)**: 燃焼室からシリンダー壁面への熱伝導を可視化
- **燃焼・排気パーティクル**: スパーク点火、シリンダー内爆発炎、排気バルブからの排出煙
- **スタジオライティング**: ガレージ、ショールーム、サイバーパンクなど多彩なライティング環境

### 4. 伝説の名機プリセット搭載
- **トヨタ 4A-GEU (1.6L 直4 DOHC)**: カローラレビン/スプリンタートレノ (AE86)、MR2 (AW11)
- **レクサス 1LR-GUE (4.8L 72° V10)**: 9,000rpmまで吹け上がる至高の咆哮を持つスーパーカーLFA搭載エンジン
- **ポルシェ 911 (4.0L 水平対向6気筒)**: 低重心・等爆燃焼のボクサーエンジン
- その他、日産RB26DETT、フェラーリV8、軽自動車直3などのスペックを再現可能

### 5. PWA (Progressive Web App) & モバイル完全対応
- ホーム画面に追加してスタンドアロン起動（アドレスバーなし）
- Service Worker & Cache API による完全オフライン動作
- スマートフォン・タブレットでのタッチ操作（ピンチズーム・2本指パン・回転）に最適化
- 設定内容の自動ローカル保存（次回起動時も設定を維持）

---

## 🛠 技術スタック

- **フロントエンド**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3Dグラフィックス**: [Three.js](https://threejs.org/)
- **ビルドツール**: [Vite 8](https://vitejs.dev/)
- **スタイリング**: [Tailwind CSS v4](https://tailwindcss.com/)
- **アニメーション & アイコン**: [Motion](https://motion.dev/) / [Lucide Icons](https://lucide.dev/)
- **PWA基盤**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox)
- **デプロイ環境**: Cloudflare Pages / Cloudflare Workers Static Assets

---

## 🚀 クイックスタート (ローカル開発)

### 前提条件
- Node.js 20.x 以上
- npm / yarn / pnpm / bun のいずれか

### インストールと起動

```bash
# 1. リポジトリのクローン
git clone https://github.com/<YOUR_ACCOUNT>/gas-engine-simulator.git
cd gas-engine-simulator

# 2. 依存パッケージのインストール
npm install

# 3. 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開くとシミュレーターが起動します。

### 本番ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。PWA用の Service Worker (`sw.js`) と Web App Manifest も自動生成されます。

---

## ☁️ Cloudflare Pages / Workers へのデプロイ

本リポジトリは **Cloudflare Pages** および **Cloudflare Workers Static Assets** 向けに最適化されています。

### 方法A: Cloudflare Pages (GitHub連携・推奨)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログインします。
2. **Workers & Pages** > **作成** > **Pages** > **Git に接続** を選択します。
3. 本リポジトリを選択し、以下のようにビルド設定を入力します：
   - **フレームワークプリセット**: `Vite`
   - **ビルドコマンド**: `npm run build`
   - **ビルド出力ディレクトリ**: `dist`
   - **環境変数**: `NODE_VERSION` = `20`
4. **「保存してデプロイ」** をクリックすると、数十秒で全世界のCloudflare CDNエッジにデプロイされ、HTTPS対応URLが発行されます。

### 方法B: Wrangler CLI によるデプロイ

```bash
# ビルド
npm run build

# Cloudflare Workers Static Assetsとして直接デプロイ
npx wrangler deploy
```

※SPAルーティング設定は `wrangler.json`（`not_found_handling: "single-page-application"`）に記載されています。詳細な手順やトラブルシューティングは [`CLOUDFLARE_PWA_GUIDE.md`](./CLOUDFLARE_PWA_GUIDE.md) をご覧ください。

---

## 📁 ディレクトリ構成

```text
├── index.html               # アプリケーションのエントリHTML (PWAメタタグ設定済み)
├── package.json             # 依存関係・スクリプト定義
├── vite.config.ts           # ViteおよびVitePWA設定 (キャッシュ戦略・アイコン登録)
├── wrangler.json            # Cloudflareデプロイ設定 (SPAルーティング)
├── public/                  # PWAマニフェスト、アイコン画像、ヘッダー定義
├── src/
│   ├── main.tsx             # Reactエントリポイント
│   ├── App.tsx              # メインアプリケーションコンポーネント
│   ├── components/          # UIコンポーネント群
│   │   ├── Engine3DView.tsx         # Three.js 3D描画キャンバス
│   │   ├── EngineConfigPanel.tsx    # エンジン形式・ボア・ストローク設定パネル
│   │   ├── EngineControls.tsx       # スロットル・回転数・点火コントローラー
│   │   ├── PerformanceGraphs.tsx    # 出力・トルク・PV線図グラフ
│   │   ├── MaterialWeightsModal.tsx # 部品重量・慣性モーメント詳細モーダル
│   │   ├── V8TributeModal.tsx       # 名機解説モーダル
│   │   ├── PWAInstallButton.tsx     # PWAインストールボタン
│   │   └── CameraHUD.tsx            # 視点切り替えHUD
│   ├── data/                # 実在名機エンジンプリセットデータ
│   ├── physics/             # 4ストローク熱力学・クランク機構の数学物理モデル
│   └── types/               # TypeScript 型定義
└── CLOUDFLARE_PWA_GUIDE.md  # Cloudflare詳細デプロイガイド
```

---

## 📱 PWAとしてインストールして使う方法

### iPhone / iPad (iOS Safari)
1. Safari で公開URLにアクセスします。
2. 画面下部の **「共有」ボタン**（四角から矢印が出ているアイコン）をタップします。
3. メニューから **「ホーム画面に追加」** を選択します。
4. ホーム画面のアプリアイコンから起動すると、アドレスバーのない全画面アプリとして起動します。

### Android (Chrome)
1. Chrome で公開URLにアクセスします。
2. 画面上部に表示される **「アプリをインストール」** ボタン、またはブラウザメニュー（縦3点リーダー）から **「ホーム画面に追加」** を選択します。

### PC (Chrome / Edge)
1. アドレスバー右側に表示される **「インストール」アイコン**、または画面右上のインストールボタンをクリックします。

---

## 📄 ライセンス

本プロジェクトは [MIT License](LICENSE) のもとで公開されています。商用・非商用問わず自由にご利用いただけます。
