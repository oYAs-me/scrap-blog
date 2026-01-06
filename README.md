# scrap-blog

A personal scrapbox-like log or blog and digital garden built with Astro. / Astroで構築した、Scrapboxライクなデジタルガーデンもしくはブログ。

---

## 🛠 Tech Stack

- **Framework:** [Astro](https://astro.build)
- **Deployment:** Linux / Apache via GitHub Actions
- **Concept:** Digital Garden (Seed -> Bud -> Evergreen) ?

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
  - Obsidian-Memos likeな表示や管理

## ディレクトリ構成案

```Plaintext
scrap-blog/
├── public/                 # 静的ファイル (favicon, robots.txt)
├── src/
│   ├── components/         # UI部品
│   │   ├── GitHubDiff.astro    # コード差分表示用コンポーネント
│   │   ├── Timeline.astro      # SNS風フィード表示
│   │   └── WikiLink.astro      # 内部リンク処理
│   ├── content/            # 記事データ (Markdown/MDX)
│   │   ├── config.ts       # スキーマ定義 (ここでLogs/Notes/Projectsを定義)
│   │   ├── articles/       # Blogモード用
│   │   ├── scraps/         # Scrapboxモード用
│   │   └── tweets/         # SNSモード用 (ファイル名は日付: 2026-01-05.md)
│   ├── layouts/            # ページレイアウト
│   │   ├── BaseLayout.astro
│   │   └── NoteLayout.astro
│   ├── pages/              # ルーティング
│   │   ├── index.astro     # トップページ (Feed + Random Notes)
│   │   ├── articles/[slug].astro # Blog個別ページ
│   │   ├── scraps/[slug].astro   # Scrapbox個別ページ
│   │   ├── tweets/[...page].astro # SNS個別ページ
│   │   └── rss.xml.js
│   └── styles/
│       └── global.css      # 全体スタイル (CSS Variables活用)
├── astro.config.mjs        # Astro設定 (remark-wiki-link等のプラグイン設定)
├── package.json
└── tsconfig.json
```

## 🛣 Road Map

```mermaid
graph TD
    %% クラス定義
    classDef base fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef logic fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
    classDef comp fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef design fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef infra fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef finish fill:#333,stroke:#333,stroke-width:2px,color:#fff;

    %% --- Phase 1: スタート地点 ---
    subgraph Phase1 ["Phase 1: Foundation"]
        direction TB
        P1_Init["1. Init & Clean<br>npm create / git init<br>⏱️ 1h"]:::base
        P1_Layout["2. Layouts & Dirs<br>BaseLayout / Folder Struct<br>⏱️ 2h"]:::base
        P1_Schema["3. Schema Def<br>Logs = Daily Note format<br>⏱️ 2h"]:::base
        
        P1_Init --> P1_Layout --> P1_Schema
    end

    %% --- 並行開発パート ---
    
    %% Track A: ロジック開発 (Updated for Memos)
    subgraph TrackLogic ["Track A: Logic Dev"]
        direction TB
        P2_Wiki["🔗 Wiki Logic<br>(remark-wiki-link)<br>⏱️ 3h"]:::logic
        P2_Memos["📝 Memos Parser<br>Parse list items w/ time<br>⏱️ 3h"]:::logic
        P2_Status["🏷️ Status Logic<br>(Seed/Bud filtering)<br>⏱️ 2h"]:::logic
        
        P2_Wiki --> P2_Memos --> P2_Status
    end

    %% Track B: コンポーネント開発 (Updated for Heatmap)
    subgraph TrackComp ["Track B: Component Dev"]
        direction TB
        P3_MDX["🛠️ MDX Setup<br>Integration check<br>⏱️ 3h"]:::comp
        P3_Heatmap["📅 Heatmap UI<br>Calendar contribution view<br>⏱️ 3h"]:::comp
        P3_Diff["💻 GitHub Components<br>Diff / Repo Card<br>⏱️ 3h"]:::comp
        
        P3_MDX --> P3_Heatmap --> P3_Diff
    end

    %% Track C: インフラ構築
    subgraph TrackInfra ["Track C: Infra Ops"]
        direction TB
        P4_Apache["⚙️ Apache Config<br>(Vhost setup)<br>⏱️ 1h"]:::infra
        P4_CI["🤖 GitHub Actions<br>(Build & Deploy)<br>⏱️ 3h"]:::infra
        
        P4_Apache --> P4_CI
    end

    %% --- Phase 5: 合流と仕上げ ---
    subgraph Phase5 ["Phase 5: Design & Polish"]
        direction TB
        P5_Design["🎨 The Swamp<br>Base CSS / Mobile / OGP<br>⏱️ 10h 〜 ∞"]:::design
    end

    Goal(🏁 Release v1.0):::finish

    %% 依存関係
    P1_Schema --> P2_Wiki
    P1_Schema --> P3_MDX
    P1_Schema --> P4_Apache

    %% 合流
    P2_Status --> P5_Design
    P3_Diff --> P5_Design
    
    %% リリース条件
    P4_CI --> Goal
    P5_Design --> Goal
```
