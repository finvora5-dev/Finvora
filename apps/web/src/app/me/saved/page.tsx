"use client";
import Link from "next/link";
import { Screen, TopBar, Empty, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { update, useStore } from "@/lib/store";

export default function Saved() {
  const lib = useStore("library");
  const toast = useToast();
  const remove = (slug: string) => {
    update("library", (l) => ({ ...l, saved: l.saved.filter((s) => s !== slug) }));
    toast("Removed from saved", () => update("library", (l) => (l.saved.includes(slug) ? l : { ...l, saved: [...l.saved, slug] })));
  };
  return (
    <Screen top={<TopBar back="/me/" title="Saved articles" />}>
      {lib.saved.length === 0 ? <Empty title="Nothing saved yet" body="Tap the bookmark on any article to keep it here." action={<Link href="/library/" className="btn btn-sm">Browse the Library</Link>} /> : (
        <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {lib.saved.map((s) => { const a = api.article(s); if (!a) return null; return (
            <li key={s} className="row" style={{ paddingRight: 6 }}>
              <Link href={`/library/${s}/`} className="li grow"><span className="grow"><strong style={{ display: "block" }}>{a.title}</strong><span className="small muted">{a.category}</span></span></Link>
              <button type="button" className="icon-btn" aria-label={`Remove ${a.title} from saved`} onClick={() => remove(s)}><Icon name="close" size={20} /></button>
            </li>); })}
        </ul>
      )}
    </Screen>
  );
}
