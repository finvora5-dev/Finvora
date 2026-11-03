import { COMPANIES } from "@finvora/sample-data";
import { CompanyView } from "./CompanyView";

export function generateStaticParams() {
  return COMPANIES.map((c) => ({ ticker: c.ticker }));
}

export default async function Page({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return <CompanyView ticker={ticker} />;
}
