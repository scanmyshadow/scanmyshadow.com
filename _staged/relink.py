import sys,re,json,os
# usage: relink.py slugs_csv rendered_dir date
slugs=open(sys.argv[1]).read().split(','); R=sys.argv[2]; D=sys.argv[3]
n=0
for s in slugs:
    f=f'blog/2026/10/{s}.html'; a=open(f,encoding='utf-8').read(); b=open(f'{R}/blog/2026/10/{s}.html',encoding='utf-8').read()
    norm=lambda x: re.sub(r'"dateModified": "[^"]*"','',x)
    rx=r'(<h2>Related Reading</h2>\s*<ul>\n?)(.*?)(\s*</ul>)'
    ma=re.search(rx,a,re.S); mb=re.search(rx,b,re.S)
    if ma and mb:
        old=re.findall(r'<li>.*?</li>',ma.group(2)); new=re.findall(r'<li>.*?</li>',mb.group(2))
        newhrefs=set(re.findall(r'href="([^"]+)"',mb.group(2)))
        extra=[li for li in old if re.search(r'href="([^"]+)"',li).group(1) not in newhrefs]
        if extra:
            b=b[:mb.end(2)]+'\n'+'\n'.join(extra)+b[mb.end(2):]
    if norm(a)==norm(b): continue
    b=re.sub(r'"dateModified": "[^"]*"',f'"dateModified": "{D}T12:00:00+05:30"',b)
    open(f,'w',encoding='utf-8').write(b); n+=1
print('relinked',n)
