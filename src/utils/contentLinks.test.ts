import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { remark } from 'remark';
import wikiLinkPlugin from 'remark-wiki-link';
import { visit } from 'unist-util-visit';
import { CONTENT_COLLECTIONS, wikiLinkSettings } from '../consts';

// プロジェクトルート設定
const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'src/content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

interface LinkInfo {
  sourceFile: string;
  target: string;
  type: 'wiki' | 'markdown' | 'html';
  original: string;
  line?: number;
}

/**
 * Markdownファイルから全てのリンクを抽出する
 */
async function extractLinks(filePath: string): Promise<LinkInfo[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const links: LinkInfo[] = [];

  const processor = remark().use(wikiLinkPlugin, wikiLinkSettings);
  const tree = processor.parse(content);

  visit(tree, ['link', 'wikiLink', 'html', 'image'], (node: any) => {
    if (node.type === 'wikiLink') {
      links.push({
        sourceFile: filePath,
        target: node.data.hProperties.href,
        type: 'wiki',
        original: node.value,
        line: node.position?.start.line
      });
    } else if (node.type === 'link' || node.type === 'image') {
      links.push({
        sourceFile: filePath,
        target: node.url,
        type: 'markdown',
        original: node.url,
        line: node.position?.start.line
      });
    } else if (node.type === 'html') {
      const match = /href=["']([^"']+)["']|src=["']([^"']+)["']/.exec(node.value);
      if (match) {
        links.push({
          sourceFile: filePath,
          target: match[1] || match[2],
          type: 'html',
          original: node.value,
          line: node.position?.start.line
        });
      }
    }
  });

  return links;
}

/**
 * URLパスが実際のファイル（コンテンツまたはパブリック資産）に解決できるか確認する
 */
async function resolvePath(targetPath: string, sourceFile: string): Promise<{ exists: boolean; reason?: string }> {
  // 外部リンク/メール/アンカーはスキップ
  if (/^(https?:\/\/|mailto:|#)/.test(targetPath)) return { exists: true };

  // 1. 公開ディレクトリ (public/) のチェック
  if (targetPath.startsWith('/')) {
    const publicPath = path.join(PUBLIC_DIR, targetPath);
    try {
      await fs.access(publicPath);
      return { exists: true };
    } catch {}
  }

  // 2. コンテンツコレクション (scraps/articles/tweets) のチェック
  for (const collection of CONTENT_COLLECTIONS) {
    const prefix = `/${collection}/`;
    if (targetPath.startsWith(prefix)) {
      const slug = targetPath.slice(prefix.length).replace(~/$/,''); // 末尾スラッシュ除去
      
      // TweetsはファイルパスとURLが直接対応しない場合があるが、
      // 簡易的なチェックとしてはファイル存在確認で代用するか、スキップする
      if (collection === 'tweets') return { exists: true }; 

      const possibleFilePaths = [
        path.join(CONTENT_DIR, collection, `${slug}.md`),
        path.join(CONTENT_DIR, collection, `${slug}.mdx`),
        path.join(CONTENT_DIR, collection, slug, 'index.md'),
        path.join(CONTENT_DIR, collection, slug, 'index.mdx'),
      ];

      for (const p of possibleFilePaths) {
        try {
          await fs.access(p);
          return { exists: true };
        } catch {}
      }
      return { exists: false, reason: `No matching file found in src/content/${collection}/ for slug "${slug}"` };
    }
  }

  // 3. 相対パスのチェック (画像など)
  if (!targetPath.startsWith('/')) {
    const relativePath = path.resolve(path.dirname(sourceFile), targetPath);
    try {
      await fs.access(relativePath);
      return { exists: true };
    } catch {
      return { exists: false, reason: `Relative file not found: ${targetPath}` };
    }
  }

  // 特殊なパス (tweetsなど、個別ファイルに対応しないもの)
  if (targetPath.startsWith('/tweets')) return { exists: true };
  if (targetPath === '/') return { exists: true };

  return { exists: false, reason: `Unrecognized internal link format: ${targetPath}` };
}

describe('Content Link Integrity', () => {
  it('should validate all internal links and assets', async () => {
    const files = await glob('src/content/**/*.{md,mdx}', { cwd: ROOT_DIR, absolute: true });
    const errors: string[] = [];

    for (const file of files) {
      const links = await extractLinks(file);
      const relativeSource = path.relative(ROOT_DIR, file);

      for (const link of links) {
        const result = await resolvePath(link.target, file);
        if (!result.exists) {
          errors.push(
            `[DEAD LINK] ${relativeSource}:${link.line}\n` +
            `  Target: ${link.target}\n` +
            `  Reason: ${result.reason}\n` +
            `  Context: ${link.type === 'wiki' ? '[[' + link.original + ']]' : link.original}`
          );
        }
      }
    }

    if (errors.length > 0) {
      console.error(`\nFound ${errors.length} link error(s):\n\n${errors.join('\n\n')}\n`);
    }

    expect(errors).toHaveLength(0);
  }, 30000);
});