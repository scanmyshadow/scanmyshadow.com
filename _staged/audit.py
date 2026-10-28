import json,re,os,subprocess,sys
S=json.load(open(sys.argv[1])); bad=0
for s in S['new']:
    t=open(f'blog/2026/10/{s}.html',encoding='utf-8').read(); iss=[]
    for k,pat in {'ga4':'G-S4P3YTNEDY','aw':'AW-18188455581','og':'og-image.png','cta':'blog-cta.js','author':'Siddharth Shankar','hook':'tldr-hook','faq':'"FAQPage"','art':'"Article"','canon':'rel="canonical"'}.items():
        if pat not in t: iss.append('no-'+k)
    if re.search('Jaishree|A unit of',t): iss.append('jaishree')
    if t.count('<h1')!=1: iss.append('h1')
    for u in set(re.findall(r'href="https://www\.scanmyshadow\.com(/[^"#?]*)"',t)):
        p='.'+u if not u.endswith('/') else '.'+u+'index.html'
        if not os.path.exists(p): iss.append('BROKEN '+u)
    if not [u for u in re.findall(r'href="(https?://[^"]+)"',t) if 'scanmyshadow' not in u and 'google' not in u]: iss.append('no-outbound')
    rel=re.search(r'<h2>Related Reading</h2>\s*<ul>(.*?)</ul>',t,re.S)
    n=len(re.findall('<li>',rel.group(1))) if rel else 0
    if n<3: iss.append('related=%d'%n)
    if '[[' in t or '\n=== ' in t: iss.append('markup-leak')
    if iss: bad+=1; print(s,iss)
print('issues',bad,'of',len(S['new']))
d=subprocess.run(['git','diff','-U0','--',*[c[0] for c in S['changed']]],capture_output=True,text=True).stdout.splitlines()
r=[l for l in d if l[:1]=='-' and l[:3]!='---']
print('uplink files',len(S['changed']),'unexpected removals',[l for l in r if 'dateModified' not in l and l.strip()!='-</ul>' and l.strip()!='-  </ul>'][:5])
