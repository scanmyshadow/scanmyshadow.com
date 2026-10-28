import sys,re,glob,json,os,shutil
W='/home/claude/wave'; R=sys.argv[1]; OUT=sys.argv[2]; BI=int(sys.argv[3]); DATE=sys.argv[4]; import datetime; _d=datetime.date.fromisoformat(DATE); DLAB=_d.strftime('%B ')+str(_d.day)+_d.strftime(', %Y'); DLONG=_d.strftime('%b ')+str(_d.day)+_d.strftime(', %Y')
SITE='https://www.scanmyshadow.com'
slugs=json.load(open(f'{W}/batches.json'))[BI]
def meta(s):
    t=open(f'{W}/src/{s}.txt',encoding='utf-8').read()
    h=dict(re.findall(r'^(\w+): (.*)$',t.split('=== TLDR')[0],re.M))
    rel=[l.split('|')[0].strip() for l in t.split('=== RELATED')[1].strip().splitlines() if '|' in l]
    return h,rel
newset=set(slugs)
existing=set()
for f in glob.glob(f'{R}/blog/*/*/*.html'): existing.add(os.path.basename(f)[:-5])
done=set(os.path.basename(f)[:-5] for f in glob.glob(f'{R}/blog/2026/10/*.html'))
todo=[s for s in slugs if s not in done]
print('new',len(todo))
for s in todo: shutil.copy(f'{OUT}/blog/2026/10/{s}.html',f'{R}/blog/2026/10/{s}.html')
# index cards (insert so first of batch ends up... order: reverse so list order preserved)
p=f'{R}/blog/index.html'; t=open(p,encoding='utf-8').read(); marker='  <div class="post-grid" id="postGrid">\n'
cards=''
for s in todo:
    h,_=meta(s); tags=h['tags'].split('|')[:2]
    pills=''.join(f'<span class="tag-pill">{x}</span>' for x in tags)
    title=h['title'].replace('&','&amp;'); d=h['desc'].replace('&','&amp;')
    cards+=f'''    <a class="post-card" href="{SITE}/blog/2026/10/{s}.html">
      <div class="post-card-top">
        <span class="post-date">{DLAB}</span>
        <div class="post-tags">{pills}</div>
      </div>
      <h2 class="post-title">{title}</h2>
      <p class="post-excerpt">{d}</p>
      <span class="post-read">Read more &rarr;</span>
    </a>

'''
assert t.count(marker)==1
t=t.replace(marker,marker+cards,1); open(p,'w',encoding='utf-8').write(t)
# sitemap
p=f'{R}/blog/sitemap.xml'; t=open(p).read()
ent=''.join(f'  <url>\n    <loc>{SITE}/blog/2026/10/{s}.html</loc>\n    <lastmod>{DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' for s in todo)
t=t.replace('</urlset>',ent+'</urlset>'); open(p,'w').write(t)
# llms
names={'US':'United States','UK':'United Kingdom','CA':'Canada','AU':'Australia','NZ':'New Zealand'}
p=f'{R}/llms.txt'; t=open(p,encoding='utf-8').read()
for c in ['US','UK','CA','AU','NZ']:
    lines=''.join(f"- [{meta(s)[0]['title']}]({SITE}/blog/2026/10/{s}.html)\n" for s in todo if meta(s)[0]['country']==c)
    if not lines: continue
    head=f'## {names[c]} scam news (added {DLONG})\n'
    if head in t: t=t.replace(head,head+lines,1)
    else: t=t.replace('## Optional\n',head+lines+'\n## Optional\n',1)
open(p,'w',encoding='utf-8').write(t)
# uplinks: existing posts from each new post's RELATED
ups={}
for s in slugs:
    h,rel=meta(s)
    for r in rel:
        if r in existing and r not in newset: ups.setdefault(r,[]).append(s)
# choose: each new post gets up to 2 uplinks, each existing post max 2 additions
cnt={}; plan={}
for s in slugs:
    h,rel=meta(s); n=0
    for r in rel:
        if r in existing and r not in newset and cnt.get(r,0)<2 and n<2:
            plan.setdefault(r,[]).append(s); cnt[r]=cnt.get(r,0)+1; n+=1
changed=[]
for r,ss in plan.items():
    f=glob.glob(f'{R}/blog/*/*/{r}.html')[0]; t=open(f,encoding='utf-8').read()
    m=re.search(r'(<h2>Related Reading</h2>\s*<ul>\n)(.*?)(</ul>)',t,re.S)
    if not m: print('NO RELATED',r); continue
    add=''
    for s in ss:
        u=f'{SITE}/blog/2026/10/{s}.html'
        if u in t: continue
        add+=f'<li><a href="{u}">{meta(s)[0]["title"].replace("&","&amp;")}</a></li>\n'
    if not add: continue
    t=t[:m.end(2)]+add+t[m.end(2):]
    t=re.sub(r'("dateModified"\s*:\s*")[^"]*(")',r'\g<1>'+DATE+r'T12:00:00+05:30\2',t)
    open(f,'w',encoding='utf-8').write(t); changed.append((os.path.relpath(f,R),len(ss)))
json.dump({'new':todo,'changed':changed},open(f'/tmp/claude-0/b{BI+1}_summary.json','w'))
print('uplinked',len(changed))
