import re, json, sys
lines = open(sys.argv[1]).read().split('\n')
start, end = int(sys.argv[2]), int(sys.argv[3])
mid = None
rows = []
for ln in lines[start:end]:
    if 'qsi' in ln and 'qvi' in ln:
        a = ln.index('qsi'); b = ln.index('qvi'); mid = (a + b + 3) / 2; continue
    if mid is None: continue
    m = re.match(r'^\s{2,8}(\S.*?)\s*(?:\.\s?){2,}\.?\s+(.*)$', ln)
    if not m:
        m = re.match(r'^\s{2,8}(\S.*?\S)\s{3,}(\d[\d.]*\s+(?:Alto|Médio|Baixo).*)$', ln)
        if not m: continue
    name = m.group(1).strip().rstrip('.').strip()
    rest_start = ln.index(m.group(2)) if m.group(2) else len(ln)
    toks = [(x.start() + rest_start, x.group(1), x.group(2)) for x in re.finditer(r'(\d[\d.]*)\s+(Alto|Médio|Baixo)', m.group(2))]
    if not toks: continue
    r = {'a': name}
    for pos, v, rai in toks:
        val = int(v.replace('.', ''))
        if pos < mid: r['qs'] = val; r['rs'] = rai
        else: r['qv'] = val; r['rv'] = rai
    rows.append(r)
json.dump(rows, sys.stdout, ensure_ascii=False)
