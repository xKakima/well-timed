import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfiguration } from "@/lib/supabase/config";

export const metadata = {
  title: "Watches",
  description: "Explore the considered collection at Well Timed Collective.",
};

type WatchesPageProps = {
  searchParams: Promise<{ brand?: string }>;
};

export default async function WatchesPage({ searchParams }: WatchesPageProps) {
  await connection();
  const { brand: brandFilter } = await searchParams;
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

  const brands = [...new Set((listings ?? []).map((listing) => listing.brand))]
    .sort((left, right) => left.localeCompare(right));
  const selectedBrand = brands.includes(brandFilter ?? "") ? brandFilter : "";
  const visibleListings = selectedBrand
    ? (listings ?? []).filter((listing) => listing.brand === selectedBrand)
    : (listings ?? []);

  const photosByListing = new Map<string, { path: string; alt: string; url: string }[]>();
  if (visibleListings.length > 0) {
    const listingIds = visibleListings.map((listing) => listing.id);
    const { data: photos, error: photosError } = await supabase
      .from("watch_listing_images")
      .select("listing_id, object_path, position, alt_text")
      .in("listing_id", listingIds)
      .order("position", { ascending: true });

    if (photosError) {
      console.error("Could not load published watch photos.", photosError);
    } else if (photos.length > 0) {
      const { data: signedPhotos, error: signedUrlError } = await supabase.storage
        .from("watch-listing-photos")
        .createSignedUrls(
          photos.map((photo) => photo.object_path),
          5 * 60,
        );

      if (signedUrlError) {
        console.error("Could not create watch photo URLs.", signedUrlError);
      } else {
        const signedUrls = new Map(
          signedPhotos.map((photo) => [photo.path, photo.signedUrl]),
        );

        for (const photo of photos) {
          const url = signedUrls.get(photo.object_path);
          if (!url) continue;

          const listingPhotos = photosByListing.get(photo.listing_id) ?? [];
          listingPhotos.push({
            path: photo.object_path,
            alt: photo.alt_text,
            url,
          });
          photosByListing.set(photo.listing_id, listingPhotos);
        }
      }
    }
  }

  return (
    <main className="catalog-page">
      <Link className="back-link" href="/">Well Timed Collective</Link>
      <p className="eyebrow">A considered collection</p>
      <h1>Watches, well chosen.</h1>
      <p className="catalog-intro">
        Discover exceptional timepieces selected with care.
      </p>

      {!error && brands.length > 0 && (
        <form action="/watches" className="brand-filter" method="get">
          <label htmlFor="brand-filter">Browse by brand</label>
          <select
            defaultValue={selectedBrand}
            id="brand-filter"
            name="brand"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <button className="button-secondary" type="submit">Filter</button>
          {selectedBrand && <Link className="text-button" href="/watches">Clear filter</Link>}
        </form>
      )}

      {error ? (
        <p className="notice" role="alert">
          We couldn&apos;t load the collection just now. Please try again later.
        </p>
      ) : listings.length === 0 ? (
        <p className="notice">The collection is taking shape. Please check back soon.</p>
      ) : visibleListings.length === 0 ? (
        <p className="notice">No published watches match this brand yet.</p>
      ) : (
        <section aria-label="Published watch listings" className="listing-grid">
          {visibleListings.map((listing) => {
            const photos = photosByListing.get(listing.id) ?? [];

            return (
            <article className="listing-card" key={listing.id}>
              {photos.length > 0 ? (
                <div className="listing-photo-gallery">
                  {photos.map((photo, index) => (
                    <Image
                      alt={photo.alt}
                      className={index === 0 ? "listing-photo-primary" : "listing-photo-secondary"}
                      height={720}
                      key={photo.path}
                      src={photo.url}
                      unoptimized
                      width={900}
                    />
                  ))}
                </div>
              ) : (
                <div aria-label="No watch photos available" className="listing-photo-placeholder">
                  Photography to follow
                </div>
              )}
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
            );
          })}
        </section>
      )}
    </main>
  );
}
