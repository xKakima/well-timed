"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ListingStatus,
  WatchListing,
  WatchListingImage,
} from "@/lib/supabase/database.types";

const maxPhotos = 6;
const maxPhotoSize = 5 * 1024 * 1024;
const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ListingPhotoPreview = WatchListingImage & { signedUrl: string | null };

export default function ListingManager() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [listings, setListings] = useState<WatchListing[]>([]);
  const [editing, setEditing] = useState<WatchListing | null>(null);
  const [editingPhotos, setEditingPhotos] = useState<ListingPhotoPreview[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
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

  function startNewListing() {
    setEditing(null);
    setEditingPhotos([]);
    setRemovedPhotoIds([]);
    setSelectedFiles([]);
    setMessage("");
  }

  async function startEditingListing(listing: WatchListing) {
    setEditing(listing);
    setEditingPhotos([]);
    setRemovedPhotoIds([]);
    setSelectedFiles([]);
    setMessage("");
    setLoadingPhotos(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: photos, error } = await supabase
        .from("watch_listing_images")
        .select("*")
        .eq("listing_id", listing.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Could not load listing photos.", error);
        setMessage("Listing details loaded, but its photos could not be loaded.");
        return;
      }

      if (photos.length === 0) {
        setEditingPhotos([]);
        return;
      }

      const { data: signedPhotos, error: signedUrlError } = await supabase.storage
        .from("watch-listing-photos")
        .createSignedUrls(photos.map((photo) => photo.object_path), 5 * 60);

      if (signedUrlError) {
        console.error("Could not create admin photo previews.", signedUrlError);
        setMessage("Listing details loaded, but photo previews could not be created.");
      }

      const signedUrls = new Map(
        (signedPhotos ?? []).map((photo) => [photo.path, photo.signedUrl]),
      );
      setEditingPhotos(
        photos.map((photo) => ({
          ...photo,
          signedUrl: signedUrls.get(photo.object_path) ?? null,
        })),
      );
    } catch (error) {
      console.error("Could not load listing photos.", error);
      setMessage("Listing details loaded, but its photos could not be loaded.");
    } finally {
      setLoadingPhotos(false);
    }
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

      const newFiles = selectedFiles;
      const remainingPhotos = editingPhotos.filter(
        (photo) => !removedPhotoIds.includes(photo.id),
      );
      if (remainingPhotos.length + newFiles.length > maxPhotos) {
        setMessage(`A listing can have at most ${maxPhotos} photos.`);
        return;
      }

      const invalidFile = newFiles.find(
        (file) =>
          !Object.hasOwn(photoExtensions, file.type) || file.size > maxPhotoSize,
      );
      if (invalidFile) {
        setMessage(
          "Photos must be JPEG, PNG, or WebP files no larger than 5 MB each.",
        );
        return;
      }

      const result = editing
        ? await supabase
            .from("watch_listings")
            .update(listing)
            .eq("id", editing.id)
            .select("*")
            .single()
        : await supabase
            .from("watch_listings")
            .insert({ ...listing, status: "draft" })
            .select("*")
            .single();
      const savedListing = "data" in result ? result.data : null;

      if (result.error || !savedListing) {
        console.error("Could not save watch listing.", result.error);
        setMessage("The listing could not be saved. Check the fields and try again.");
        return;
      }

      let photoWarning = "";

      const removedPhotos = editingPhotos.filter((photo) =>
        removedPhotoIds.includes(photo.id),
      );
      if (removedPhotos.length > 0) {
        const { error: deleteMetadataError } = await supabase
          .from("watch_listing_images")
          .delete()
          .in("id", removedPhotos.map((photo) => photo.id));

        if (deleteMetadataError) {
          console.error("Could not remove listing photo records.", deleteMetadataError);
          setEditing(savedListing);
          setMessage("The listing was saved, but selected photos could not be removed.");
          await refreshListings();
          return;
        }

        const { error: removeStorageError } = await supabase.storage
          .from("watch-listing-photos")
          .remove(removedPhotos.map((photo) => photo.object_path));
        if (removeStorageError) {
          console.error("Could not remove listing photo files.", removeStorageError);
          photoWarning = " Some removed photos may need storage cleanup.";
        }
      }

      const usedPositions = new Set(remainingPhotos.map((photo) => photo.position));
      const availablePositions = Array.from(
        { length: maxPhotos },
        (_, index) => index + 1,
      ).filter((position) => !usedPositions.has(position));
      const uploadedPaths: string[] = [];

      for (const file of newFiles) {
        const objectPath = `${savedListing.id}/${crypto.randomUUID()}.${photoExtensions[file.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("watch-listing-photos")
          .upload(objectPath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Could not upload listing photo.", uploadError);
          if (uploadedPaths.length > 0) {
            const { error: cleanupError } = await supabase.storage
              .from("watch-listing-photos")
              .remove(uploadedPaths);
            if (cleanupError) {
              console.error("Could not clean up incomplete photo uploads.", cleanupError);
            }
          }
          setEditing(savedListing);
          setMessage("The listing was saved, but photo upload failed. Please try again.");
          await refreshListings();
          return;
        }
        uploadedPaths.push(objectPath);
      }

      if (newFiles.length > 0) {
        const imageRecords = newFiles.map((_, index) => ({
          listing_id: savedListing.id,
          object_path: uploadedPaths[index],
          position: availablePositions[index],
          alt_text: `${savedListing.brand} ${savedListing.model}, photo ${remainingPhotos.length + index + 1}`,
        }));
        const { error: insertImagesError } = await supabase
          .from("watch_listing_images")
          .insert(imageRecords);

        if (insertImagesError) {
          console.error("Could not save listing photo records.", insertImagesError);
          const { error: cleanupError } = await supabase.storage
            .from("watch-listing-photos")
            .remove(uploadedPaths);
          if (cleanupError) {
            console.error("Could not clean up unlinked photo uploads.", cleanupError);
          }
          setEditing(savedListing);
          setMessage("The listing was saved, but photo details could not be saved.");
          await refreshListings();
          return;
        }
      }

      formRef.current?.reset();
      setEditing(null);
      setEditingPhotos([]);
      setRemovedPhotoIds([]);
      setSelectedFiles([]);
      setMessage(`${editing ? "Listing updated." : "Draft listing created."}${photoWarning}`);
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
              <button className="button-primary" disabled={saving || loadingPhotos} type="submit">
                {saving ? "Saving…" : editing ? "Save changes" : "Save as draft"}
              </button>
              {editing && (
                <button
                  className="button-secondary"
                  onClick={startNewListing}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>
            <section aria-labelledby="listing-photos-title" className="listing-photo-editor">
              <h3 id="listing-photos-title">Listing photos</h3>
              <p>Upload up to 6 JPEG, PNG, or WebP images, 5 MB each.</p>
              {loadingPhotos ? (
                <p role="status">Loading current photos…</p>
              ) : editingPhotos.length > 0 ? (
                <div className="admin-photo-grid">
                  {editingPhotos.map((photo) => {
                    const isRemoved = removedPhotoIds.includes(photo.id);
                    return (
                      <div
                        className={`admin-photo${isRemoved ? " admin-photo-removed" : ""}`}
                        key={photo.id}
                      >
                        {photo.signedUrl ? (
                          <Image
                            alt={photo.alt_text}
                            height={120}
                            src={photo.signedUrl}
                            unoptimized
                            width={160}
                          />
                        ) : (
                          <div className="admin-photo-missing">Preview unavailable</div>
                        )}
                        <button
                          className="text-button"
                          onClick={() =>
                            setRemovedPhotoIds((current) =>
                              isRemoved
                                ? current.filter((id) => id !== photo.id)
                                : [...current, photo.id],
                            )
                          }
                          type="button"
                        >
                          {isRemoved ? "Keep photo" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : editing ? (
                <p>No photos uploaded for this listing yet.</p>
              ) : (
                <p>Photos are private until the listing is published.</p>
              )}
              <>
                <label htmlFor="listing-photos">Add photos</label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={loadingPhotos}
                  id="listing-photos"
                  multiple
                  onChange={(event) => {
                    setSelectedFiles(Array.from(event.target.files ?? []));
                    setMessage("");
                  }}
                  type="file"
                />
                {selectedFiles.length > 0 && (
                  <ul className="selected-photo-list">
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}`}>
                        <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        <button
                          className="text-button"
                          onClick={() =>
                            setSelectedFiles((current) =>
                              current.filter((_, fileIndex) => fileIndex !== index),
                            )
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            </section>
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
                      onClick={() => void startEditingListing(listing)}
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
