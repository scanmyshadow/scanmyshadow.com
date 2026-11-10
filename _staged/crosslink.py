import re,glob,os,json,collections,sys,html
R='/home/claude/mainwt'; APPLY=len(sys.argv)>1 and sys.argv[1]=='apply'; DATE='2026-11-10'; SITE='https://www.scanmyshadow.com'
wave=set(s for b in json.load(open('/home/claude/wave/batches.json')) for s in b)
STOP=set('the a an of to in on and or for how what is are do does your you with from by at this that it its my i be can will not no if as when why who which after before about into out up new via vs get guide explained explain scam scams text texts email emails what-to-do'.split())
CC={'uk':'UK','canada':'CA','australia':'AU','nz':'NZ','us':'US','usa':'US','india':'IN'}
posts={}
for f in glob.glob(f'{R}/blog/*/*/*.html'):
    s=os.path.basename(f)[:-5]; t=open(f,encoding='utf-8').read()
    m=re.search(r'<h1[^>]*>(.*?)</h1>',t,re.S); title=html.unescape(re.sub('<[^>]+>','',m.group(1))).strip() if m else s
    k=re.search(r'<meta name="keywords" content="([^"]*)"',t); kw=k.group(1) if k else ''
    c='X'
    for w_ in s.split('-'):
        if w_ in CC: c=CC[w_]; break
        if w_=='australia' : c='AU'; break
    if c=='X':
        if re.search(r'India|UPI|Aadhaar|DPDP|lakh|crore|Hyderabad|Mumbai|Delhi|Bengal|Bengaluru|Rs\\.|₹|Pune|Chennai|Kolkata|Gujarat|Maharashtra',title+' '+s): c='IN'
    toks=set(w for w in re.findall(r'[a-z0-9]+',(s.replace('-',' ')+' '+title+' '+kw).lower()) if w not in STOP and len(w)>2)
    posts[s]=dict(f=f,t=t,title=title,c=c,toks=toks)
out=collections.defaultdict(set); inb=collections.defaultdict(set)
for s,p in posts.items():
    for m in set(re.findall(r'/blog/\d{4}/\d{2}/([a-z0-9-]+)\.html',p['t'])):
        if m!=s and m in posts: out[s].add(m); inb[m].add(s)
def score(a,b):
    A,B=posts[a],posts[b]; ov=A['toks']&B['toks']
    if not ov: return 0
    sc=sum(1.0+(0.5 if len(w)>6 else 0) for w in ov)
    if A['c']==B['c']: sc+=1.5
    elif 'X' in (A['c'],B['c']): sc+=0.3
    else: sc-=2
    return sc
old=[s for s in posts if s not in wave]
MINSC=2.2; TARGET_IN=3; TARGET_OUT=2; OLDCAP=4
oldrecv=collections.Counter(); adds=collections.defaultdict(list)  # target post -> [slug to link]
def relsrc(w):
    t=open(f'/home/claude/wave/src/{w}.txt',encoding='utf-8').read().split('=== RELATED')[1]
    return [l.split('|')[0].strip() for l in t.strip().splitlines() if '|' in l]
for w in sorted(wave):
    n=0
    for o in relsrc(w):
        if o in old and w not in out[o] and oldrecv[o]<OLDCAP and n<3 and re.search(r'<h2>Related Reading</h2>\s*<ul>',posts[o]['t']):
            adds[o].append(w); oldrecv[o]+=1; out[o].add(w); n+=1
for w in sorted(wave, key=lambda s:len([x for x in inb[s] if x not in wave])):
    have=len([x for x in inb[w] if x not in wave])
    need=TARGET_IN-have
    if need>0:
        cands=sorted(((score(o,w),o) for o in old if w not in out[o] and oldrecv[o]<OLDCAP and re.search(r'<h2>Related Reading</h2>\s*<ul>',posts[o]['t'])),reverse=True)
        for sc,o in cands:
            if need<=0 or sc<MINSC: break
            adds[o].append(w); oldrecv[o]+=1; need-=1; out[o].add(w)
    haveout=len([x for x in out[w] if x not in wave])
    n=TARGET_OUT-haveout
    if n>0:
        cands=sorted(((score(w,o),o) for o in old if o not in out[w]),reverse=True)
        for sc,o in cands:
            if n<=0 or sc<MINSC: break
            adds[w].append(o); out[w].add(o); n-=1
# stats
print('targets with adds',len(adds),'links',sum(len(v) for v in adds.values()))
lowin=[w for w in wave if len([x for x in (inb[w]|{o for o,v in adds.items() if w in v}) if x not in wave])<2]
print('wave still <2 nonwave inbound:',lowin)
lowout=[w for w in wave if len([x for x in out[w] if x not in wave])<2]
print('wave still <2 outbound to older:',lowout)
if APPLY:
    n=0
    for tgt,ls in adds.items():
        p=posts[tgt]; t=p['t']
        m=re.search(r'(<h2>Related Reading</h2>\s*<ul>\n?)(.*?)(\s*</ul>)',t,re.S)
        if not m: print('NO REL',tgt); continue
        add=''
        for s in ls:
            ym=re.search(r'blog/(\d{4}/\d{2})/',posts[s]['f']).group(1)
            u=f'{SITE}/blog/{ym}/{s}.html'
            if u in t: continue
            add+=f'<li><a href="{u}">{html.escape(posts[s]["title"],quote=False)}</a></li>\n'
        if not add: continue
        t=t[:m.end(2)]+('\n' if not m.group(2).endswith('\n') else '')+add.rstrip('\n')+t[m.end(2):]
        t=re.sub(r'("dateModified"\s*:\s*")[^"]*(")',r'\g<1>'+DATE+r'T12:00:00+05:30\2',t)
        open(p['f'],'w',encoding='utf-8').write(t); n+=1
    print('written',n)
json.dump({k:v for k,v in adds.items()},open('/tmp/claude-0/cl/adds.json','w'),indent=1)
