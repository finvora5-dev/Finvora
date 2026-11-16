"""Laptop Ask Finvora, product-ready (owner report, 16 Nov 2026: "doesn't behave product ready", history missing, the text
field scrolls with the page). Same answers, limits and rules as the phone (FV.ASK); this rebuilds the laptop layout:
- a conversations column: New conversation, saved conversations (newest first, the open one marked), delete one;
- the chat column: header with questions left, messages that scroll on their own, the composer pinned at the bottom
  (Enter sends, Shift+Enter adds a line, grows to 5 lines), suggestions on an empty chat, sources as links, follow-ups;
- the company card shows only with a real answer, never next to a refusal.
Idempotent. Usage: wire_navy_ask_laptop.py <site>"""
import os, sys
SITE = sys.argv[1]; P = os.path.join(SITE, 'AskLaptopNavy.dc.html'); s = open(P).read()
if '<!-- ask-laptop-v2 -->' in s: print('already wired'); sys.exit()
MONO = "'Geist Mono', monospace"
LABEL = 'font-size: 12px; font-weight: 600; color: #5B6577; text-transform: uppercase; letter-spacing: .06em'
LOGO = s[s.index('<span role="img" aria-label="Finvora"', s.index('<main')):]; LOGO = LOGO[:LOGO.index('</span>') + 7]
PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>'
BIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path></svg>'
SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>'
SPARK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"></path></svg>'
CHIP = 'cursor: pointer; min-height: 36px; padding: 0 14px; border: 1px solid #10B981; border-radius: 999px; background: #FFFFFF; font: inherit; font-size: 13px; font-weight: 500; color: #047857; text-align: left'

