#!/usr/bin/env python3
"""Render wave posts from compact sources.
Usage: gen_wave.py render <slug,...|all> --date 2026-10-28 [--published registry.json]
Source format (src/<slug>.txt):
  key: value lines (slug,country,title,h1,desc,keywords,tags) then sections:
  === TLDR / === BODY / === FAQ / === SOURCES / === RELATED
Body mini-markdown: '## h2', '### h3', '- li', '1. li', blank-line paragraphs,
  **bold**, [text](https://..) external, [[slug|text]] internal, '> note' callout (p.note).
"""
import re, sys, json, os, html, glob
from datetime import date

W = os.path.dirname(os.path.abspath(__file__))
REPO = '/home/claude/scanmyshadow.com'
SITE = 'https://www.scanmyshadow.com'
TOP = open(f'{W}/tpl_top.html').read()
STY = open(f'{W}/tpl_styles_header.html').read()
BOT = open(f'{W}/tpl_bottom.html').read()
DT = open(f'{W}/dtable.css').read()

def existing_map():
    m = {}
    for f in glob.glob(f'{REPO}/blog/2026/*/*.html'):
        m[os.path.basename(f)[:-5]] = SITE + f[len(REPO):]
    return m

def parse(path):
    t = open(path, encoding='utf-8').read()
    parts = re.split(r'^=== (\w+)\s*$', t, flags=re.M)
    meta = {}
    for line in parts[0].strip().splitlines():
        k, v = line.split(':', 1); meta[k.strip()] = v.strip()
    for i in range(1, len(parts), 2):
        meta[parts[i]] = parts[i+1].strip()
    return meta

def esc(x): return html.escape(x, quote=True)

def inline(t, links, missing):
    t = esc(t).replace('&#x27;', '’')
    def ext(m):
        return f'<a href="{m.group(2)}" target="_blank" rel="noopener">{m.group(1)}</a>'
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', ext, t)
    def intl(m):
        slug, txt = m.group(1), m.group(2)
        if slug.startswith('/'):
            return f'<a href="{SITE}{slug}">{txt}</a>'
        u = links.get(slug)
        if not u:
            missing.append(slug); return txt
        return f'<a href="{u}">{txt}</a>'
    t = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', intl, t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    return t

def body_html(md, links, missing):
    out = []; lst = None
    blocks = re.split(r'\n\s*\n', md.strip())
    for b in blocks:
        lines = b.strip().splitlines()
        if all(re.match(r'^(- |\d+\. )', l) for l in lines):
            tag = 'ol' if re.match(r'^\d+\. ', lines[0]) else 'ul'
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(re.sub(r"^(- |\d+\. )","",l), links, missing)}</li>' for l in lines) + f'</{tag}>')
            continue
        for l in lines:
            pass
        if lines[0].startswith('## '):
            out.append(f'<h2>{inline(lines[0][3:], links, missing)}</h2>')
            rest = '\n'.join(lines[1:]).strip()
            if rest: out.append(body_html(rest, links, missing))
        elif lines[0].startswith('### '):
            out.append(f'<h3>{inline(lines[0][4:], links, missing)}</h3>')
            rest = '\n'.join(lines[1:]).strip()
            if rest: out.append(body_html(rest, links, missing))
        elif lines[0].startswith('|'):
            rows = [ [c.strip() for c in l.strip().strip('|').split('|')] for l in lines if not re.match(r'^\|\s*-', l)]
            h = ''.join(f'<th>{inline(c, links, missing)}</th>' for c in rows[0])
            r = ''.join('<tr>' + ''.join(f'<td>{inline(c, links, missing)}</td>' for c in row) + '</tr>' for row in rows[1:])
            out.append(f'<div class="dtable-wrap"><table class="dtable"><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table></div>')
        elif lines[0].startswith('> '):
            out.append(f'<p class="note">{inline(" ".join(l[2:] for l in lines), links, missing)}</p>')
        else:
            out.append(f'<p>{inline(" ".join(lines), links, missing)}</p>')
    return '\n'.join(out)

def faq_list(t):
    qs = re.findall(r'^Q:\s*(.+?)\nA:\s*(.+?)(?=\nQ:|\Z)', t.strip(), flags=re.S|re.M)
    return [(q.strip(), ' '.join(a.split())) for q, a in qs]

def plain(t):
    t = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', t)
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', t)
    return t.replace('**', '')

