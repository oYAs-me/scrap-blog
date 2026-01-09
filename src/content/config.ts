// src/content/config.ts
import { z, defineCollection } from 'astro:content';

// 1. Articles (旧 Projects): 外部公開用のしっかりした記事
// ブログ記事やポートフォリオ的な使い方
const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    tags: z.array(z.string()),
    
    // 以下は任意項目
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(), // 記事の見栄え用
    
    // ポートフォリオとしての機能
    techStack: z.array(z.string()).optional(), // 使用技術
    githubUrl: z.string().url().optional(),    // リポジトリURL
  }),
});

// 2. Scraps (旧 Notes): 思考の断片、Wiki
// 長文ツイートやメモ帳的な使い方
const scrapsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),

    // 以下は任意項目
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
    
    // 関連リンク（Scrapbox的なつながり用）
    refs: z.array(z.string().url()).optional(),
  }),
});

// 3. Tweets (旧 Logs): つぶやき、備忘録
// Twitterみたいな短文投稿
const tweetsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    pubDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// 定義をエクスポート
export const collections = {
  'articles': articlesCollection,
  'scraps': scrapsCollection,
  'tweets': tweetsCollection,
};