export type ListingStatus = "draft" | "published" | "archived";

export type WatchListing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  reference_number: string | null;
  year: number | null;
  condition: string;
  description: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

type WatchListingInsert = Omit<WatchListing, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      watch_listings: {
        Row: WatchListing;
        Insert: WatchListingInsert;
        Update: Partial<WatchListingInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
