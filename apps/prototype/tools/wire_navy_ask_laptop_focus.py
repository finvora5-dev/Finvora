"""Laptop Ask Finvora, direction A "Focus" (owner's choice, 16 Nov 2026; drafts in mockups/drafts-ask; skill: emil-design-eng).
One centred column. Top bar: Finvora AI, History (opens a panel of saved conversations: open or delete) and New chat.
Empty: logo, heading, a large ask box (the Home ask box: + suggestions, paperclip, navy send) and suggestion chips.
Chat: messages scroll on their own; the ask box floats pinned at the bottom (Enter sends, Shift+Enter new line, grows to
5 lines); answers carry source links, Copy and "Not financial advice"; follow-ups under the latest answer; the company
card only with a real answer. Replaces the earlier laptop layout (wire_navy_ask_laptop.py). Idempotent.
Usage: wire_navy_ask_laptop_focus.py <site>"""
import os, re, sys
SITE = sys.argv[1]; P = os.path.join(SITE, 'AskLaptopNavy.dc.html'); s = open(P).read()
if '<!-- ask-laptop-focus -->' in s: print('already wired'); sys.exit()
MONO = "'Geist Mono', monospace"
side = s[s.index('<aside'):s.index('</aside>') + 8]
i = side.index('aria-label="Finvora"'); LOGO_SVG = side[side.index('<svg', i):side.index('</svg>', i) + 6]
def logo(px):
    svg = re.sub(r'width="\d+" height="\d+"', 'width="%d" height="%d"' % (round(px * .66), round(px * .66)), LOGO_SVG, count=1)
    return '<span role="img" aria-label="Finvora" style="width: %dpx; height: %dpx; flex: none; border-radius: %dpx; background: #0B192C; display: flex; align-items: center; justify-content: center">%s</span>' % (px, px, round(px / 3.5), svg)
def ic(d, c='#0B192C', size=18, w=1.8): return '<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, c, w, d)
PLUS = '<path d="M12 5v14M5 12h14"></path>'; CLIP = '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"></path>'
UP = '<path d="M12 19V5M6 11l6-6 6 6"></path>'; HIST = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>'
BOOK = '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"></path><path d="M8 7h7"></path>'; COPY = '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h8"></path>'
BIN = '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path>'
CARD = 'background: #FFFFFF; border: 1px solid #E5E7EB'
ROUND_BTN = 'cursor: pointer; width: 40px; height: 40px; flex: none; border-radius: 999px; border: 1px solid #E5E7EB; background: #FFFFFF; display: flex; align-items: center; justify-content: center'

def composer(big):
    return ('<div style="' + CARD + '; border-radius: 20px; box-shadow: 0 12px 32px rgba(11,25,44,.08); padding: ' + ('16px 16px 12px' if big else '10px 12px 10px') + '; display: flex; flex-direction: column; gap: ' + ('14px' if big else '6px') + '">'
        '<textarea id="ask" rows="' + ('2' if big else '1') + '" enterkeyhint="send" aria-label="{{ph}}" placeholder="{{ph}}" value="{{draft}}" onInput="{{onDraft}}" onKeyDown="{{onKey}}" style="width: 100%; box-sizing: border-box; border: 0; resize: none; font: inherit; font-size: 16px; line-height: 1.45; padding: 6px 4px; outline: none; background: transparent; max-height: 160px; overflow-y: auto; color: #0B192C"></textarea>'
        '<div style="display: flex; align-items: center; gap: 8px"><button type="button" aria-label="Add" style="' + ROUND_BTN + '">' + ic(PLUS) + '</button><button type="button" aria-label="Attach" style="' + ROUND_BTN + '">' + ic(CLIP, '#0B192C', 16) + '</button>'
        '<span style="flex: 1"></span><span style="font-size: 12px; color: #8E9AAE">{{leftShort}}</span>'
        '<button type="button" aria-label="Send" aria-disabled="{{noDraft}}" onClick="{{send}}" style="cursor: pointer; width: 44px; height: 44px; flex: none; border: 0; border-radius: 999px; background: {{sendBg}}; display: flex; align-items: center; justify-content: center">' + ic(UP, '#FFFFFF', 18, 2) + '</button></div></div>')

