// src/pages/feed.xml.ts
import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';
// We'll assume that our feed is located at src/pages/feed.xml
// and our blog posts are all located in the src/pages/posts folder

// import all markdown files with Vite's import.meta.glob
// synchronously from our posts folder. If we don't set
// `eager` to `true` below, this function will be lazy-loaded
// with a dynamic import instead which we don't want
const posts = Object.values(
  import.meta.glob('./posts/**/*.md', {
    eager: true, 
  }),
);

// SITE will use "site" from your project's astro.config.
const SITE = import.meta.env.SITE;

// set up some custom XML tags to inject into the RSS feed
const customDataTags = [
  // enable Atom feed, as some RSS readers use that format
  // https://www.fpds.gov/wiki/index.php/FAADC_Atom_Feed_Specifications_V_1.0
  `<atom:link href="${SITE}feed.xml" rel="self" type="application/rss+xml" />`,
  // enable language metadata
  `<language>en-us</language>`,
];

// We need to export a default `get` function from this file in order
// to hook into Astro's Static File Endpoints feature which will
// generate our `feed.xml` file at build time for us
// https://docs.astro.build/en/core-concepts/endpoints/
export const get = () =>
  rss({
    // \u2019 is the unicode code for an apostrophe
    title: 'Ron Bronson',
    description: 'Assorted musings on technology, design, coaching & more.',
    site: SITE,
    items: posts.map((post) => {
        // get the compiled HTML output from our post from the
        // `compiledContent()` function in our post. Then let's sanitize and
        // encode the post properly for use in the <content:encoded> tag
        // we'll include below in the RSSFeedItem object that we're returning
        // https://docs.astro.build/en/guides/rss/#1-importmetaglob-result
        const postHTML = sanitizeHtml(post.compiledContent());

        return {
          title: post.frontmatter.title,
          link: post.url,
          pubDate: new Date(post.frontmatter.pubDate),
          description: descriptionOrExcerpt,
          customData: `<content:encoded><![CDATA[${postHTML}]]></content:encoded>`,
        };
      }),
    // inject custom tags defined above as a string so that we have support
    // for the Atom feed standard and give RSS readers information about what
    // language our posts are in
    customData: customDataTags.join(''),
    // inject the `xmlns:content` attribute with the namespace that defines
    // how the <content:encoded> element should work (as it's not part of
    // the RSS 2.0 spec by default)
    xmlns: {
      // the namespace that enables Atom feed
      atom: 'http://www.w3.org/2005/Atom',
      // the namespace that enables the <content:encoding> tag
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
  });