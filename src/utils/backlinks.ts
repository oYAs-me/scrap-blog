import { getCollection } from 'astro:content';
import { remark } from 'remark';
import wikiLinkPlugin from 'remark-wiki-link';
import { visit } from 'unist-util-visit';
import { getAllTweets } from './tweetsParser';
import { CONTENT_COLLECTIONS, wikiLinkSettings } from '../consts';
import type { BacklinkMap } from '../types';

const processor = remark().use(wikiLinkPlugin, wikiLinkSettings);

/**
 * 全記事のバックリンク関係を構築する
 */
export async function getAllBacklinks(): Promise<BacklinkMap> {
  const backlinkMap: BacklinkMap = {};
  
  // 1. 標準的なコレクション (scraps, articles)
  for (const collectionName of CONTENT_COLLECTIONS) {
    if (collectionName === 'tweets') continue; // ツイートは別処理

    const posts = await getCollection(collectionName as 'articles' | 'scraps');
    
    for (const post of posts) {
      await processPost(post.body, collectionName, post.slug, post.data.title || post.slug, backlinkMap);
    }
  }

  // 2. ツイート (独自Parser経由)
  const tweets = await getAllTweets();
  for (const tweet of tweets) {
    // ツイートのSlugは既に "yyyy-mm-dd-hh-mm-seq" 形式になっており、プレフィックスはない
    await processPost(tweet.content, 'tweets', tweet.slug, tweet.title, backlinkMap);
  }

  return backlinkMap;
}

async function processPost(
  markdownBody: string,
  collection: string,
  slug: string,
  title: string,
  map: BacklinkMap
) {
  const tree = processor.parse(markdownBody);
  const linkedSlugs = new Set<string>();

  visit(tree, ['wikiLink', 'link'], (node: any) => {
    let targetPath = '';

    if (node.type === 'wikiLink') {
      const href = node.data.hProperties?.href;
      if (href) {
        let pathWithoutPrefix = href;
        if (href.startsWith('/scraps/')) {
           pathWithoutPrefix = href.replace(/^\/scraps\//, '');
        } else if (href.startsWith('/')) {
           pathWithoutPrefix = href.replace(/^\//, '');
        }

        targetPath = pathWithoutPrefix;
        
        // コレクション指定がないWikiLinkはデフォルトで scraps 扱いにする
        const isCrossCollection = CONTENT_COLLECTIONS.some(col => 
          col !== 'scraps' && pathWithoutPrefix.startsWith(`${col}/`)
        );
        
        if (!isCrossCollection && !pathWithoutPrefix.startsWith('scraps/')) {
          targetPath = `scraps/${pathWithoutPrefix}`;
        }
      }
    } else if (node.type === 'link') {
      const url = node.url;
      for (const col of CONTENT_COLLECTIONS) {
        if (url.startsWith(`/${col}/`)) {
          targetPath = url.replace(/^\//, '');
          break;
        }
      }
    }

    if (targetPath) {
      // console.log(`[DEBUG] Detected link: ${targetPath}`);
      linkedSlugs.add(targetPath);
    }
  });

  for (const targetSlug of linkedSlugs) {
    if (!map[targetSlug]) {
      map[targetSlug] = [];
    }
    map[targetSlug].push({
      slug: slug,
      collection: collection,
      title: title,
    });
  }
}