def render(slug, d, links):
    p = parse(f'{W}/src/{slug}.txt')
    assert p['slug'] == slug, slug
    missing = []
    folder = d.strftime('%Y/%m')
    url = f'{SITE}/blog/{folder}/{slug}.html'
    title, h1, desc, kw = p['title'], p.get('h1', p['title']), p['desc'], p['keywords']
    faqs = faq_list(p['FAQ'])
    iso = d.isoformat() + 'T12:00:00+05:30'
    pretty = d.strftime('%B ') + str(d.day) + d.strftime(', %Y')
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article", "headline": h1, "description": desc,
         "datePublished": iso, "dateModified": iso, "image": SITE + "/og-image.png",
         "author": {"@id": SITE + "/#organization"}, "publisher": {"@id": SITE + "/#organization"},
         "mainEntityOfPage": url, "keywords": kw},
        {"@type": "Organization", "@id": SITE + "/#organization", "name": "Scan My Shadow", "url": SITE + "/",
         "logo": {"@type": "ImageObject", "url": SITE + "/logo.png"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": title}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": plain(q), "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in faqs]}]}
    ld = json.dumps(graph, indent=2, ensure_ascii=False).replace('</', '<\\/')
    head = f'''<title>{esc(title)}</title>
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
<meta name="description" content="{esc(desc)}">
<meta name="keywords" content="{esc(kw)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}/og-image.png">
<link rel="canonical" href="{url}">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S4P3YTNEDY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-S4P3YTNEDY');gtag('config','AW-18188455581');
</script>
<script type="application/ld+json">
{ld}
</script>
'''
    tags = ''.join(f'<span class="tag-pill">{esc(t.strip())}</span>' for t in p['tags'].split('|'))
    # body with mid CTA before middle content H2
    body = body_html(p['BODY'], links, missing)
    h2s = [m.start() for m in re.finditer(r'<h2>', body)]
    if len(h2s) >= 2:
        pos = h2s[len(h2s)//2]
        body = body[:pos] + '<div class="sms-cta" data-sms-cta="mid"></div>\n' + body[pos:]
    tldr = inline(' '.join(p['TLDR'].split()), links, missing)
    faq_html = '<h2>Frequently Asked Questions</h2>\n' + '\n'.join(
        f'<h3>{inline(q, links, missing)}</h3>\n<p>{inline(a, links, missing)}</p>' for q, a in faqs)
    src = []
    for line in p['SOURCES'].splitlines():
        if not line.strip(): continue
        u, lab = [x.strip() for x in line.split('|', 1)]
        src.append(f'<li><a href="{u}" target="_blank" rel="noopener">{esc(lab)}</a></li>')
    rel = []
    for line in p['RELATED'].splitlines():
        line = line.strip()
        if not line: continue
        s2, lab = [x.strip() for x in line.split('|', 1)]
        if s2 in links: rel.append(f'<li><a href="{links[s2]}">{esc(lab)}</a></li>')
        else: missing.append('REL:' + s2)
    content = f'''<div class="tldr">
  <p><strong>TL;DR:</strong> {tldr}</p>
</div>
<div class="sms-cta" data-sms-cta="tldr"><p class="tldr-hook">👉 <a href="https://www.scanmyshadow.com/digital-footprint-checker/">Check my digital footprint — free 30-second check →</a></p></div>
<script src="/assets/blog-cta.js"></script>
{body}
{faq_html}

<h2>Sources</h2>
<ul>
{chr(10).join(src)}
</ul>
<h2>Related Reading</h2>
<ul>
{chr(10).join(rel)}
</ul>
'''
    author = f'<div class="meta-row"><a href="/about.html" class="post-author" style="display:inline-flex;align-items:center;gap:10px;vertical-align:middle;color:inherit;font-weight:inherit;border-bottom:0;text-decoration:none;white-space:nowrap"><img src="/assets/siddharth-avatar.jpg" width="36" height="36" alt="Siddharth Shankar" decoding="async" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex:none"><span>By <span style="text-decoration:underline;text-underline-offset:3px">Siddharth Shankar</span></span></a> &middot; {pretty}</div>'
    sty = STY
    extra = ''
    if 'dtable' in body: extra += DT
    if 'class="note"' in body: extra += '.post-content p.note{background:var(--bg-tint);border-radius:10px;padding:12px 14px;font-size:15px}'
    if extra: sty = sty.replace('</style><body>', '</style>\n<style>' + extra + '</style>\n<body>', 1)
    page = TOP + head + sty + f'''<div class="wrap">
  <div class="breadcrumb"><a href="https://www.scanmyshadow.com/">Home</a> / <a href="/blog/">Blog</a> / {esc(title)}</div>
</div>

<article class="wrap">
  <div class="eyebrow">Privacy Blog</div>
  <h1 class="title">{esc(h1)}</h1>
  {author}
  <div class="tag-row">{tags}</div>

  <div class="hero-img-slot" data-slug="{slug}"></div>

  <div class="post-content">
{content}
  </div>
''' + BOT
    return url, page, missing, p

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'render':
        slugs = sys.argv[2]
        d = date.fromisoformat(sys.argv[sys.argv.index('--date')+1])
        reg = {}
        if '--published' in sys.argv:
            reg = json.load(open(sys.argv[sys.argv.index('--published')+1]))
        links = existing_map(); links.update(reg)
        allsl = [os.path.basename(f)[:-4] for f in sorted(glob.glob(f'{W}/src/*.txt'))] if slugs == 'all' else slugs.split(',')
        # same-batch posts can link each other
        folder = d.strftime('%Y/%m')
        for s in allsl: links.setdefault(s, f'{SITE}/blog/{folder}/{s}.html')
        outdir = sys.argv[sys.argv.index('--out')+1] if '--out' in sys.argv else f'{W}/out'
        for s in allsl:
            url, page, missing, p = render(s, d, links)
            os.makedirs(f'{outdir}/blog/{folder}', exist_ok=True)
            open(f'{outdir}/blog/{folder}/{s}.html', 'w', encoding='utf-8').write(page)
            if missing: print('MISSING', s, missing)
        print('rendered', len(allsl))