CHIP = 'cursor: pointer; min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #E5E7EB; background: #FFFFFF; font: inherit; font-size: 13px; color: #0B192C'
FOLLOW = 'cursor: pointer; min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #10B981; background: #FFFFFF; font: inherit; font-size: 13px; font-weight: 500; color: #047857; text-align: left'
TOP = ('<div style="height: 64px; flex: none; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; position: relative">'
  '<span style="display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600">' + logo(26) + 'Finvora AI</span>'
  '<span style="display: flex; gap: 8px"><button type="button" onClick="{{toggleHist}}" aria-expanded="{{histOpen}}" aria-controls="fv-hist" style="cursor: pointer; height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid #E5E7EB; background: #FFFFFF; font: inherit; font-size: 14px; font-weight: 500; color: #0B192C; display: flex; align-items: center; gap: 8px">' + ic(HIST, '#0B192C', 16) + 'History</button>'
  '<button type="button" onClick="{{fresh}}" style="cursor: pointer; height: 38px; padding: 0 14px; border-radius: 10px; border: 0; background: #0B192C; color: #FFFFFF; font: inherit; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px">' + ic(PLUS, '#FFFFFF', 16, 2) + 'New chat</button></span>'
  # history panel (opens under the History button)
  '<sc-if value="{{showHist}}" hint-placeholder-val="{{ false }}"><div style="position: fixed; inset: 0; z-index: 20" onClick="{{closeHist}}" aria-hidden="true"></div>'
  '<div id="fv-hist" role="dialog" aria-label="History" class="fv-pop" style="position: absolute; top: 56px; right: 32px; z-index: 21; width: 340px; max-height: 60vh; display: flex; flex-direction: column; ' + CARD + '; border-radius: 16px; box-shadow: 0 16px 40px rgba(11,25,44,.14); overflow: hidden">'
  '<div style="padding: 14px 16px 8px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #5B6577">History</div>'
  '<div style="overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 8px; display: flex; flex-direction: column; gap: 2px">'
  '<sc-if value="{{noHistory}}" hint-placeholder-val="{{ false }}"><p style="margin: 4px 8px 10px; font-size: 13px; line-height: 1.5; color: #5B6577">Your conversations will show here.</p></sc-if>'
  '<sc-for list="{{convs}}" as="c" hint-placeholder-count="3"><div style="position: relative; display: flex; align-items: center; border-radius: 10px; background: {{c.bg}}">'
  '<button type="button" onClick="{{c.go}}" aria-current="{{c.cur}}" style="cursor: pointer; flex: 1; min-width: 0; min-height: 52px; padding: 8px 40px 8px 12px; border: 0; background: transparent; font: inherit; text-align: left; display: flex; flex-direction: column; gap: 2px; color: #0B192C">'
  '<span style="font-size: 14px; font-weight: {{c.w}}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{c.t}}</span><span style="font-size: 12px; color: #5B6577">{{c.s}}</span></button>'
  '<button type="button" aria-label="{{c.delLabel}}" onClick="{{c.del}}" style="cursor: pointer; position: absolute; right: 4px; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; color: #8E9AAE; display: flex; align-items: center; justify-content: center">' + ic(BIN, 'currentColor', 15) + '</button></div></sc-for></div>'
  '<p style="margin: 0; padding: 10px 16px 12px; border-top: 1px solid #EDEFF2; font-size: 12px; line-height: 1.5; color: #5B6577">{{keepNote}}</p></div></sc-if></div>')

EMPTY = ('<sc-if value="{{empty}}" hint-placeholder-val="{{ false }}"><div style="flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 32px 72px">'
  '<div style="width: 100%; max-width: 720px; display: flex; flex-direction: column; gap: 22px"><div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px">' + logo(48) +
  '<h1 style="margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.02em">What would you like to understand?</h1><p style="margin: 0; font-size: 15px; color: #5B6577">Plain answers from the Finvora library and company data. Not financial advice.</p></div>'
  + composer(True) +
  '<div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap"><sc-for list="{{starters}}" as="c" hint-placeholder-count="4"><button type="button" onClick="{{c.go}}" style="' + CHIP + '">{{c.t}}</button></sc-for></div></div></div></sc-if>')

