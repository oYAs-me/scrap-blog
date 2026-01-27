# scrap-blog

A personal scrapbox-like log or blog and digital garden built with Astro. / Astroで構築した、Scrapboxライクなデジタルガーデンもしくはブログ。

---

## 🛠 Tech Stack

- **Framework:** [Astro](https://astro.build)
- **Deployment:** Linux / Nginx via GitHub Actions
- **Concept:** Digital Garden (Seed -> Bud -> Evergreen) ?

## 💻 Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/oYAs-me/scrap-blog.git
cd scrap-blog

# 2. Initialize Submodules (Important!)
# This project manages content in a separate private repository.
# You need to initialize submodules to fetch the content.
git submodule update --init --recursive

# 3. Install Dependencies
npm install

# 4. Start Development Server
npm run dev
```

## 機能

### A. Blog/GitHubモード (Articles)

- **役割:** 完成された成果物、技術的なショーケース。
- **特徴:**
  - **MDXコンポーネント:** Reactコンポーネントを埋め込み可能。
  - **GitHub連携:** 特定リポジトリのRelease Note引用、コミットのDiff表示、言語使用率のグラフ化など。
  - OGP画像をリッチに生成。

### B. Scrapboxモード (Scraps)

- **役割:** 知識のネットワーク、概念の整理。
- **特徴:**
  - **双方向リンク (Wiki Link):** `[[記事タイトル]]` で相互にリンク可能。
  - **ステータス管理:** 記事の成熟度を明示（🌱 Seed / 🌿 Bud / 🌲 Evergreen）。
  - **Backlinks:** その記事にリンクしている記事の一覧を自動表示。

### C. SNSモード (Tweets)

- **役割:** 思考のフロー、作業ログ、独り言。
- **特徴:**
  - タイトル不要（日付がID）。
  - 時系列（降順）のタイムライン表示。
  - Tweets Parserによる表示や管理

## ディレクトリ構成案

```Plaintext
scrap-blog/
├── public/                 # 静的ファイル (favicon, robots.txt)
├── src/
│   ├── consts.ts         # 定数定義
│   ├── types.ts          # 型などの定義
│   ├── components/         # UI部品
│   │   ├── Backlinks.astro     # バックリンク表示コンポーネント
│   │   ├── GitHubDiff.astro    # コード差分表示用コンポーネント (予定)
│   │   ├── Timeline.astro      # SNS風フィード表示 (予定)
│   ├── content/            # 記事データ (Markdown/MDX)
│   │   ├── config.ts       # スキーマ定義 (Articles/Scraps/Tweets)
│   │   ├── articles/       # Blogモード用
│   │   ├── scraps/         # Scrapboxモード用
│   │   └── tweets/         # SNSモード用 (ファイル名は日付: 2026-01-05.md)
│   ├── layouts/            # ページレイアウト
│   │   ├── BaseLayout.astro
│   │   └── NoteLayout.astro (予定)
│   ├── pages/              # ルーティング
│   │   ├── index.astro     # トップページ (Feed + Random Notes + SNS Preview)
│   │   ├── articles/
│   │   │   ├── [...slug].astro # Blog個別ページ
│   │   │   └── index.astro     # Blog一覧ページ
│   │   ├── scraps/
│   │   │   ├── [...slug].astro # Scrapbox個別ページ
│   │   │   └── index.astro     # Scrapbox一覧ページ
│   │   ├── tweets/
│   │   │   ├── [slug].astro    # SNS個別ページ (仮想)
│   │   │   └── index.astro     # SNSモードタイムラインページ
│   │   └── rss.xml.js       # RSSフィード生成 (予定)
│   ├── styles/
│   │   └── global.css      # 全体スタイル (CSS Variables活用)
│   └── utils/              # ユーティリティ関数
│        ├── backlinks.ts    # WikiLink解析・バックリンク生成
│        ├── backlinks.test.ts
│        ├── contentLinks.test.ts # WikiLink解析テスト
│        ├── tweetsParser.ts # ツイートパーサー
│        └── tweetsParser.test.ts
├── astro.config.mjs        # Astro設定 (remark-wiki-link等のプラグイン設定)
├── package.json
└── tsconfig.json
```

## 🛣 Road Map

```mermaid
graph TD
    %% クラス定義
    classDef base fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef logic fill:#fffde7,stroke:#f9a825,stroke-width:2px;
    classDef comp fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef design fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef infra fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef twitter fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef quality fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef finish fill:#333,stroke:#333,stroke-width:2px,color:#fff;
    classDef sprint fill:#e0f7fa,stroke:#006064,stroke-width:2px;

    %% --- Phase 1: 基礎構築 (完了) ---
    subgraph P1 ["Phase 1: Foundation (Completed)"]
        P1_Init["✅ 1. Init & Clean"]:::base
        P1_Layout["✅ 2. Layouts & Dirs"]:::base
        P1_Schema["✅ 3. Schema Def"]:::base
        P1_ListPages["✅ 4. List Pages"]:::base
        P1_Init --> P1_Layout --> P1_Schema --> P1_ListPages
    end
    
    %% --- Phase 2: SNSモード (完了) ---
    subgraph P2 ["Phase 2: SNS Mode (Completed)"]
        P2_TweetsParser["✅ 📝 Tweets Parser"]:::twitter
        P2_Timeline["✅ 🐦 Timeline Page"]:::twitter
    end
    
    P1_ListPages --> P2

    %% --- Phase 3: 開発環境と基盤設計 ---
    subgraph P3 [Phase 3: Scaffolding & Base Design]
        direction LR
        P3_Test["✅ Testing Setup<br>Vitestによるテスト環境を構築済み"]:::quality
        P3_CI["✅ Initial CI Setup<br>Git Pushをトリガーに、ビルドとテストを自動実行"]:::infra
        P3_Design["✅ Design System<br>サイト全体の色、フォント、スペーシング等を定義"]:::design
    end
    
    P2 --> P3

    %% --- Phase 4: イテレーション開発 (機能の実装と統合) ---
    subgraph P4 [Phase 4: Iterative Development]
        direction TB
        
        subgraph I1 [Iteration 1: Core Linking]
            I1_Wiki["✅ 🔗 Wiki Link Logic<br>[[リンク]]記法を解釈し、内部リンクに変換"]:::logic
            I1_Backlinks["✅ ↩️ Backlinks Logic<br>各ページへの被リンクを検出し、表示用データを生成"]:::logic
        end

        I1_Int("🔄 Integration 1"):::sprint

        subgraph I2 [Iteration 2: Content Features]
            I2_Status["🏷️ Status Logic<br>記事のステータス(Seed/Bud)に基づきフィルタリング"]:::logic
            I2_MDX["🛠️ MDX & Components<br>MDXを導入し、Markdown内でコンポーネントを利用"]:::comp
        end
        
        I2_Int("🔄 Integration 2"):::sprint
        
        I1 --> I1_Int --> I2 --> I2_Int
    end
    
    P3 --> I1

    %% --- Phase 5: 仕上げと最適化 ---
    subgraph P5 [Phase 5: Polish & Optimization]
        P5_Responsive["📱 Responsive Design<br>スマートフォンやタブレット表示に最適化"]:::design
        P5_OGP["🖼️ OGP Image Gen<br>SNS共有時のプレビュー画像をリッチに生成"]:::design
        P5_Access["♿ Accessibility<br>スクリーンリーダー対応などアクセシビリティを向上"]:::design
        P5_SEO["📈 SEO & RSS<br>RSSやサイトマップを生成し、検索エンジン向けに最適化"]:::quality
        P5_Responsive --> P5_OGP --> P5_Access --> P5_SEO
    end
    
    I2_Int --> P5_Responsive

    %% --- Phase 6: デプロイ準備とリリース ---
    subgraph P6 [Phase 6: Deployment]
        P6_Nginx["⚙️ Nginx Config<br>本番環境のWebサーバ(Nginx)を設定"]:::infra
        P6_CD["🚀 Deployment Pipeline (CD)<br>本番環境へのデプロイを自動化"]:::infra
        P6_Nginx --> P6_CD
    end
    
    P5_SEO --> P6_Nginx
    P3_CI --> P6_CD
    
    Goal(🏁 Release v1.0):::finish
    
    P6_CD --> Goal
```