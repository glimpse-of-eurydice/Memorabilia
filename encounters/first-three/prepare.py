"""Mechanical, local-only conversion of the two user-provided books.

Requires pypdf. No network calls; preserves originals and source order.
Run with --weil PATH --krishnamurti PATH. Refuses to overwrite a package.
"""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
import shutil
import zipfile
import xml.etree.ElementTree as ET

from pypdf import PdfReader


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'head'):
            self.hidden += 1
        if not self.hidden and tag in ('p', 'div', 'br', 'h1', 'h2', 'h3', 'li'):
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head'):
            self.hidden = max(0, self.hidden - 1)
        if not self.hidden and tag in ('p', 'div', 'h1', 'h2', 'h3', 'li'):
            self.parts.append('\n')

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(source, destination, kind):
    destination.mkdir(parents=True, exist_ok=False)
    original = destination / ('original.' + kind)
    shutil.copyfile(source, original)
    chunks = []
    if kind == 'pdf':
        reader = PdfReader(source)
        for i, page in enumerate(reader.pages, 1):
            chunks.append((f'page-{i:03}.txt', f'PDF page {i}', page.extract_text() or ''))
    else:
        with zipfile.ZipFile(source) as archive:
            container = ET.fromstring(archive.read('META-INF/container.xml'))
            opf = next(x.attrib['full-path'] for x in container.iter() if x.tag.endswith('rootfile'))
            root = ET.fromstring(archive.read(opf))
            ns = {'o': 'http://www.idpf.org/2007/opf'}
            items = {x.attrib['id']: x.attrib['href'] for x in root.findall('o:manifest/o:item', ns)}
            for i, item in enumerate(root.findall('o:spine/o:itemref', ns), 1):
                member = str(PurePosixPath(opf).parent / items[item.attrib['idref']])
                parser = Text()
                parser.feed(archive.read(member).decode('utf-8-sig'))
                chunks.append((f'section-{i:03}.txt', member, ''.join(parser.parts).strip()))
    rows = []
    for name, origin, content in chunks:
        path = destination / name
        path.write_text(content + '\n', encoding='utf-8')
        rows.append({'file': name, 'sourceLocation': origin, 'words': len(content.split()),
                     'sha256': sha(path), 'emptyText': not content.strip()})
    (destination / 'index.json').write_text(json.dumps({
        'original': original.name, 'sourceSha256': sha(original),
        'extraction': 'mechanical; no summary or semantic rewriting',
        'totalWords': sum(x['words'] for x in rows), 'parts': rows,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(destination.name, len(rows), 'parts;', sum(x['words'] for x in rows), 'words')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--weil', type=Path, required=True)
    parser.add_argument('--krishnamurti', type=Path, required=True)
    args = parser.parse_args()
    for source in (args.weil, args.krishnamurti):
        if not source.is_file():
            parser.error(f'Missing source: {source}')
    base = Path(__file__).resolve().parent / 'local-materials'
    if any((base / name).exists() for name in ('E001', 'E003')):
        parser.error('Existing package: choose a new version; do not overwrite.')
    prepare(args.weil, base / 'E001', 'pdf')
    prepare(args.krishnamurti, base / 'E003', 'epub')