CHAT = ('<sc-if value="{{chatting}}" hint-placeholder-val="{{ true }}"><div id="chat" style="flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 32px 0"><div style="max-width: 760px; margin: 0 auto; padding-bottom: 24px; display: flex; flex-direction: column; gap: 24px">'
  '<sc-for list="{{msgs}}" as="m" hint-placeholder-count="2"><div style="display: flex; flex-direction: column; gap: 14px; padding-bottom: 24px; border-bottom: 1px solid {{m.rule}}">'
  '<div style="align-self: flex-end; max-width: 70%; padding: 11px 16px; border-radius: 18px 18px 4px 18px; background: #0B192C; color: #FFFFFF; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-line">{{m.q}}</div>'
  '<div style="display: flex; gap: 14px">' + logo(30) + '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; font-size: 16px; line-height: 1.7; color: #1E293B">'
  '<sc-for list="{{m.paras}}" as="x" hint-placeholder-count="1"><p style="margin: 0; white-space: pre-line">{{x.t}}</p></sc-for>'
  '<sc-if value="{{m.hasCo}}" hint-placeholder-val="{{ false }}"><a href="{{m.coHref}}" style="' + CARD + '; border-radius: 14px; padding: 14px 16px; text-decoration: none; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 12px; color: #0B192C"><span style="display: flex; flex-direction: column"><span style="font-weight: 600; font-size: 15px">{{m.coName}}</span><span style="font-family: ' + MONO + '; font-size: 12px; color: #5B6577">{{m.coT}}</span></span><span style="display: flex; flex-direction: column"><span style="font-size: 12px; color: #5B6577">Price</span><span style="font-family: ' + MONO + '; font-size: 15px">{{m.coP}}</span></span><span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">EPS FY2024</span><span style="font-family: ' + MONO + '; font-size: 15px">₦15.40</span></span><span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">P/E</span><span style="font-family: ' + MONO + '; font-size: 15px">3.1</span></span></a></sc-if>'
  '<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center"><sc-for list="{{m.src}}" as="c" hint-placeholder-count="2"><a href="{{c.href}}" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: #F1F3F5; font-size: 12px; color: #0B192C; text-decoration: none">' + ic(BOOK, '#047857', 12) + '{{c.t}}</a></sc-for>'
  '<span style="flex: 1"></span><button type="button" aria-label="Copy answer" onClick="{{m.copy}}" style="cursor: pointer; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; display: flex; align-items: center; justify-content: center">' + ic(COPY, '#8E9AAE', 15) + '</button><span style="font-size: 11px; color: #8E9AAE">Not financial advice</span></div>'
  '<sc-if value="{{m.hasFollow}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 8px; flex-wrap: wrap"><sc-for list="{{m.follow}}" as="c" hint-placeholder-count="2"><button type="button" onClick="{{c.go}}" style="' + FOLLOW + '">{{c.t}}</button></sc-for></div></sc-if>'
  '</div></div></div></sc-for>'
  '<sc-if value="{{limited}}" hint-placeholder-val="{{ false }}"><div role="status" style="padding: 16px 18px; border-radius: 16px; ' + CARD + '; display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 16px; color: #0B192C">You have used today\'s 5 questions</strong><span style="font-size: 14px; color: #5B6577">Free includes 5 Finvora AI questions a day. More tomorrow at 00:00, or get unlimited with Plus.</span><a href="PlansLaptopNavy.dc.html" style="align-self: flex-start; height: 40px; padding: 0 16px; border-radius: 10px; background: #0B192C; color: #FFFFFF; display: inline-flex; align-items: center; text-decoration: none; font-weight: 600; font-size: 14px">See Plus</a></div></sc-if>'
  '</div></div><div style="flex: none; padding: 10px 32px 20px; background: linear-gradient(to top, #F8F9FA 70%, rgba(248,249,250,0))"><div style="max-width: 760px; margin: 0 auto">' + composer(False) + '</div></div></sc-if>')

