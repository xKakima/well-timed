export type SupabaseConfiguration =
  | { configured: true; url: string; key: string }
  | { configured: false; error: string };

export function getSupabaseConfiguration(): SupabaseConfiguration {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      configured: false,
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.",
    };
  }

  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.hostname !== "localhost" &&
      parsedUrl.hostname !== "127.0.0.1"
    ) {
      return {
        configured: false,
        error: "The Supabase URL must use HTTPS, except for local development.",
      };
    }
  } catch {
    return { configured: false, error: "The configured Supabase project URL is invalid." };
  }

  return { configured: true, url, key };
}
