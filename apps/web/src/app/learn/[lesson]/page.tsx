import { LESSONS } from "@finvora/sample-data";
import { LessonPlayer } from "./LessonPlayer";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ lesson: l.id }));
}

export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  return <LessonPlayer id={lesson} />;
}
