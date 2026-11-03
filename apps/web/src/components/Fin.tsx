// Fin, the mascot. Ported from the canvas GKobo component; illustrations keep their own colours.
type Mood = "happy" | "talk" | "wave" | "think" | "cheer" | "proud" | "oops" | "confused" | "sleep";

const down = "M20 66q-8 6-6 16", downR = "M100 66q8 6 6 16", up = "M22 52q-12-8-10-22", upR = "M98 52q12-8 10-22";
const base = { eyesOpen: true, eyesHappy: false, eyesShut: false, eyeRy: 11, px: 0, py: 0, brows: "", blush: 0.7, mouth: "M46 70q14 12 28 -2", fill: "none", armL: down, armR: downR, anim: "kb-breathe", sparkle: false, sweat: false, qmark: false, dots: false, label: "Fin" };
const MOODS: Record<Mood, Partial<typeof base>> = {
  happy: { label: "Fin, smiling" },
  talk: { label: "Fin, explaining", mouth: "M48 69q12 14 26 0z", fill: "#0B1F44", armR: "M98 62q14 -2 14 -16" },
  wave: { label: "Fin, waving hello", armR: "M98 58q14 -10 12 -26", mouth: "M46 69q14 14 28 0z", fill: "#0B1F44" },
  think: { label: "Fin, thinking", px: 2, py: -4, brows: "M38 38 q8 -4 16 0 M66 36 q8 -6 16 -2", mouth: "M52 74 q8 -3 16 0", armR: "M98 70 q-6 10 -20 10", dots: true, anim: "" },
  cheer: { label: "Fin, cheering", eyesOpen: false, eyesHappy: true, mouth: "M44 68q16 20 32 0z", fill: "#0B1F44", armL: up, armR: upR, anim: "kb-bob", sparkle: true },
  proud: { label: "Fin, proud", eyesOpen: false, eyesHappy: true, armL: up, armR: upR, sparkle: true, blush: 1 },
  oops: { label: "Fin, encouraging", py: 2, eyeRy: 10, brows: "M38 40 q8 -6 16 -2 M66 38 q8 -4 16 2", mouth: "M54 74a6 5 0 1 0 12 0a6 5 0 1 0-12 0", fill: "#0B1F44", armL: "M22 60q-10 2-12 12", armR: "M98 60q10 2 12 12", sweat: true, anim: "" },
  confused: { label: "Fin, confused", px: -2, brows: "M38 42 h16 M66 34 q8 -4 16 2", mouth: "M48 74 q4 -4 8 0 q4 4 8 0 q4 -4 8 0", qmark: true, anim: "" },
  sleep: { label: "Fin, asleep", eyesOpen: false, eyesShut: true, mouth: "M55 74 q5 3 10 0", blush: 0.4 },
};

export function Fin({ mood = "happy", size = 64, decorative = true }: { mood?: Mood; size?: number; decorative?: boolean }) {
  const m = { ...base, ...MOODS[mood] };
  return (
    <svg className={m.anim} width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible", flex: "none" }} role={decorative ? undefined : "img"} aria-hidden={decorative ? true : undefined} aria-label={decorative ? undefined : m.label}>
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#0B1F44" opacity="0.12" />
      <path d={m.armL} fill="none" stroke="#0F55C9" strokeWidth="8" strokeLinecap="round" />
      <path d={m.armR} fill="none" stroke="#0F55C9" strokeWidth="8" strokeLinecap="round" />
      <rect x="44" y="96" width="10" height="14" rx="5" fill="#0F55C9" /><rect x="66" y="96" width="10" height="14" rx="5" fill="#0F55C9" />
      <circle cx="60" cy="62" r="42" fill="#0F55C9" />
      <circle cx="60" cy="58" r="42" fill="#1A73F5" />
      <circle cx="60" cy="58" r="33" fill="none" stroke="#9CC3FF" strokeWidth="3" strokeDasharray="4 5" />
      <path d="M30 40c6-10 16-16 26-17" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      {m.eyesOpen && (<>
        <ellipse cx="46" cy="52" rx="9" ry={m.eyeRy} fill="#FFFFFF" /><ellipse cx="74" cy="52" rx="9" ry={m.eyeRy} fill="#FFFFFF" />
        <circle cx={48 + m.px} cy={54 + m.py} r="4.6" fill="#0B1F44" /><circle cx={76 + m.px} cy={54 + m.py} r="4.6" fill="#0B1F44" />
        <circle cx={49.5 + m.px} cy={52 + m.py} r="1.6" fill="#FFFFFF" /><circle cx={77.5 + m.px} cy={52 + m.py} r="1.6" fill="#FFFFFF" />
      </>)}
      {m.eyesHappy && <path d="M38 55 q8 -10 16 0 M66 55 q8 -10 16 0" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />}
      {m.eyesShut && <path d="M38 54 q8 6 16 0 M66 54 q8 6 16 0" fill="none" stroke="#0B1F44" strokeWidth="4" strokeLinecap="round" />}
      {m.brows && <path d={m.brows} fill="none" stroke="#0B1F44" strokeWidth="4" strokeLinecap="round" />}
      <circle cx="36" cy="68" r="5" fill="#FF8FA3" opacity={m.blush} /><circle cx="84" cy="68" r="5" fill="#FF8FA3" opacity={m.blush} />
      <path d={m.mouth} fill={m.fill} stroke="#0B1F44" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {m.sparkle && (<>
        <path d="M14 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#9CC3FF" />
        <path d="M104 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#FF8A65" />
        <path d="M110 46 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#7B4AF0" />
      </>)}
      {m.dots && (<><circle cx="96" cy="20" r="3" fill="#9CC3FF" /><circle cx="104" cy="11" r="4.5" fill="#9CC3FF" /><circle cx="114" cy="0" r="6" fill="#9CC3FF" /></>)}
      {m.sweat && <path d="M92 30 q-6 9 0 12 q6 -3 0 -12z" fill="#7FC8FF" />}
      {m.qmark && <text x="94" y="20" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="26" fontWeight="800" fill="#7B4AF0">?</text>}
    </svg>
  );
}
