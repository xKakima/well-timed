"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingStatus, WatchListing } from "@/lib/supabase/database.types";

export default function ListingManager() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [listings, setListings] = useState<WatchListing[]>([]);
  const [editing, setEditing] = useState<WatchListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function authorizeAndLoad() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!userData.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
        if (adminError) {
          console.error("Could not verify administrator access.", adminError);
          if (active) setMessage("Administrator access could not be verified. Reload to try again.");
          return;
        }

        if (!isAdmin) {
          await supabase.auth.signOut();
          router.replace("/admin/login?unauthorized=1");
          return;
        }

        const { data, error } = await supabase
          .from("watch_listings")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Could not load watch listings.", error);
          if (active) setMessage("We couldn't load listings. Please reload to try again.");
          return;
        }

        if (active) setListings(data);
      } catch (error) {
        console.error("Could not initialize the administrator area.", error);
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "The administrator service is unavailable. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void authorizeAndLoad();
    return () => {
      active = false;
    };
  }, [router]);

  async function refreshListings() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("watch_listings")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Could not refresh watch listings.", error);
      setMessage("The change was saved, but the list could not be refreshed. Reload the page.");
      return;
    }

    setListings(data);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const values = new FormData(event.currentTarget);
      const yearText = String(values.get("year") ?? "").trim();
      const year = yearText ? Number(yearText) : null;

      if (year !== null && (!Number.isInteger(year) || year < 1800 || year > 2200)) {
        setMessage("Enter a year between 1800 and 2200.");
        return;
      }

      const listing = {
        title: String(values.get("title") ?? "").trim(),
        brand: String(values.get("brand") ?? "").trim(),
        model: String(values.get("model") ?? "").trim(),
        reference_number: String(values.get("reference_number") ?? "").trim() || null,
        year,
        condition: String(values.get("condition") ?? "").trim(),
        description: String(values.get("description") ?? "").trim(),
      };

      const result = editing
        ? await supabase
            .from("watch_listings")
            .update(listing)
            .eq("id", editing.id)
        : await supabase
            .from("watch_listings")
            .insert({ ...listing, status: "draft" });

      if (result.error) {
        console.error("Could not save watch listing.", result.error);
        setMessage("The listing could not be saved. Check the fields and try again.");
        return;
      }

      formRef.current?.reset();
      setEditing(null);
      setMessage(editing ? "Listing updated." : "Draft listing created.");
      await refreshListings();
    } catch (error) {
      console.error("Could not save watch listing.", error);
      setMessage("The listing could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(listing: WatchListing, status: ListingStatus) {
    setMessage("");

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("watch_listings")
        .update({ status })
        .eq("id", listing.id);

      if (error) {
        console.error("Could not update watch listing status.", error);
        setMessage("The listing status could not be changed. Please try again.");
        return;
      }

      setMessage(
        status === "published"
          ? "Listing published."
          : status === "archived"
            ? "Listing archived."
            : "Listing moved back to drafts.",
      );
      await refreshListings();
    } catch (error) {
      console.error("Could not update watch listing status.", error);
      setMessage("The listing status could not be changed. Please try again.");
    }
  }

  async function signOut() {
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      router.replace("/admin/login");
    } catch (error) {
      console.error("Could not sign out administrator.", error);
      setMessage("Sign out failed. Please try again.");
    }
  }

  if (loading) {
    return <main className="admin-page"><p role="status">Checking administrator access…</p></main>;
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="back-link" href="/">Well Timed Collective</Link>
        <button className="button-secondary" onClick={signOut} type="button">Sign out</button>
      </header>
      <div className="admin-content">
        <p className="eyebrow">Administrator</p>
        <h1>Watch listings</h1>
        <p className="admin-intro">
          Create drafts, review details, and publish listings to the public collection.
        </p>

        <section aria-labelledby="listing-form-title" className="admin-panel">
          <h2 id="listing-form-title">{editing ? "Edit listing" : "Create a listing"}</h2>
          <form
            className="admin-form listing-form"
            key={editing?.id ?? "new"}
            onSubmit={handleSave}
            ref={formRef}
          >
            <label htmlFor="listing-title">Listing title</label>
            <input
              defaultValue={editing?.title ?? ""}
              id="listing-title"
              maxLength={120}
              minLength={2}
              name="title"
              required
            />
            <div className="form-row">
              <div>
                <label htmlFor="listing-brand">Brand</label>
                <input
                  defaultValue={editing?.brand ?? ""}
                  id="listing-brand"
                  maxLength={80}
                  minLength={2}
                  name="brand"
                  required
                />
              </div>
              <div>
                <label htmlFor="listing-model">Model</label>
                <input
                  defaultValue={editing?.model ?? ""}
                  id="listing-model"
                  maxLength={100}
                  name="model"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label htmlFor="listing-reference">Reference number</label>
                <input
                  defaultValue={editing?.reference_number ?? ""}
                  id="listing-reference"
                  maxLength={80}
                  name="reference_number"
                />
              </div>
              <div>
                <label htmlFor="listing-year">Year</label>
                <input
                  defaultValue={editing?.year ?? ""}
                  id="listing-year"
                  max={2200}
                  min={1800}
                  name="year"
                  type="number"
                />
              </div>
            </div>
            <label htmlFor="listing-condition">Condition</label>
            <input
              defaultValue={editing?.condition ?? ""}
              id="listing-condition"
              maxLength={100}
              minLength={2}
              name="condition"
              required
            />
            <label htmlFor="listing-description">Description</label>
            <textarea
              defaultValue={editing?.description ?? ""}
              id="listing-description"
              maxLength={5000}
              name="description"
              required
              rows={5}
            />
            <div className="form-actions">
              <button className="button-primary" disabled={saving} type="submit">
                {saving ? "Saving…" : editing ? "Save changes" : "Save as draft"}
              </button>
              {editing && (
                <button
                  className="button-secondary"
                  onClick={() => setEditing(null)}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section aria-labelledby="listing-list-title" className="managed-listings">
          <h2 id="listing-list-title">All listings</h2>
          {message && <p className="form-message" role="status">{message}</p>}
          {listings.length === 0 ? (
            <p className="notice">No listings yet. Create a draft to get started.</p>
          ) : (
            <div className="managed-listing-grid">
              {listings.map((listing) => (
                <article className="managed-listing" key={listing.id}>
                  <div className="managed-listing-heading">
                    <span className={`status-badge status-${listing.status}`}>
                      {listing.status}
                    </span>
                    <span className="listing-meta">{listing.brand}</span>
                  </div>
                  <h3>{listing.title}</h3>
                  <p className="listing-model">{listing.model}</p>
                  <div className="managed-listing-actions">
                    <button
                      className="text-button"
                      onClick={() => setEditing(listing)}
                      type="button"
                    >
                      Edit
                    </button>
                    {listing.status !== "published" && (
                      <button
                        className="text-button"
                        onClick={() => void changeStatus(listing, "published")}
                        type="button"
                      >
                        Publish
                      </button>
                    )}
                    {listing.status === "published" && (
                      <button
                        className="text-button"
                        onClick={() => void changeStatus(listing, "draft")}
                        type="button"
                      >
                        Unpublish
                      </button>
                    )}
                    {listing.status !== "archived" && (
                      <button
                        className="text-button"
                        onClick={() => void changeStatus(listing, "archived")}
                        type="button"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
