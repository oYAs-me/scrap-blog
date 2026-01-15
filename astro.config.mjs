// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import wikiLinkPlugin from 'remark-wiki-link';

// https://astro.build/config
export default defineConfig({
  // Enable math support in Markdown files
  markdown: {
    remarkPlugins: [
      remarkMath,
      [wikiLinkPlugin, { 
        /** @param {string} permalink */
        hrefTemplate: (permalink) => `/scraps/${permalink}`,
        aliasDivider: '|'
      }],
    ],
    rehypePlugins: [rehypeKatex],
  },
});