MAIN = ('<!-- ask-laptop-v2 --><div style="flex: 1; min-height: 0; display: grid; grid-template-columns: 272px minmax(0, 1fr); gap: 0">'
  # conversations column
  '<section aria-label="Conversation history" style="border-right: 1px solid #E5E7EB; padding: 24px 16px; display: flex; flex-direction: column; gap: 12px; min-height: 0">'
  '<button type="button" onClick="{{fresh}}" style="cursor: pointer; height: 44px; flex: none; border: 0; border-radius: 12px; background: #0B192C; color: #FFFFFF; font: inherit; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px">' + PLUS + 'New conversation</button>'
  '<h2 style="margin: 8px 4px 0; ' + LABEL + '">History</h2>'
  '<div style="flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 2px; margin: 0 -4px; padding: 0 4px">'
  '<sc-if value="{{noHistory}}" hint-placeholder-val="{{ false }}"><p style="margin: 4px; font-size: 13px; line-height: 1.5; color: #5B6577">Your conversations will show here.</p></sc-if>'
  '<sc-for list="{{convs}}" as="c" hint-placeholder-count="3"><div style="position: relative; display: flex; align-items: center; border-radius: 10px; background: {{c.bg}}">'
  '<button type="button" onClick="{{c.go}}" aria-current="{{c.cur}}" style="cursor: pointer; flex: 1; min-width: 0; min-height: 52px; padding: 8px 36px 8px 12px; border: 0; background: transparent; font: inherit; text-align: left; display: flex; flex-direction: column; gap: 2px; color: #0B192C">'
  '<span style="font-size: 14px; font-weight: {{c.w}}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{c.t}}</span><span style="font-size: 12px; color: #5B6577">{{c.s}}</span></button>'
  '<button type="button" aria-label="{{c.delLabel}}" onClick="{{c.del}}" style="cursor: pointer; position: absolute; right: 4px; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: #8E9AAE; display: flex; align-items: center; justify-content: center">' + BIN + '</button></div></sc-for></div>'
  '<p style="margin: 0 4px; font-size: 12px; line-height: 1.5; color: #5B6577">{{keepNote}}</p></section>'
  # chat column
  '<section aria-label="Chat" style="display: flex; flex-direction: column; min-height: 0">'
  '<div style="flex: none; height: 64px; padding: 0 32px; border-bottom: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: space-between; gap: 16px">'
  '<span style="display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600">' + LOGO + 'Finvora AI</span><span style="font-size: 13px; color: #5B6577">{{left}}</span></div>'
  '<div id="chat" style="flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain"><div style="max-width: 760px; margin: 0 auto; padding: 28px 32px 24px; display: flex; flex-direction: column; gap: 24px">'
  # empty state
  '<sc-if value="{{empty}}" hint-placeholder-val="{{ false }}"><div style="padding-top: 6vh; display: flex; flex-direction: column; gap: 18px"><div><h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em">What would you like to understand?</h1>'
  '<p style="margin: 8px 0 0; font-size: 15px; line-height: 1.55; color: #5B6577">Ask about any NGX company, price or money idea. Answers come from the Finvora library and company data. Not financial advice.</p></div>'
  '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px"><sc-for list="{{starters}}" as="c" hint-placeholder-count="4"><button type="button" onClick="{{c.go}}" style="cursor: pointer; min-height: 64px; padding: 14px 16px; border: 1px solid #E5E7EB; border-radius: 14px; background: #FFFFFF; font: inherit; font-size: 15px; color: #0B192C; text-align: left; display: flex; align-items: center; gap: 12px"><span style="width: 28px; height: 28px; flex: none; border-radius: 8px; background: #DDF3E6; display: flex; align-items: center; justify-content: center">' + SPARK + '</span>{{c.t}}</button></sc-for></div></div></sc-if>'
  # messages
  '<sc-for list="{{msgs}}" as="m" hint-placeholder-count="1"><div style="display: flex; flex-direction: column; gap: 16px">'
  '<div style="align-self: flex-end; max-width: 75%; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: #0B192C; color: #FFFFFF; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-line">{{m.q}}</div>'
  '<div style="display: flex; gap: 12px">' + LOGO.replace('width: 22px; height: 22px', 'width: 28px; height: 28px') + '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; font-size: 15px; line-height: 1.65; color: #334155">'
  '<sc-for list="{{m.paras}}" as="x" hint-placeholder-count="1"><p style="margin: 0; white-space: pre-line">{{x.t}}</p></sc-for>'
  '<sc-if value="{{m.hasCo}}" hint-placeholder-val="{{ false }}"><a href="{{m.coHref}}" style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px 18px; text-decoration: none; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 12px; color: #0B192C"><span style="display: flex; flex-direction: column"><span style="font-weight: 600">{{m.coName}}</span><span style="font-family: ' + MONO + '; font-size: 12px; color: #5B6577">{{m.coT}}</span></span><span style="display: flex; flex-direction: column"><span style="font-size: 12px; color: #5B6577">Price</span><span style="font-family: ' + MONO + '">{{m.coP}}</span></span><span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">EPS FY2024</span><span style="font-family: ' + MONO + '">₦15.40</span></span><span style="display: {{m.zenShow}}; flex-direction: column"><span style="font-size: 12px; color: #5B6577">P/E</span><span style="font-family: ' + MONO + '">3.1</span></span></a></sc-if>'
  '<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center"><sc-if value="{{m.hasSrc}}" hint-placeholder-val="{{ false }}"><span style="font-size: 12px; color: #5B6577">Sources</span><sc-for list="{{m.src}}" as="c" hint-placeholder-count="2"><a href="{{c.href}}" style="text-decoration: none; color: #0B192C; padding: 4px 10px; border-radius: 8px; background: #E8EBEF; font-size: 12px">{{c.t}}</a></sc-for></sc-if><span style="margin-left: auto; font-size: 11px; color: #5B6577">Not financial advice</span></div>'
  '<sc-if value="{{m.hasFollow}}" hint-placeholder-val="{{ false }}"><div style="display: flex; gap: 8px; flex-wrap: wrap"><sc-for list="{{m.follow}}" as="c" hint-placeholder-count="2"><button type="button" onClick="{{c.go}}" style="' + CHIP + '">{{c.t}}</button></sc-for></div></sc-if>'
  '</div></div></div></sc-for>'
  '<sc-if value="{{limited}}" hint-placeholder-val="{{ false }}"><div role="status" style="padding: 16px 18px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E5E7EB; display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 16px; color: #0B192C">You have used today\'s 5 questions</strong><span style="font-size: 14px; color: #5B6577">Free includes 5 Finvora AI questions a day. More tomorrow at 00:00, or get unlimited with Plus.</span><a href="PlansLaptopNavy.dc.html" style="align-self: flex-start; height: 40px; padding: 0 16px; border-radius: 10px; background: #0B192C; color: #FFFFFF; display: inline-flex; align-items: center; text-decoration: none; font-weight: 600; font-size: 14px">See Plus</a></div></sc-if>'
  '</div></div>'
  # composer, pinned
  '<div style="flex: none; border-top: 1px solid #E5E7EB; background: #F8F9FA; padding: 14px 32px 18px"><div style="max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px">'
  '<label for="ask" style="display: flex; align-items: flex-end; gap: 10px; background: #FFFFFF; border: 1px solid #D5D9E0; border-radius: 16px; padding: 8px 8px 8px 16px">'
  '<textarea id="ask" rows="1" enterkeyhint="send" aria-label="{{ph}}" placeholder="{{ph}}" value="{{draft}}" onInput="{{onDraft}}" onKeyDown="{{onKey}}" style="flex: 1; min-width: 0; border: 0; resize: none; font: inherit; font-size: 16px; line-height: 1.45; padding: 9px 0; outline: none; background: transparent; max-height: 160px; overflow-y: auto; box-sizing: border-box"></textarea>'
  '<button type="button" aria-label="Send" aria-disabled="{{noDraft}}" onClick="{{send}}" style="cursor: pointer; width: 44px; height: 44px; flex: none; border: 0; border-radius: 12px; background: {{sendBg}}; display: flex; align-items: center; justify-content: center">' + SEND + '</button></label>'
  '<span style="font-size: 12px; color: #5B6577; text-align: center">Enter to send · Shift + Enter for a new line · Finvora explains, it does not tell you what to buy or sell</span></div></div>'
  '</section></div>')

