import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkWikiLink from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { wikiLinkSettings } from '../consts';
import type { TweetItem } from '../types';

export type { TweetItem };

// Markdownプロセッサーの定義
const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkWikiLink, wikiLinkSettings)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

// ID生成ヘルパー
function generateTweetId(date: Date, sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const base = `${y}${m}${d}-${h}${min}`;
  // 1つ目の投稿は枝番なし、2つ目以降は -1, -2... を付ける
  return sequence <= 1 ? base : `${base}-${sequence - 1}`;
}

// Tweet取得の正規表現: "- HH:MM 本文" または "- 本文" にmatch
// Group 1: チェックボックス ("[ ]" or "[x]") ※optional
// Group 2: 時刻 (HH:MM or HH:MM:SS) ※optional
// Group 3: ツイートの本文（実際の内容部分）※optional
const tweetRegex = /^- (?:(\[[ xX]?\]) )?(?:(\d{1,2}:\d{2}(?::\d{2})?) ?)?(.*)$/;

/**
 *  全ツイートを取得し、TweetItem配列として返す
 */
export async function getAllTweets(): Promise<TweetItem[]> {
  const allTweetsFiles = await getCollection('tweets');
  let allTweets: TweetItem[] = [];

  for (const file of allTweetsFiles) {
    // ファイル名から日付オブジェクトを作成 (例: 2026-01-08.md -> Date)
    const fileDateStr = file.slug.split('/').pop()?.replace('.md', '').replace('test-', '') || '';
    const fileBaseDate = new Date(fileDateStr);

    // 日付として不正な場合は警告を出してスキップ
    if (isNaN(fileBaseDate.getTime())) {
      console.warn(`[TweetsParser] Skipping invalid date file: ${file.slug}`);
      continue;
    }

    // 読み込んだファイル名を出力
    console.log(`[TweetsParser] Processing file: ${file.slug}`);
    
    // Markdownの本文を行ごとの配列にする
    const lines = file.body.split(/\r?\n/);

    // 現在処理中のツイートを一時保存する変数
    let currentTweet: Partial<TweetItem> | null = null;
    
    // ID重複回避のためのシーケンス管理: { "HH:MM": count }
    const timeSequenceMap: Record<string, number> = {};

    // ツイートをリストに追加する関数（共通化）
    const pushCurrentTweet = async () => {
      // コンテンツが存在する場合のみ処理
      if (currentTweet && currentTweet.content && currentTweet.content.trim().length > 0) {
        try {
          // 変換処理を実行
          const vfile = await processor.process(currentTweet.content);
          currentTweet.htmlContent = vfile.toString();

        } catch (error) {
          // ... (エラーハンドリング)
          currentTweet.htmlContent = `<p style="color:red; font-size:0.8em;">Parse Error</p>${currentTweet.content}`;
        }

        // IDとTitleの生成
        if (currentTweet.date) {
           const h = String(currentTweet.date.getHours()).padStart(2, '0');
           const m = String(currentTweet.date.getMinutes()).padStart(2, '0');
           const timeKey = `${h}:${m}`;
           
           // シーケンス番号を取得・更新
           const seq = (timeSequenceMap[timeKey] || 0) + 1;
           timeSequenceMap[timeKey] = seq;

           const newId = generateTweetId(currentTweet.date, seq);
           currentTweet.id = newId;
           // slugには "tweets/" プレフィックスを付けない (backlinks.ts等での扱い統一のため)
           // ただし、Astroのルーティングで衝突しないようユニークである必要がある
           currentTweet.slug = newId; 
           currentTweet.title = `tweet: ${newId}`;
        }

        // 必須プロパティが揃っているか確認してPush
        if (currentTweet.id && currentTweet.date && currentTweet.originalFile && currentTweet.title) {
           allTweets.push(currentTweet as TweetItem);
        }
      }
      currentTweet = null;
    };

    // 各行を解析してツイートを抽出
    for (const [_, line] of lines.entries()) {
      const match = line.match(tweetRegex);
      
      if (match) {
        await pushCurrentTweet(); // 前のツイートを保存

        const checkbox = match[1];
        const timeStr = match[2];
        let content = match[3] || '';

        if (checkbox) {
          content = `- ${checkbox} ${content}`;
        }

        const tweetDate = new Date(fileBaseDate);
        if (timeStr) {
          const timeLst = timeStr.split(':').map(Number);
          tweetDate.setHours(timeLst[0], timeLst[1], timeLst[2] || 0);
        } else {
            tweetDate.setHours(0, 0, 0); 
        }

        // IDは pushCurrentTweet で確定させるためここでは仮置きもしない
        currentTweet = {
          content: content,
          htmlContent: '',
          date: tweetDate,
          originalFile: file.slug,
        };
      } else {
        if (currentTweet) {
          currentTweet.content += `\n${line}`;
        }
      }
    }
    await pushCurrentTweet(); // 末尾処理
  }

  // 新しい順（降順）にソート
  // NOTE: slug は generateTweetId() で `YYYYMMDD-HHmm[-枝番]` 形式で生成されるため、
  // 文字列ソートしても日付の降順と一致する。念のため slug が同一の場合は date も比較する。
  return allTweets.sort((a, b) => {
    const slugCompare = b.slug.localeCompare(a.slug); // IDベースでソート
    if (slugCompare !== 0) return slugCompare;
    return b.date.getTime() - a.date.getTime();
  });
}
