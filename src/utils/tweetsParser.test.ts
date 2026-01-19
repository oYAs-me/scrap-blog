import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllTweets } from './tweetsParser';

// getCollection のモックを動的に変更できるように変数を用意
let mockCollectionData: any[] = [];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(() => Promise.resolve(mockCollectionData)),
}));

describe('getAllTweets', () => {
  // コンソール出力の抑制とスパイ
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    // デフォルトのモックデータ
    mockCollectionData = [];
    consoleLogSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should parse simple single-line tweets correctly', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-01',
      body: '- 10:00 Morning\n- 12:00 Lunch'
    }];

    const tweets = await getAllTweets();
    
    expect(tweets).toHaveLength(2);
    // 降順ソート確認
    expect(tweets[0].content).toBe('Lunch');
    expect(tweets[0].date.getHours()).toBe(12);
    expect(tweets[1].content).toBe('Morning');
    expect(tweets[1].date.getHours()).toBe(10);
  });

  it('should handle multi-line tweets', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-02',
      body: '- 09:00 First line\n  Second line\n  Third line\n- 10:00 Next tweet'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(2);
    
    // 降順なので 10:00 が先
    expect(tweets[1].content).toContain('First line');
    expect(tweets[1].content).toContain('Second line');
    expect(tweets[1].content).toContain('Third line');
  });

  it('should handle tweets without time (default to 00:00)', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-03',
      body: '- Just a thought'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(1);
    expect(tweets[0].content).toBe('Just a thought');
    expect(tweets[0].date.getHours()).toBe(0);
    expect(tweets[0].date.getMinutes()).toBe(0);
  });

  it('should parse seconds if provided', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-04',
      body: '- 10:30:45 Precise time'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(1);
    expect(tweets[0].date.getHours()).toBe(10);
    expect(tweets[0].date.getMinutes()).toBe(30);
    expect(tweets[0].date.getSeconds()).toBe(45);
  });

  it('should preserve checkboxes in content', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-05',
      body: '- [ ] Todo item\n- [x] Done item'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(2);
    
    // 降順ソートはタイムスタンプが同じ場合、安定ソートか実装依存になるが
    // 元の実装の `pushCurrentTweet` とループ順序から、ファイルの上の行が先に処理され、
    // 配列に追加される。sort((a,b) => b-a) で同時刻なら順序は変わらない可能性があるが、
    // テストを安定させるために内容で検索する。
    
    const todo = tweets.find(t => t.content.includes('Todo item'));
    const done = tweets.find(t => t.content.includes('Done item'));

    expect(todo).toBeDefined();
    expect(todo?.content).toBe('- [ ] Todo item'); // Markdownリスト形式が維持される仕様

    expect(done).toBeDefined();
    expect(done?.content).toBe('- [x] Done item');
  });

  it('should convert markdown to HTML correctly', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-06',
      body: '- 10:00 **Bold** and *Italic*'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(1);
    expect(tweets[0].htmlContent).toContain('<strong>Bold</strong>');
    expect(tweets[0].htmlContent).toContain('<em>Italic</em>');
  });

  it('should generate correct ID and Title format (yyyy-mm-dd-hh-mm-seq)', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-09',
      body: '- 10:00 First\n- 10:00 Second'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(2);
    
    // 降順ソートなので Second (sequence 02) が先、First (sequence 01) が後
    const t1 = tweets[1]; // First (Older in file)
    const t2 = tweets[0]; // Second (Newer in file, has suffix)

    expect(t1.content).toBe('First');
    expect(t1.id).toBe('20260109-1000');
    expect(t1.title).toBe('tweet: 20260109-1000');
    expect(t1.slug).toBe('20260109-1000');

    expect(t2.content).toBe('Second');
    expect(t2.id).toBe('20260109-1000-1');
    expect(t2.title).toBe('tweet: 20260109-1000-1');
  });

  it('should skip invalid date files and warn', async () => {
    mockCollectionData = [
      { slug: 'tweets/invalid-date-file', body: '- 10:00 Content' },
      { slug: 'tweets/2026-01-07', body: '- 10:00 Valid' }
    ];

    const tweets = await getAllTweets();
    
    // validなものだけが残る
    expect(tweets).toHaveLength(1);
    expect(tweets[0].content).toBe('Valid');

    // 警告が出ているか確認
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping invalid date file'));
  });

  it('should ignore empty lines or lines not starting with dash', async () => {
    mockCollectionData = [{
      slug: 'tweets/2026-01-08',
      body: '\n\n- 10:00 Tweet 1\n\n  Additional text\nThis line does not start with dash but continues previous\n\n- 11:00 Tweet 2'
    }];

    const tweets = await getAllTweets();
    expect(tweets).toHaveLength(2);
    // Tweet 1には "Additional text" と "This line..." が含まれるはず
    const tweet1 = tweets.find(t => t.date.getHours() === 10);
    expect(tweet1?.content).toContain('Additional text');
    expect(tweet1?.content).toContain('This line does not start with dash');
  });
});