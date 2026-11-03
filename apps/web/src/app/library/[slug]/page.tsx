import { ARTICLES } from "@finvora/sample-data";
import { ArticleView } from "./ArticleView";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArticleView slug={slug} />;
}
