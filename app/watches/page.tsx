import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import Link from "next/link";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfiguration } from "@/lib/supabase/config";

export const metadata = {
  title: "Watches",
  description: "Explore the considered collection at Well Timed Collective.",
};

export default async function WatchesPage() {
  await connection();
  const configuration = getSupabaseConfiguration();

  if (!configuration.configured) {
    return (
      <main className="catalog-page">
        <Link className="back-link" href="/">Well Timed Collective</Link>
        <h1>Our collection</h1>
        <p className="notice" role="status">{configuration.error}</p>
      </main>
    );
  }

  const supabase = createClient<Database, "public">(configuration.url, configuration.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: listings, error } = await supabase
    .from("watch_listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load published watch listings.", error);
  }

  return (
    <main className="catalog-page">
      <Link className="back-link" href="/">Well Timed Collective</Link>
      <p className="eyebrow">A considered collection</p>
      <h1>Watches, well chosen.</h1>
      <p className="catalog-intro">
        Discover exceptional timepieces selected with care.
      </p>

      {error ? (
        <p className="notice" role="alert">
          We couldn&apos;t load the collection just now. Please try again later.
        </p>
      ) : listings.length === 0 ? (
        <p className="notice">The collection is taking shape. Please check back soon.</p>
      ) : (
        <section aria-label="Published watch listings" className="listing-grid">
          {listings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <p className="eyebrow">{listing.brand}</p>
              <h2>{listing.title}</h2>
              <p className="listing-model">{listing.model}</p>
              {listing.reference_number && (
                <p className="listing-meta">Ref. {listing.reference_number}</p>
              )}
              {listing.year && <p className="listing-meta">{listing.year}</p>}
              <p className="listing-condition">{listing.condition}</p>
              <p className="listing-description">{listing.description}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
