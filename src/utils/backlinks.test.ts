import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllBacklinks } from './backlinks';

// モジュール全体のモック化
vi.mock('astro:content', () => {
  const mockScraps = [
    {
      slug: 'source-scrap',
      collection: 'scraps',
      data: { title: 'Source Scrap' },
      body: `Link to scrap: [[target-scrap]]
Link to article: [[articles/target-article]]
Link to tweet: [[tweets/20260101-0000]]`
    },
    {
      slug: 'target-scrap',
      collection: 'scraps',
      data: { title: 'Target Scrap' },
      body: ''
    }
  ];

  const mockArticles = [
    {
      slug: 'source-article',
      collection: 'articles',
      data: { title: 'Source Article' },
      body: `Link to scrap: [link](/scraps/target-scrap)
Link to article: [link](/articles/target-article)
Link to tweet: [link](/tweets/20260101-0000)`
    },
    {
      slug: 'target-article',
      collection: 'articles',
      data: { title: 'Target Article' },
      body: ''
    }
  ];

  return {
    getCollection: vi.fn((collectionName) => {
      if (collectionName === 'scraps') return Promise.resolve(mockScraps);
      if (collectionName === 'articles') return Promise.resolve(mockArticles);
      return Promise.resolve([]);
    }),
  };
});

vi.mock('./tweetsParser', () => {
  const mockTweets = [
    {
      // source-tweet (2026-01-02)
      slug: '20260102-0000', 
      content: `Link to scrap: [[target-scrap]]
Link to article: [[articles/target-article]]
Link to tweet: [[tweets/20260101-0000]]`,
      date: new Date('2026-01-02'),
      id: '20260102-0000',
      title: 'tweet: 20260102-0000',
      originalFile: 'source-tweet.md',
      htmlContent: '',
    },
    {
      // target-tweet (2026-01-01)
      slug: '20260101-0000',
      content: 'Target Tweet',
      date: new Date('2026-01-01'),
      id: '20260101-0000',
      title: 'tweet: 20260101-0000',
      originalFile: '2026-01-01.md',
      htmlContent: '',
    }
  ];
  return {
    getAllTweets: vi.fn(() => Promise.resolve(mockTweets)),
  };
});

// 3. テストケース
describe('getAllBacklinks (Cross-Collection Links)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect all 9 combinations of links correctly', async () => {
    const map = await getAllBacklinks();

    // 期待されるリンク先キー
    const targetScrapKey = 'scraps/target-scrap';
    const targetArticleKey = 'articles/target-article';
    const targetTweetKey = 'tweets/20260101-0000'; 

    // --- 検証: Scrap からのリンク ---
    expect(map[targetScrapKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-scrap', collection: 'scraps' })
    ]));
    expect(map[targetArticleKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-scrap', collection: 'scraps' })
    ]));
    expect(map[targetTweetKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-scrap', collection: 'scraps' })
    ]));

    // --- 検証: Article からのリンク ---
    expect(map[targetScrapKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-article', collection: 'articles' })
    ]));
    expect(map[targetArticleKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-article', collection: 'articles' })
    ]));
    expect(map[targetTweetKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'source-article', collection: 'articles' })
    ]));

    // --- 検証: Tweet からのリンク ---
    const expectedTweetSlug = '20260102-0000';
    const expectedTweetTitle = 'tweet: 20260102-0000';
    
    expect(map[targetScrapKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: expectedTweetSlug, collection: 'tweets', title: expectedTweetTitle })
    ]));
    expect(map[targetArticleKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: expectedTweetSlug, collection: 'tweets', title: expectedTweetTitle })
    ]));
    expect(map[targetTweetKey]).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: expectedTweetSlug, collection: 'tweets', title: expectedTweetTitle })
    ]));
  });

  it('should handle wiki-style links and standard markdown links', async () => {
    const map = await getAllBacklinks();
    
    // ScrapはWiki Linkを使用
    const fromScrap = map['scraps/target-scrap']?.find(l => l.collection === 'scraps');
    expect(fromScrap).toBeDefined();

    // ArticleはStandard Linkを使用
    const fromArticle = map['scraps/target-scrap']?.find(l => l.collection === 'articles');
    expect(fromArticle).toBeDefined();
  });
});