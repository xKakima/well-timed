import type { Metadata } from "next";
import WatchCatalog from "./watch-catalog";

export const metadata: Metadata = {
  title: "Watches",
  description: "Explore the considered collection at Well Timed Collective.",
};

type HomePageProps = {
  searchParams: Promise<{ brand?: string }>;
};

export default function HomePage({ searchParams }: HomePageProps) {
  return <WatchCatalog searchParams={searchParams} />;
}
