"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfiguration } from "./config";

let browserClient: SupabaseClient<Database, "public"> | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database, "public"> {
  if (browserClient) return browserClient;

  const configuration = getSupabaseConfiguration();
  if (!configuration.configured) throw new Error(configuration.error);

  browserClient = createClient<Database, "public">(configuration.url, configuration.key);
  return browserClient;
}
