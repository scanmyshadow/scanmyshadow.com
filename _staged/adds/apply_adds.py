#!/usr/bin/env python3
"""Apply section additions to existing posts (additions only).
Usage: apply_adds.py --repo DIR --date YYYY-MM-DD [--published registry.json] [--dry]
Inserts a new section before the FAQ heading (or before Sources if FAQ comes later),
appends source <li>s to the Sources list, and bumps dateModified."""
import sys, os, re, json, glob, argparse
sys.path.insert(0, '/home/claude/wave')
import gen_wave as G
ap = argparse.ArgumentParser(); ap.add_argument('--repo', default=G.REPO); ap.add_argument('--date', required=True)
ap.add_argument('--published'); ap.add_argument('--dry', action='store_true'); a = ap.parse_args()
G.REPO = a.repo
links = G.existing_map()
if a.published: links.update(json.load(open(a.published)))
A = json.load(open(os.path.join(os.path.dirname(__file__), 'adds.json')))
for slug, (md, srcs) in A.items():
    fs = glob.glob(f'{a.repo}/blog/*/*/{slug}.html'); assert len(fs) == 1, (slug, fs); f = fs[0]
    h = open(f, encoding='utf-8').read()
    missing = []; sec = G.body_html(md, links, missing)
    if missing: print('MISSING', slug, missing)
    first_h2 = re.search(r'<h2>[^<]*</h2>', sec).group(0)
    if first_h2 in h: print('SKIP already applied', slug); continue
    m_faq = re.search(r'<h2>(Frequently Asked Questions|FAQs)</h2>', h); m_src = re.search(r'<h2>Sources</h2>', h)
    anchor = m_faq if (m_faq and m_faq.start() < m_src.start()) else m_src
    h = h[:anchor.start()] + sec + '\n' + h[anchor.start():]
    m_src = re.search(r'<h2>Sources</h2>\s*<ul>', h)
    end = h.index('</ul>', m_src.end())
    lis = ''.join(f'<li><a href="{u.strip()}" target="_blank" rel="noopener">{G.esc(t.strip())}</a></li>\n' for u, t in (s.split(' | ', 1) for s in srcs) if u.strip() not in h)
    h = h[:end] + lis + h[end:]
    h = re.sub(r'("dateModified":\s*")[^"]*(")', lambda m: m.group(1) + a.date + 'T12:00:00+05:30' + m.group(2), h)
    if a.dry: print('OK', slug, os.path.relpath(f, a.repo))
    else: open(f, 'w', encoding='utf-8').write(h); print('APPLIED', slug)