JS = r'''class Component extends DCLogic {
/* navy-laptop */ /* ask-laptop-v2 */
  A() { return window.FV && window.FV.ASK; }
  constructor(p) { super(p); this.state = { draft: '', n: 0, limited: false }; }
  componentDidMount() { const m = /[?&]q=([^&]+)/.exec(location.search); if (m) { history.replaceState(null, '', location.pathname); this.ask(decodeURIComponent(m[1].replace(/\+/g, ' '))); } this.bottom(); this.grow(); const t = document.getElementById('ask'); if (t) t.focus({ preventScroll: true }); }
  componentDidUpdate() { this.grow(); }
  grow() { const t = document.getElementById('ask'); if (!t) return; t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; }
  bottom() { setTimeout(() => { const el = document.getElementById('chat'); if (el) el.scrollTop = el.scrollHeight; }, 30); }
  ask(q) { const A = this.A(); q = String(q || '').trim(); if (!A || !q) return; if (!A.status().allowed) { this.setState({ limited: true, draft: '' }); this.bottom(); return; } A.ask(q); this.setState({ draft: '', n: this.state.n + 1, limited: false }); this.bottom(); }
  renderVals() {
    const A = this.A(), S = window.FV && window.FV.SIM, msgs = A ? A.messages() : [], st = A ? A.status() : { remaining: 5 }, lim = A ? A.limit() : 5, hist = A ? A.history() : [];
    const co = (q) => { if (!S) return null; const ql = q.toLowerCase(); return S.COMPANIES.map((c) => S.company(c.t)).filter((c) => c && (ql.indexOf(c.name.toLowerCase().split(' ')[0].toLowerCase()) >= 0 || ql.indexOf(c.t.toLowerCase()) >= 0))[0] || null; };
    const chips = (arr) => arr.map((t) => ({ t, go: () => this.ask(t) })), when = window.fvWhen || ((x) => '');
    const keep = !(window.FV && window.FV.ME.prefs().saveChats === false);
    return { empty: !msgs.length && !this.state.limited, limited: this.state.limited, starters: chips(A ? A.suggestions().slice(0, 4) : []),
      noHistory: !hist.length, keepNote: keep ? 'Saved on this device. Change this in Settings, Privacy and data.' : 'Chats are not saved: they go when you close this tab.',
      convs: hist.map((c) => ({ t: c.title, s: (c.current ? 'Open now · ' : '') + c.n + (c.n === 1 ? ' question' : ' questions') + ' · ' + when(c.at), cur: String(c.current), bg: c.current ? '#E8EBEF' : 'transparent', w: c.current ? '600' : '500',
        go: () => { if (c.current) return; if (A && A.open(c.id)) { this.setState({ n: this.state.n + 1, limited: false }); this.bottom(); } },
        delLabel: 'Delete conversation: ' + c.title, del: () => { if (A) { A.remove(c.id); this.setState({ n: this.state.n + 1 }); } } })),
      msgs: msgs.map((m, i) => { const c = m.r.kind === 'answer' ? co(m.q) : null, isLast = i === msgs.length - 1;
        const fol = (m.r.choices || []).map((x) => x.title).concat(m.r.followUps || []).slice(0, 3);
        return { q: m.q, paras: String(m.r.answer || '').split(/\n\n+/).map((t) => ({ t })),
          src: (m.r.citations || []).map((x) => ({ t: x.title, href: 'ArticleNavy.dc.html?a=' + x.articleSlug })), hasSrc: !!(m.r.citations || []).length,
          follow: chips(fol), hasFollow: isLast && !!fol.length,
          hasCo: !!c, coHref: c ? 'CompanyLaptopNavy.dc.html?t=' + c.t : '#', coName: c ? c.name : '', coT: c ? c.t : '', coP: c ? '₦' + (S.price(c.t) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '', zenShow: c && c.t === 'ZENITHBANK' ? 'flex' : 'none' }; }),
      ph: msgs.length ? 'Ask a follow-up' : 'Ask Finvora a question', draft: this.state.draft, noDraft: String(!this.state.draft.trim()), sendBg: this.state.draft.trim() ? '#10B981' : '#C0C6D0',
      left: lim === null ? 'Unlimited questions with Plus' : st.remaining + ' of ' + lim + ' free questions left today',
      onDraft: (e) => { this.setState({ draft: e.target.value }); },
      onKey: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.ask(this.state.draft); } },
      send: () => this.ask(this.state.draft),
      fresh: () => { if (A) A.clear(); this.setState({ n: this.state.n + 1, limited: false, draft: '' }); const t = document.getElementById('ask'); if (t) t.focus(); } };
  }
}'''

i = s.index('<main'); j = s.index('>', i) + 1; k = s.index('</main>', j)
s = s[:i] + '<main style="flex: 1; min-width: 0; height: 100%; padding: 0; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden">' + MAIN + s[k:]
a = s[s.index('class Component extends DCLogic {'):s.index('</script>', s.index('data-dc-script'))].rstrip() + '\n'
s = s.replace(a, JS + '\n', 1)
open(P, 'w').write(s); print('wired AskLaptopNavy')
