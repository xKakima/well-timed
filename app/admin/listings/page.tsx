import type { Metadata } from "next";
import ListingManager from "./listing-manager";

export const metadata: Metadata = {
  title: "Manage watch listings",
  robots: { index: false, follow: false },
};

export default function AdminListingsPage() {
  return <ListingManager />;
}
