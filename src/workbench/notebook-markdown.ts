import MarkdownIt from 'markdown-it';

// HTML stays escaped, and markdown-it rejects unsafe link protocols.
const markdown = new MarkdownIt({html: false, breaks: false, linkify: false});
export function renderNotebookMarkdown(source: string): string {
  return markdown.render(source);
}
