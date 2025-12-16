import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitiseHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt();

export async function GET(context) {
  const blog = await getCollection('blog');
  return rss({
    title: 'Andrew\'s Blog',
    description: 'Random diversions. Updated very infrequently.',
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
		pubDate: post.data.publicationDate,
		description: post.data.description,
		link: `${post.slug}`,
		content: sanitiseHtml(parser.render(post.body)),
    })),
    customData: `<language>en-au</language>`,
  });
}
