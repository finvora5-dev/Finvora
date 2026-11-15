"""Appearance setting (owner approved 15 Nov 2026): a row in Settings > App opens a bottom sheet with Match phone,
Light and Dark. The choice applies at once (window.fvTheme, responsive.js). Usage: python3 wire_navy_dark.py <site folder>"""
import os, sys
SITE = sys.argv[1]; P = os.path.join(SITE, 'SettingsNavy.dc.html'); MARK = '/* navy-appearance */'
def sub1(s, a, b):
    if a not in s: raise SystemExit('missing: ' + a[:90])
    return s.replace(a, b, 1)
s = open(P).read()
if MARK not in s:
    s = sub1(s, '<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; border-bottom: 1px solid #EDEFF2; font-size: 15px">',
                '<div role="{{r.role}}" tabindex="{{r.tab}}" aria-haspopup="{{r.pop}}" onClick="{{r.act}}" onKeyDown="{{r.key}}" style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; border-bottom: 1px solid #EDEFF2; font-size: 15px; cursor: {{r.cur}}">')
    sheet = ('<sc-if value="{{open}}" hint-placeholder-val="{{ false }}"><div aria-hidden="true" onClick="{{close}}" style="position: fixed; inset: 0; background: rgba(17,28,45,.45); z-index: 40"></div>'
             '<section role="dialog" aria-modal="true" aria-labelledby="ap-h" style="position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; background: #FFFFFF; border-radius: 22px 22px 0 0; padding: 10px 20px 28px; display: flex; flex-direction: column; gap: 10px">'
             '<span style="width: 36px; height: 4px; border-radius: 999px; background: #D5D9E0; align-self: center; margin-bottom: 6px"></span>'
             '<h2 id="ap-h" style="margin: 0; font-size: 20px; font-weight: 600">Appearance</h2><p style="margin: 0 0 4px; font-size: 14px; color: #5B6577">Choose how Finvora looks on this device.</p>'
             '<div role="radiogroup" aria-labelledby="ap-h" style="display: flex; flex-direction: column; gap: 10px"><sc-for list="{{opts}}" as="o" hint-placeholder-count="3">'
             '<button type="button" role="radio" aria-checked="{{o.on}}" onClick="{{o.pick}}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 14px; border-radius: 12px; border: {{o.bd}}; background: #FFFFFF; color: #0B192C; font: inherit; font-size: 16px; text-align: left; cursor: pointer">'
             '<span style="flex: 1; display: flex; flex-direction: column; line-height: 1.3"><span>{{o.t}}</span><span style="display: {{o.showS}}; font-size: 13px; color: #5B6577">{{o.s}}</span></span>'
             '<span aria-hidden="true" style="width: 20px; height: 20px; border-radius: 999px; box-sizing: border-box; border: {{o.dot}}; flex: none"></span></button></sc-for></div></section></sc-if>')
    s = sub1(s, '  <a href="SignOutNavy.dc.html"', sheet + '\n  <a href="SignOutNavy.dc.html"')
    s = sub1(s, "  constructor(p) { super(p); const P = window.FV ? window.FV.ME.prefs() : {}; this.state = { price: P.price !== false, daily: P.daily !== false, news: !!P.news, sound: P.sound !== false }; }",
                MARK + "\n  constructor(p) { super(p); const P = window.FV ? window.FV.ME.prefs() : {}; this.state = { price: P.price !== false, daily: P.daily !== false, news: !!P.news, sound: P.sound !== false, open: false, ap: window.fvTheme ? window.fvTheme.pref() : 'system' }; }")
    s = sub1(s, "tog: () => { if (window.FV) window.FV.ME.setPref(k, !on); this.setState({ [k]: !on }); } }; };",
                "tog: () => { if (window.FV) window.FV.ME.setPref(k, !on); this.setState({ [k]: !on }); }, role: 'none', tab: '-1', pop: 'false', cur: 'default', act: () => {}, key: () => {} }; };")
    s = sub1(s, "const val = (t, v) => ({ t, v, showS: 'none', showV: 'inline', on: 'false', bg: '', j: '', tog: () => {} });",
                "const val = (t, v, act) => ({ t, v, showS: 'none', showV: 'inline', on: 'false', bg: '', j: '', tog: () => {}, role: act ? 'button' : 'none', tab: act ? '0' : '-1', pop: act ? 'dialog' : 'false', cur: act ? 'pointer' : 'default', act: act || (() => {}), key: act ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } } : () => {} });\n"
                "    const AP = { system: 'Match phone', light: 'Light', dark: 'Dark' }, openAp = () => this.setState({ open: true });\n"
                "    const opts = ['system', 'light', 'dark'].map((k) => { const on = this.state.ap === k; return { t: AP[k], s: 'Dark when your phone is in dark mode', showS: k === 'system' ? 'inline' : 'none', on: String(on), bd: on ? '2px solid #0B192C' : '1px solid #D5D9E0', dot: on ? '6px solid #0B192C' : '2px solid #D5D9E0', pick: () => { if (window.fvTheme) window.fvTheme.set(k); this.setState({ ap: k, open: false }); } }; });")
    s = sub1(s, "    return { groups: [", "    return { open: this.state.open, opts, close: () => this.setState({ open: false }), groups: [")
    s = sub1(s, "{ h: 'App', rows: [sw('Sounds', 'sound'),", "{ h: 'App', rows: [val('Appearance', AP[this.state.ap] || 'Match phone', openAp), sw('Sounds', 'sound'),")
    open(P, 'w').write(s); print('appearance wired')
