// コンテンツコレクション名の定義
export const CONTENT_COLLECTIONS = ['scraps', 'articles', 'tweets'] as const;
export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number];

/**
 * Wiki Link (remark-wiki-link) の共有設定
 */
export const wikiLinkSettings = {
  hrefTemplate: (permalink: string) => {
    for (const col of CONTENT_COLLECTIONS) {
      if (permalink.startsWith(`${col}/`)) {
        return `/${permalink}`;
      }
    }
    return `/scraps/${permalink}`;
  },
  aliasDivider: '|',
  pageResolver: (name: string) => [name.replace(/ /g, '-').toLowerCase()],
};