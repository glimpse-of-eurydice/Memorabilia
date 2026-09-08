"""Read the supplied public page; save actual response and extracted text locally."""
import urllib.request
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from html.parser import HTMLParser

URL = 'https://sites.google.com/view/philosophy-texts/20th-century/phenomenology/emmanuel-levinas/ethics-as-first-philosophy'

class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'head'): self.hidden += 1
        if not self.hidden and tag in ('p', 'div', 'br', 'h1', 'h2', 'h3', 'li'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head'): self.hidden = max(0, self.hidden - 1)
        if not self.hidden and tag in ('p', 'div', 'h1', 'h2', 'h3', 'li'): self.parts.append('\n')
    def handle_data(self, data):
        if not self.hidden: self.parts.append(data)

if __name__ == '__main__':
    out = Path('web-reads') / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')
    out.mkdir(parents=True)
    meta = {'requestedUrl': URL, 'requestedAt': datetime.now(timezone.utc).isoformat()}
    try:
        req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read(5_000_001)
            if len(raw) > 5_000_000: raise ValueError('Page exceeds reader limit')
            meta.update({'finalUrl': response.url, 'status': response.status})
        (out / 'response.html').write_bytes(raw)
        parser = Text()
        parser.feed(raw.decode('utf-8'))
        text = ''.join(parser.parts)
        (out / 'page.txt').write_text(text, encoding='utf-8')
        meta.update({'sha256': hashlib.sha256(raw).hexdigest(), 'textSha256': hashlib.sha256(text.encode()).hexdigest()})
        print('Page saved to ' + str(out / 'page.txt') + '. Read any portions you wish.')
    except Exception as error:
        meta['error'] = str(error)
        raise
    finally:
        (out / 'receipt.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
