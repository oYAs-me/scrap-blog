import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// 1つのツイート(Tweet)を表す型定義
export type TweetItem = {
  id: string;        // ファイル名 + 行番号などで一意にする
  content: string;   // 本文 (Markdown形式)
  htmlContent: string;  // 変換済みのHTML
  date: Date;        // 日付 + 時間
  originalFile: string; // 元ファイル名
};

// Markdownプロセッサーの定義
const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

// Tweet取得の正規表現: "- HH:MM 本文" または "- 本文" にmatch
// Group 1: チェックボックス ("[ ]" or "[x]") ※optional
// Group 2: 時刻 (HH:MM or HH:MM:SS) ※optional
// Group 3: 本文 ※optional
const tweetRegex = /^- (?:(\[[ xX]?\]) )?(?:(\d{1,2}:\d{2}(?::\d{2})?) ?)?(.*)$/;

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

    // ツイートをリストに追加する関数（共通化）
    // 本文が空文字(空白のみ含む)の場合は追加しない
    const pushCurrentTweet = async () => {
// コンテンツが存在する場合のみ処理
      if (currentTweet && currentTweet.content && currentTweet.content.trim().length > 0) {
        try {
          // 変換処理を実行
          const vfile = await processor.process(currentTweet.content);
          currentTweet.htmlContent = vfile.toString();
        } catch (error) {
          // エラーハンドリング
          console.error(
            `[TweetsParser] Failed to process markdown in ${currentTweet.originalFile}. ` +
              `Content preview: "${currentTweet.content.slice(0, 100)}"`,
            error
          );
          
          // Fallback: 変換に失敗した場合は、とりあえず元のMarkdownテキストをそのまま入れる
          // (これで画面に何も出なくなる事態は防げます)
          currentTweet.htmlContent = `<p style="color:red; font-size:0.8em;">Parse Error</p>${currentTweet.content}`;
        }

        // 必須プロパティが揃っているか確認してPush
        if (currentTweet.id && currentTweet.date && currentTweet.originalFile) {
           allTweets.push(currentTweet as TweetItem);
        }
      }
      currentTweet = null;
    };

    // 各行を解析してツイートを抽出
    for (const [index, line] of lines.entries()) {
      const match = line.match(tweetRegex);
      
      if (match) {
        await pushCurrentTweet(); // 前のツイートを保存

        const checkbox = match[1];
        const timeStr = match[2];
        let content = match[3] || '';

        if (checkbox) {
          // チェックボックスがある場合、Markdownのリスト形式を維持して本文に戻す
          content = `- ${checkbox} ${content}`;
        }

        const tweetDate = new Date(fileBaseDate);
        if (timeStr) {
          const timeLst = timeStr.split(':').map(Number);
          tweetDate.setHours(timeLst[0], timeLst[1], timeLst[2] || 0);
        } else {
            tweetDate.setHours(0, 0, 0); 
        }

        currentTweet = {
          id: `${file.slug}-${index}`,
          content: content,
          htmlContent: '', // 後で上書きする
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
  return allTweets.sort((a, b) => b.date.getTime() - a.date.getTime());
}