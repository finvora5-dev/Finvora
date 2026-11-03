import { SIM_COMPANIES } from "@finvora/sample-data";
import { SimCompanyView } from "./SimCompanyView";

export function generateStaticParams() {
  return SIM_COMPANIES.map((c) => ({ ticker: c.ticker }));
}

export default async function Page({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return <SimCompanyView ticker={ticker} />;
}
