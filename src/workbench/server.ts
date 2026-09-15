import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import type {WorkbenchReader} from './types.js';

const assets = new Map([
  ['/', ['../../web/workbench/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['../../web/workbench/styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['../../web/workbench/app.js', 'text/javascript; charset=utf-8']],
  ['/graph.js', ['../../web/workbench/graph.js', 'text/javascript; charset=utf-8']],
  ['/select-at.js', ['../workbench/select-at.js', 'text/javascript; charset=utf-8']],
  ['/notebook-markdown.js', ['dist/workbench/notebook-markdown.js', 'text/javascript; charset=utf-8']],
  ['/vendor/markdown-it.mjs', ['node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs', 'text/javascript; charset=utf-8']],
]);
// Resolve web assets from the repository root; compiled modules live in dist.
const root = new URL('../../', import.meta.url);

export function createWorkbenchServer(reader: WorkbenchReader) {
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
    const send = (status: number, data: unknown) => {res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'}); res.end(JSON.stringify(data));};
    if (req.method !== 'GET') {send(405, {error: 'Read-only workbench'}); return;}
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname === '/api/encounters') {send(200, await reader.listEncounters()); return;}
      if (url.pathname === '/api/encounter' || url.pathname === '/api/probes') {
        const id = url.searchParams.get('id');
        if (!id || !/^[\w-]+\/[\w-]+\/t\d+$/.test(id)) {send(400, {error: 'Invalid encounter ID'}); return;}
        if (url.pathname === '/api/probes') {send(200, {markdown: reader.getProbeMarkdown ? await reader.getProbeMarkdown(id) : null}); return;}
        send(200, await reader.getEncounter(id)); return;
      }
      const asset = assets.get(url.pathname);
      if (!asset) {send(404, {error: 'Not found'}); return;}
      const [path, contentType] = asset;
      const target = url.pathname === '/select-at.js'
        ? new URL('./select-at.js', import.meta.url)
        : new URL(path!.replace('../../', ''), root);
      const content = url.pathname === '/notebook-markdown.js'
        ? (await readFile(fileURLToPath(target), 'utf8')).replace("from 'markdown-it'", "from '/vendor/markdown-it.mjs'")
        : await readFile(fileURLToPath(target));
      res.writeHead(200, {'Content-Type': contentType!}); res.end(content);
    } catch (error) {
      console.error('[workbench]', error);
      send(500, {error: '无法读取 encounter。请检查本地数据和终端记录。'});
    }
  });
}
