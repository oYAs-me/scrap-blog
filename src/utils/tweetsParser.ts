import { getCollection } from 'astro:content';
// import type { CollectionEntry } from 'astro:content';

// 1つのツイート(Tweet)を表す型定義
export type TweetItem = {
  id: string;        // ファイル名 + 行番号などで一意にする
  content: string;   // 本文 (Markdown形式)
  date: Date;        // 日付 + 時間
  originalFile: string; // 元ファイル名
};

export async function getAllTweets(): Promise<TweetItem[]> {
  const allTweetsFiles = await getCollection('tweets');
  let allTweets: TweetItem[] = [];

  for (const file of allTweetsFiles) {
    // ファイル名から日付オブジェクトを作成 (例: 2026-01-08.md -> Date)
    // ※ファイル名が日付形式でない場合は作成日などを使うフォールバックが必要
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
    const pushCurrentTweet = () => {
      if (currentTweet && currentTweet.content && currentTweet.content.trim().length > 0) {
        // 型ガードを通しているのでキャスト等は不要だが、Partialなので一応チェック
        if (currentTweet.id && currentTweet.date && currentTweet.originalFile) {
           allTweets.push(currentTweet as TweetItem);
        }
      }
      currentTweet = null;
    };

    // Tweet取得の正規表現: "- HH:MM 本文" または "- 本文" にmatch
    // Group 1: チェックボックス ("[ ]" or "[x]") ※optional
    // Group 2: 時刻 (HH:MM or HH:MM:SS) ※optional
    // Group 3: 本文 ※optional
    const tweetRegex = /^- (?:(\[[ xX]?\]) )?(?:(\d{1,2}:\d{2}(?::\d{2})?) ?)?(.*)$/;

    // 各行を解析してツイートを抽出
    lines.forEach((line, index) => {
      const match = line.match(tweetRegex);
      if (match) {
        // 既にcurrentTweetがある場合は、それをリストに追加
        pushCurrentTweet();

        // 新しいツイートの開始
        const checkbox = match[1]; // "[ ]" や "[x]"、なければ undefined
        const timeStr = match[2];  // "10:00"、"14:30:15"、なければ undefined
        let content = match[3] || '';    // 本文

        // チェックボックスがある場合は本文の先頭に戻す
        if (checkbox) {
          content = `- ${checkbox} ${content}`;
        }

        // 日付と時間を結合してDateオブジェクトを作る
        const tweetDate = new Date(fileBaseDate);
        if (timeStr) {
          const timeLst = timeStr.split(':').map(Number);
          tweetDate.setHours(timeLst[0], timeLst[1]);
        } else {
            // 時間がない場合はファイルの代表時刻(00:00)に設定
            // 前の行の時間などを引き継ぐロジックを入れても良い
            tweetDate.setHours(0, 0); 
        }

        // currentTweetを整理
        currentTweet = {
          id: `${file.slug}-${index}`,
          content: content,
          date: tweetDate,
          originalFile: file.slug,
        };
      } else {
        // ツイート行でない場合、currentTweetがあれば本文を追加
        if (currentTweet) {
          currentTweet.content += `\n${line}`;
        }
      }
    });
    // 最後のツイートをリストに追加
    pushCurrentTweet();
  }

  // 新しい順（降順）にソート
  return allTweets.sort((a, b) => b.date.getTime() - a.date.getTime());
}