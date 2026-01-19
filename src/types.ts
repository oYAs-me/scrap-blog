// プロジェクト全体で使用する型定義

/**
 * 1つのツイート(Tweet)を表すデータ構造
 */
export type TweetItem = {
  id: string;        // yyyymmdd-hhmm[-seq]
  slug: string;      // 個別URL用 (idと同じ)
  title: string;     // `tweet: [id]`
  content: string;   // 本文 (Markdown形式)
  htmlContent: string;  // 変換済みのHTML
  date: Date;        // 日付 + 時間
  originalFile: string; // 元ファイル名
};

/**
 * バックリンク一覧に表示するための記事情報
 */
export interface BacklinkEntry {
  slug: string;
  collection: string;
  title: string;
}

/**
 * バックリンクの逆引きマップ
 * Key: リンク先のフルパス (例: "scraps/my-note")
 * Value: リンク元記事の配列
 */
export type BacklinkMap = Record<string, BacklinkEntry[]>;