JS = r'''class Component extends DCLogic {
/* navy-laptop */ /* ask-laptop-focus */
  A() { return window.FV && window.FV.ASK; }
  constructor(p) { super(p); this.state = { draft: '', n: 0, limited: false, hist: false }; }
  componentDidMount() { const m = /[?&]q=([^&]+)/.exec(location.search); if (m) { history.replaceState(null, '', location.pathname); this.ask(decodeURIComponent(m[1].replace(/\+/g, ' '))); }
    this.bottom(); this.grow(); this.focus(); this.esc = (e) => { if (e.key === 'Escape' && this.state.hist) this.setState({ hist: false }); }; document.addEventListener('keydown', this.esc); }
  componentWillUnmount() { document.removeEventListener('keydown', this.esc); }
  componentDidUpdate() { this.grow(); }
  focus() { setTimeout(() => { const t = document.getElementById('ask'); if (t) t.focus({ preventScroll: true }); }, 40); }
  grow() { const t = document.getElementById('ask'); if (!t) return; t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; }
  bottom() { setTimeout(() => { const el = document.getElementById('chat'); if (el) el.scrollTop = el.scrollHeight; }, 40); }
  ask(q) { const A = this.A(); q = String(q || '').trim(); if (!A || !q) return; if (!A.status().allowed) { this.setState({ limited: true, draft: '' }); this.bottom(); return; } A.ask(q); this.setState({ draft: '', n: this.state.n + 1, limited: false }); this.bottom(); this.focus(); }
  renderVals() {
    const A = this.A(), S = window.FV && window.FV.SIM, msgs = A ? A.messages() : [], st = A ? A.status() : { remaining: 5 }, lim = A ? A.limit() : 5, hist = A ? A.history() : [];
    const co = (q) => { if (!S) return null; const ql = q.toLowerCase(); return S.COMPANIES.map((c) => S.company(c.t)).filter((c) => c && (ql.indexOf(c.name.toLowerCase().split(' ')[0].toLowerCase()) >= 0 || ql.indexOf(c.t.toLowerCase()) >= 0))[0] || null; };
    const chips = (arr) => arr.map((t) => ({ t, go: () => this.ask(t) })), when = window.fvWhen || (() => ''), toast = window.fvToast || (() => {});
    const keep = !(window.FV && window.FV.ME.prefs().saveChats === false), empty = !msgs.length && !this.state.limited;
    return { empty, chatting: !empty, limited: this.state.limited, starters: chips(A ? A.suggestions().slice(0, 4) : []),
      showHist: this.state.hist, histOpen: String(this.state.hist), toggleHist: () => this.setState({ hist: !this.state.hist }), closeHist: () => this.setState({ hist: false }),
      noHistory: !hist.length, keepNote: keep ? 'Saved on this device. Change this in Settings, Privacy and data.' : 'Chats are not saved: they go when you close this tab.',
      convs: hist.map((c) => ({ t: c.title, s: (c.current ? 'Open now · ' : '') + c.n + (c.n === 1 ? ' question' : ' questions') + ' · ' + when(c.at), cur: String(c.current), bg: c.current ? '#F1F3F5' : 'transparent', w: c.current ? '600' : '500',
        go: () => { if (!c.current && A) A.open(c.id); this.setState({ hist: false, n: this.state.n + 1, limited: false }); this.bottom(); this.focus(); },
        delLabel: 'Delete conversation: ' + c.title, del: () => { if (A) { A.remove(c.id); this.setState({ n: this.state.n + 1 }); } } })),
      msgs: msgs.map((m, i) => { const c = m.r.kind === 'answer' ? co(m.q) : null, isLast = i === msgs.length - 1, fol = (m.r.choices || []).map((x) => x.title).concat(m.r.followUps || []).slice(0, 3);
        return { q: m.q, paras: String(m.r.answer || '').split(/\n\n+/).map((t) => ({ t })), rule: isLast ? 'transparent' : '#EDEFF2',
          src: (m.r.citations || []).map((x) => ({ t: x.title, href: 'ArticleNavy.dc.html?a=' + x.articleSlug })), follow: chips(fol), hasFollow: isLast && !!fol.length,
          copy: () => { try { navigator.clipboard.writeText(String(m.r.answer || '')).then(() => toast('Answer copied'), () => toast('Could not copy. Select the text instead.')); } catch (e) { toast('Could not copy. Select the text instead.'); } },
          hasCo: !!c, coHref: c ? 'CompanyLaptopNavy.dc.html?t=' + c.t : '#', coName: c ? c.name : '', coT: c ? c.t : '', coP: c ? '₦' + (S.price(c.t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '', zenShow: c && c.t === 'ZENITHBANK' ? 'flex' : 'none' }; }),
      ph: msgs.length ? 'Ask a follow-up' : 'Ask about any NGX company, price or money idea', draft: this.state.draft, noDraft: String(!this.state.draft.trim()), sendBg: this.state.draft.trim() ? '#0B192C' : '#C0C6D0',
      leftShort: lim === null ? 'Unlimited with Plus' : st.remaining + ' of ' + lim + ' left today',
      onDraft: (e) => this.setState({ draft: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.ask(this.state.draft); } },
      send: () => this.ask(this.state.draft),
      fresh: () => { if (A) A.clear(); this.setState({ n: this.state.n + 1, limited: false, draft: '', hist: false }); this.focus(); } };
  }
}'''
i = s.index('<main'); k = s.index('</main>', i)
s = s[:i] + '<main style="flex: 1; min-width: 0; height: 100%; padding: 0; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden"><!-- ask-laptop-focus -->' + TOP + EMPTY + CHAT + s[k:]
a = s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('data-dc-script'))].rstrip() + '\n'
s = s.replace(a, JS + '\n', 1)
open(P, 'w').write(s); print('wired AskLaptopNavy: Focus layout')
