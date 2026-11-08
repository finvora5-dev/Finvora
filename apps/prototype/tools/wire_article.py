"""Articles with full sections (article.deep): highlighted lead, takeaways, how it works with numbered steps,
a worked example table, the key formula and a common mistake, using the designed Dividend article's markup.
Articles without deep data keep the shorter layout. Usage: python3 wire_article.py <site folder>"""
import sys, os
SITE = sys.argv[1]
p = os.path.join(SITE, 'UPArticle.dc.html'); s = open(p).read()
ALREADY = '{{deepOn}}' in s
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing: ' + a[:90])
    return s.replace(a, b, 1)
LI = '<li style="display: flex; gap: 12px; align-items: flex-start; font-size: 16px; line-height: 1.55"><span style="width: 28px; height: 28px; flex: none; border-radius: 999px; background: #5B21B6; color: #FFFFFF; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">{{st.n}}</span>{{st.t}}</li>'
TD = '<tr><td style="padding: 8px 0; color: #615A6E; border-bottom: 1px solid #F5F3F8">{{r.k}}</td><td class="num" style="padding: 8px 0; text-align: right; font-weight: 700; border-bottom: 1px solid #F5F3F8">{{r.v}}</td></tr>'
DEEP = '''<sc-if value="{{deepOn}}" hint-placeholder-val="{{false}}"><section style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="font-size: 22px">{{howTitle}}</h2>
      <p style="margin: 0; font-size: 17px; line-height: 1.7; color: #1C1726">{{howIntro}}</p>
      <ol style="margin: 4px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px"><sc-for list="{{howSteps}}" as="st" hint-placeholder-count="3">''' + LI + '''</sc-for></ol>
    </section>
    <section aria-labelledby="exd" style="border: 2px solid #E7E2F0; border-radius: 18px; overflow: hidden">
      <div style="background: #FFF1EC; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between"><h2 id="exd" style="font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #B42828">African example</h2><span style="font-size: 12px; font-weight: 700; color: #615A6E">Made-up figures</span></div>
      <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px">
        <p style="margin: 0; font-size: 16px; line-height: 1.55">{{exLine}}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px"><sc-for list="{{exRows}}" as="r" hint-placeholder-count="3">''' + TD + '''</sc-for></table>
        <span style="font-size: 13px; color: #615A6E">{{exNote}}</span>
      </div>
    </section>
    <sc-if value="{{hasFormula}}" hint-placeholder-val="{{true}}"><section style="display: flex; flex-direction: column; gap: 10px">
      <h2 style="font-size: 22px">{{fTitle}}</h2>
      <p style="margin: 0; font-size: 17px; line-height: 1.7; color: #1C1726">{{fIntro}}</p>
      <div style="background: #0E0B14; color: #FFFFFF; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 6px; text-align: center">
        <span style="font-size: 15px; color: #DDD6FE">{{fRule}}</span>
        <span class="num" style="font-size: 24px; font-weight: 800">{{fCalc}}</span>
        <span style="font-size: 13px; color: #DDD6FE">{{fNote}}</span>
      </div>
    </section></sc-if>
    <sc-if value="{{hasMistake}}" hint-placeholder-val="{{true}}"><section aria-labelledby="myth" style="background: #F8F6FC; border: 2px solid #E7E2F0; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 8px">
      <h2 id="myth" style="font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #4C1D95">Common mistake</h2>
      <p style="margin: 0; font-size: 16px; line-height: 1.5; font-weight: 700">“{{mMyth}}”</p>
      <p style="margin: 0; font-size: 16px; line-height: 1.55; color: #1C1726">{{mFact}}</p>
    </section></sc-if></sc-if>
    '''
def wire_deep(s):
    # Lead: deep articles highlight the term, like Dividend.
    s = sub1(s, '<sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}"><p style="margin: 0; font-size: 20px; line-height: 1.5; font-weight: 700; color: #0E0B14">{{definition}}</p></sc-if>',
        '<sc-if value="{{plainOn}}" hint-placeholder-val="{{false}}"><p style="margin: 0; font-size: 20px; line-height: 1.5; font-weight: 700; color: #0E0B14">{{definition}}</p></sc-if><sc-if value="{{deepOn}}" hint-placeholder-val="{{false}}"><p style="margin: 0; font-size: 20px; line-height: 1.5; font-weight: 700; color: #0E0B14">{{lead0}}<span style="background: #F1EBFB; padding: 0 4px; border-radius: 4px">{{lead1}}</span>{{lead2}}</p></sc-if>')
    # Deep sections go before the short Example; the short Example shows only for articles without deep data.
    a = '<sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}"><section aria-labelledby="ex" style="border: 2px solid #E7E2F0; border-radius: 18px; overflow: hidden">'
    s = sub1(s, a, DEEP + '<sc-if value="{{plainOn}}" hint-placeholder-val="{{false}}"><section aria-labelledby="ex" style="border: 2px solid #E7E2F0; border-radius: 18px; overflow: hidden">')
    s = sub1(s, '''<p style="margin: 0; padding: 14px 16px; font-size: 16px; line-height: 1.55">{{example}}</p>
        </section>
        <section style="display: flex; flex-direction: column; gap: 10px">
          <h2 style="font-size: 22px">Why it matters</h2>''', '''<p style="margin: 0; padding: 14px 16px; font-size: 16px; line-height: 1.55">{{example}}</p>
        </section></sc-if><sc-if value="{{notDiv}}" hint-placeholder-val="{{false}}">
        <section style="display: flex; flex-direction: column; gap: 10px">
          <h2 style="font-size: 22px">Why it matters</h2>''')
    # Values.
    s = sub1(s, "    return { feedbackOn: fb, tag: L.topicOf(a).name,", """    const dp = !div && a.deep, f = dp && a.deep.formula, m = dp && a.deep.mistake;
        const deepVals = dp ? { lead0: a.deep.lead[0], lead1: a.deep.lead[1], lead2: a.deep.lead[2], howTitle: a.deep.how.title, howIntro: a.deep.how.intro, howSteps: a.deep.how.steps.map((t, i) => ({ n: String(i + 1), t })),
          exLine: a.deep.example.line, exRows: a.deep.example.rows.map((r) => ({ k: r[0], v: r[1] })), exNote: a.deep.example.note, hasFormula: !!f, fTitle: f ? f.title : '', fIntro: f ? f.intro : '', fRule: f ? f.rule : '', fCalc: f ? f.calc : '', fNote: f ? f.note : '',
          hasMistake: !!m, mMyth: m ? m.myth : '', mFact: m ? m.fact : '' } : {};
        return { ...deepVals, deepOn: !!dp, plainOn: !div && !dp, feedbackOn: fb, tag: L.topicOf(a).name,""")
    s = sub1(s, "points: a.explanation,", "points: dp ? a.deep.takeaways : a.explanation,")

    return s
if not ALREADY:
    s = wire_deep(s); open(p, 'w').write(s); print('articles wired')

# Every article now has full sections in the data, so Dividend no longer needs its own hand-built page.
p = os.path.join(SITE, 'UPArticle.dc.html'); s = open(p).read()
if "div = a.slug === 'dividend'" in s:
    s = s.replace("div = a.slug === 'dividend'", "div = false", 1); open(p, 'w').write(s); print('dividend uses the shared article data')
