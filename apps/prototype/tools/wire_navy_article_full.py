"""Owner report, 16 Nov 2026: library articles said "2 min read" but showed only a definition and one line. Each article in
packages/sample-data already has its full written sections (key points, how-to steps, an example, a common mistake); the
article screens now show them, and the read time is counted from the words on screen (200 words a minute, at least 1 minute).
Styles reuse the article boards' own headings, body text, lists and example card. Idempotent. Usage: wire_navy_article_full.py <site>"""
import os, sys
SITE = sys.argv[1]

# Read time from what the article screen shows.
p = os.path.join(SITE, 'fv.js'); s = open(p).read()
old = s[s.index('    minutes: function (a) {'):]; old = old[:old.index('\n') + 1]
new = '''    /** Minutes to read the article as the screen shows it: 200 words a minute, at least 1 (owner report, 16 Nov 2026). */
    minutes: function (a) { var d = a.deep || {}, h = d.how || {}, x = d.example || {}, f = d.formula || {}, m = d.mistake || {};
      var parts = [a.definition, a.whyItMatters].concat(d.takeaways || [], [h.title, h.intro], h.steps || [], [x.line, x.note], (x.rows || []).map(function (r) { return r.join(" "); }), [f.intro, f.rule, f.calc, f.note, m.myth, m.fact]);
      var w = parts.filter(Boolean).join(" ").split(/\\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(w / 200)); },
'''
if 'at least 1 (owner report' not in s: s = s.replace(old, new); open(p, 'w').write(s); print('fv.js: read time from shown words')

VALS = """
    /* article-full */ const dd = a.deep || {}, hw = dd.how || {}, xe = dd.example || {}, mk = dd.mistake || {};
    const full = { keys: (dd.takeaways || []).map((t) => ({ t })), hasKeys: !!(dd.takeaways || []).length,
      hasHow: !!(hw.steps || []).length, howT: hw.title || 'How it works', howI: hw.intro || '', steps: (hw.steps || []).map((t, i) => ({ n: String(i + 1), t })),
      hasXe: !!(xe.rows || []).length, xeLine: xe.line || '', xeRows: (xe.rows || []).map((r) => ({ k: r[0], v: r[1] })), xeNote: xe.note || '',
      hasMk: !!mk.myth, myth: mk.myth || '', fact: mk.fact || '' };"""

def sections(h2, p, gap):
    li = 'font-size: ' + p[0] + '; line-height: 1.6; color: #334155'
    return (
        '<sc-if value="{{hasKeys}}" hint-placeholder-val="{{ true }}"><h2 style="' + h2 + '">Key points</h2>'
        '<ul style="margin: 8px 0 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px"><sc-for list="{{keys}}" as="k"><li style="' + li + '">{{k.t}}</li></sc-for></ul></sc-if>'
        '<sc-if value="{{hasHow}}" hint-placeholder-val="{{ true }}"><h2 style="' + h2 + '">{{howT}}</h2><p style="margin: 8px 0 0; ' + li + '">{{howI}}</p>'
        '<ol style="margin: 10px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px"><sc-for list="{{steps}}" as="st"><li style="display: flex; gap: 12px; align-items: flex-start; ' + li + '">'
        '<span style="width: 26px; height: 26px; flex: none; border-radius: 999px; background: #E8EBEF; display: flex; align-items: center; justify-content: center; font-family: \'Geist Mono\', monospace; font-size: 12px; color: #0B192C">{{st.n}}</span><span style="padding-top: 1px">{{st.t}}</span></li></sc-for></ol></sc-if>'
        '<sc-if value="{{hasXe}}" hint-placeholder-val="{{ true }}"><h2 style="' + h2 + '">Example</h2><p style="margin: 8px 0 0; ' + li + '">{{xeLine}}</p>'
        '<div style="margin-top: 10px; border: 1px solid #E5E7EB; border-radius: 14px; background: #FFFFFF; overflow: hidden"><sc-for list="{{xeRows}}" as="r"><div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #EDEFF2; font-size: 15px"><span style="color: #334155">{{r.k}}</span><span style="font-family: \'Geist Mono\', monospace; color: #0B192C">{{r.v}}</span></div></sc-for>'
        '<p style="margin: 0; padding: 12px 16px; font-size: 13px; line-height: 1.5; color: #5B6577">{{xeNote}}</p></div></sc-if>')

MISTAKE_TPL = lambda h2, p: ('<sc-if value="{{hasMk}}" hint-placeholder-val="{{ true }}"><h2 style="' + h2 + '">A common mistake</h2>'
    '<p style="margin: 8px 0 0; font-size: ' + p[0] + '; line-height: 1.6; color: #334155"><strong style="font-weight: 600; color: #B9473F">Myth:</strong> {{myth}}</p>'
    '<p style="margin: 6px 0 0; font-size: ' + p[0] + '; line-height: 1.6; color: #334155"><strong style="font-weight: 600; color: #047857">Fact:</strong> {{fact}}</p></sc-if>')

BOARDS = {
    'ArticleNavy.dc.html': ('margin: 24px 0 0; font-size: 18px; font-weight: 600', ('16px',),
        '<h2 style="margin: 24px 0 0; font-size: 18px; font-weight: 600">Why it matters</h2>',
        '<p style="margin: 8px 0 0; font-size: 16px; line-height: 1.6; color: #334155">{{why}}</p>',
        "    return Object.assign({ rule: '', op: '÷', l1: '', l2: '', l3: '', v1: '', v2: '', v3: '', fNote: '' }, fig, {",
        "    return Object.assign({ rule: '', op: '÷', l1: '', l2: '', l3: '', v1: '', v2: '', v3: '', fNote: '' }, full, fig, {"),
    'ArticleLaptopNavy.dc.html': ('margin: 28px 0 0; font-size: 20px; font-weight: 600', ('17px',),
        '<h2 style="margin: 28px 0 0; font-size: 20px; font-weight: 600">Why it matters</h2>',
        '<p style="margin: 8px 0 0; font-size: 17px; line-height: 1.65; color: #334155">{{why}}</p>',
        "    return Object.assign(fig, {", "    return Object.assign(full, fig, {"),
}
for f, (h2, ptxt, why_h2, why_p, ret_old, ret_new) in BOARDS.items():
    p = os.path.join(SITE, f); s = open(p).read()
    if '/* article-full */' in s: continue
    assert s.count(why_h2) == 1 and s.count(why_p) == 1 and s.count(ret_old) == 1, f
    s = s.replace(why_h2, sections(h2, ptxt, None) + why_h2, 1)
    s = s.replace(why_p, why_p + MISTAKE_TPL(h2, ptxt), 1)
    s = s.replace(ret_old, VALS + '\n' + ret_new, 1)
    if f == 'ArticleLaptopNavy.dc.html':  # the deep example now has its own section; the one-line example would repeat it
        s = s.replace("hasEx: !!a.example,", "hasEx: !!a.example && !((a.deep || {}).example || {}).rows,", 1)
    open(p, 'w').write(s); print('full article on', f)
